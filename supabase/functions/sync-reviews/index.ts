import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Crypto Encryption Helpers
async function getCryptoKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", passwordBytes);
  return await crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptText(text: string, password: string): Promise<string> {
  const key = await getCryptoKey(password);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...result));
}

async function decryptText(base64: string, password: string): Promise<string> {
  const key = await getCryptoKey(password);
  const data = new Uint8Array(
    atob(base64).split("").map((c) => c.charCodeAt(0))
  );
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Google OAuth Token Rotation Helper
async function rotateAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth client credentials for token rotation");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to rotate access token: ${errText}`);
  }

  return await response.json();
}

// Network Request Retry Wrapper
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 500): Promise<Response> {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        throw new Error("Quota Exceeded (429)");
      }
      if (response.status >= 500) {
        throw new Error(`Server Error: ${response.status}`);
      }
      return response;
    } catch (err: any) {
      lastError = err;
      if (err.message.includes("Quota Exceeded")) {
        throw err; // Short circuit on 429
      }
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError || new Error("Failed after retries");
}

Deno.serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // Initialize DB Client using Admin role to access tokens and logs securely
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  const encryptionPassword = Deno.env.get("VAULT_ENCRYPTION_KEY") || "default-secret-password-32-chars!!";

  // --- HEALTH CHECK ROUTE ---
  if (req.method === "GET" && path.endsWith("/health")) {
    try {
      const dbStart = performance.now();
      const { data: dbCheck, error: dbError } = await supabaseAdmin
        .from("google_review_settings")
        .select("count")
        .limit(1)
        .maybeSingle();
      const dbDuration = performance.now() - dbStart;

      if (dbError) throw dbError;

      const hasApiKey = !!Deno.env.get("GOOGLE_PLACES_API_KEY") || !!Deno.env.get("GOOGLE_MAPS_API_KEY");
      const hasOAuth = !!Deno.env.get("GOOGLE_CLIENT_ID") && !!Deno.env.get("GOOGLE_CLIENT_SECRET");

      return new Response(
        JSON.stringify({
          status: "healthy",
          database: {
            connected: true,
            latency_ms: Math.round(dbDuration),
          },
          google_api: {
            configured: hasApiKey || hasOAuth,
            connectivity: hasApiKey ? "ready" : "simulated_mode",
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ status: "unhealthy", error: err.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // --- METRICS REPORT ROUTE ---
  if (req.method === "GET" && path.endsWith("/metrics")) {
    try {
      // Query metrics from google_reviews and activity_logs
      const { count: totalReviews } = await supabaseAdmin
        .from("google_reviews")
        .select("*", { count: "exact", head: true });

      const { data: syncLogs } = await supabaseAdmin
        .from("activity_logs")
        .select("action, details")
        .eq("module", "reviews")
        .limit(100);

      let totalDuration = 0;
      let syncsCount = 0;
      let successCount = 0;
      let failCount = 0;
      let quotaBlocks = 0;

      if (syncLogs) {
        syncLogs.forEach((log: any) => {
          if (log.action === "sync") {
            const details = log.details || {};
            syncsCount++;
            if (details.status === "success") {
              successCount++;
            } else {
              failCount++;
              if (details.error && details.error.includes("quota")) {
                quotaBlocks++;
              }
            }
            if (details.duration_ms) {
              totalDuration += details.duration_ms;
            }
          }
        });
      }

      const avgDuration = syncsCount > 0 ? Math.round(totalDuration / syncsCount) : 0;
      const successRate = syncsCount > 0 ? Math.round((successCount / syncsCount) * 100) : 100;

      return new Response(
        JSON.stringify({
          total_reviews_synced: totalReviews || 0,
          average_sync_duration_ms: avgDuration,
          success_rate_percent: successRate,
          failures_count: failCount,
          quota_exceeded_count: quotaBlocks,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // --- WEBHOOK POST ROUTE ---
  if (req.method === "POST" && path.endsWith("/webhook")) {
    try {
      const payload = await req.json();
      // Handle Google Business Profile webhook push notifications
      const { review, location_name, place_id } = payload;
      if (!review || !review.name || !place_id) {
        throw new Error("Invalid webhook payload format");
      }

      // Find location and matching owner
      const { data: locationRecord, error: locErr } = await supabaseAdmin
        .from("google_review_locations")
        .select("id, user_id")
        .eq("place_id", place_id)
        .maybeSingle();

      if (locErr || !locationRecord) {
        throw new Error(`Location not connected for place ID: ${place_id}`);
      }

      const mapped = {
        user_id: locationRecord.user_id,
        location_id: locationRecord.id,
        google_review_id: review.name,
        reviewer_name: review.authorAttribution?.displayName || "Google User",
        reviewer_photo: review.authorAttribution?.photoUri || null,
        rating: review.rating,
        review_text: review.comment || review.text?.text || null,
        review_date: review.createTime || new Date().toISOString(),
        location_name: location_name || "Connected Location",
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabaseAdmin
        .from("google_reviews")
        .upsert(mapped, { onConflict: "google_review_id" });

      if (upsertErr) throw upsertErr;

      return new Response(JSON.stringify({ success: true, message: "Webhook review processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // --- MAIN SYNC OPERATION ---
  let user: any = null;
  const startTime = performance.now();
  let apiRequests = 0;
  let errorCount = 0;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: { user: authedUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !authedUser) {
      throw new Error("Unauthorized: Invalid session");
    }
    user = authedUser;

    // Parse options from body (if POST payload is present)
    let bodyOptions: any = {};
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        bodyOptions = await req.json();
      } catch {
        // ignore empty body
      }
    }

    const { dry_run = false, target_location_id = null } = bodyOptions;

    // Fetch user profile to verify role (super_admin has global access)
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, role, full_name")
      .eq("user_id", user.id)
      .single();

    // Determine target location(s) to sync
    let locationsQuery = supabaseAdmin
      .from("google_review_locations")
      .select("*");

    if (target_location_id) {
      if (callerProfile?.role !== "super_admin") {
        throw new Error("Forbidden: Only master administrators can sync specific target locations");
      }
      locationsQuery = locationsQuery.eq("id", target_location_id);
    } else {
      locationsQuery = locationsQuery.eq("user_id", user.id);
    }

    const { data: locations, error: locsErr } = await locationsQuery;
    if (locsErr) throw locsErr;

    if (!locations || locations.length === 0) {
      // If no explicit locations exist, seed a default location from global reviews settings to ensure backward compatibility
      const { data: settings } = await supabaseAdmin
        .from("google_review_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settings?.is_connected && settings.business_name) {
        // Seed default location
        const { data: seededLocation, error: seedErr } = await supabaseAdmin
          .from("google_review_locations")
          .insert({
            user_id: user.id,
            place_id: `place_${user.id.slice(0, 8)}`,
            business_name: settings.business_name,
            location: settings.location || "Connected Location",
            is_connected: true,
          })
          .select()
          .single();

        if (!seedErr && seededLocation) {
          locations.push(seededLocation);
        }
      }
    }

    if (!locations || locations.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No connected locations found to sync." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Write START log to activity_logs
    await supabaseAdmin.from("activity_logs").insert({
      user_id: callerProfile?.id || null,
      user_name: callerProfile?.full_name || "System",
      user_role: callerProfile?.role || "user",
      module: "reviews",
      action: "sync_start",
      details: {
        dry_run,
        locations_count: locations.length,
      },
    });

    const syncReport: any[] = [];
    let overallSuccess = true;
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;

    for (const loc of locations) {
      // 1. Sync Lock mechanism (prevents concurrent syncs within 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      if (loc.sync_status === "syncing" && loc.updated_at > tenMinutesAgo) {
        syncReport.push({
          location_id: loc.id,
          business_name: loc.business_name,
          status: "skipped",
          error: "Synchronization already in progress.",
        });
        continue;
      }

      // Check if disabled by Dead Letter Queue
      if (loc.consecutive_failures >= 5) {
        syncReport.push({
          location_id: loc.id,
          business_name: loc.business_name,
          status: "skipped",
          error: "Synchronization disabled due to consecutive failures (Dead Letter Queue lock). Contact support.",
        });
        continue;
      }

      if (!dry_run) {
        // Acquire Lock
        await supabaseAdmin
          .from("google_review_locations")
          .update({ sync_status: "syncing", updated_at: new Date().toISOString() })
          .eq("id", loc.id);
      }

      try {
        let reviewsList: any[] = [];
        const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");

        // 2. Fetch from Google API / Rotate token
        if (googleApiKey && googleApiKey !== "YOUR_GOOGLE_API_KEY") {
          // Fetch Place ID via Search
          let placeId = loc.place_id;
          if (placeId.startsWith("place_")) {
            const searchUrl = "https://places.googleapis.com/v1/places:searchText";
            apiRequests++;
            const searchRes = await fetchWithRetry(searchUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": googleApiKey,
                "X-Goog-FieldMask": "places.id",
              },
              body: JSON.stringify({ textQuery: `${loc.business_name} ${loc.location}` }),
            });

            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.places && searchData.places.length > 0) {
                placeId = searchData.places[0].id;
              }
            }
          }

          // Fetch reviews from Place Details
          const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews&key=${googleApiKey}`;
          apiRequests++;
          const detailsRes = await fetchWithRetry(detailsUrl, { method: "GET" });

          if (!detailsRes.ok) {
            throw new Error(`Google API responded with status ${detailsRes.status}`);
          }

          const detailsData = await detailsRes.json();
          reviewsList = detailsData.reviews || [];
        } else {
          // Simulated fallback matching connected business details
          reviewsList = [
            {
              name: `review_sim_${loc.id}_1`,
              rating: 5,
              createTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
              comment: `Excellent service at ${loc.business_name}! Highly recommended.`,
              authorAttribution: { displayName: "Alice Smith", photoUri: null },
            },
            {
              name: `review_sim_${loc.id}_2`,
              rating: 4,
              createTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              comment: "Very professional team and fast turnaround.",
              authorAttribution: { displayName: "Bob Jones", photoUri: null },
            },
            {
              name: `review_sim_${loc.id}_3`,
              rating: 2,
              createTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
              comment: "Had some communication delays. Hopefully it gets resolved.",
              authorAttribution: { displayName: "Charlie Brown", photoUri: null },
            },
          ];
        }

        // Apply 100ms throttle request delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Get local DB reviews for comparison
        const { data: dbReviews } = await supabaseAdmin
          .from("google_reviews")
          .select("id, google_review_id, rating, review_text, is_active")
          .eq("location_id", loc.id);

        const dbReviewsMap = new Map<string, any>();
        if (dbReviews) {
          dbReviews.forEach((r) => dbReviewsMap.set(r.google_review_id, r));
        }

        const toUpsert: any[] = [];
        const apiIds = new Set<string>();

        let added = 0;
        let updated = 0;

        for (const rev of reviewsList) {
          const revId = rev.name;
          apiIds.add(revId);

          const rating = rev.rating;
          const text = rev.comment || rev.text?.text || "";

          // Incremental check: if updated since last_synced_at
          const updateTime = rev.createTime || new Date().toISOString();
          if (loc.last_synced_at && new Date(updateTime) < new Date(loc.last_synced_at)) {
            continue; // Skip older review
          }

          const existing = dbReviewsMap.get(revId);
          if (!existing) {
            // New Review
            added++;
            toUpsert.push({
              user_id: loc.user_id,
              location_id: loc.id,
              google_review_id: revId,
              reviewer_name: rev.authorAttribution?.displayName || "Google Reviewer",
              reviewer_photo: rev.authorAttribution?.photoUri || null,
              rating,
              review_text: text,
              review_date: updateTime,
              location_name: loc.location,
              is_active: true,
              status: "new",
            });
          } else if (existing.rating !== rating || existing.review_text !== text || !existing.is_active) {
            // Updated Review
            updated++;
            toUpsert.push({
              id: existing.id,
              user_id: loc.user_id,
              location_id: loc.id,
              google_review_id: revId,
              reviewer_name: rev.authorAttribution?.displayName || "Google Reviewer",
              reviewer_photo: rev.authorAttribution?.photoUri || null,
              rating,
              review_text: text,
              review_date: updateTime,
              location_name: loc.location,
              is_active: true,
              status: "pending_reply", // Flag for review update
            });
          }
        }

        // Soft-delete detection: Reviews in DB not returned by Google Places API anymore
        const toDeactivate: string[] = [];
        let deleted = 0;
        if (dbReviews) {
          dbReviews.forEach((r) => {
            if (r.is_active && !apiIds.has(r.google_review_id) && !r.google_review_id.startsWith("review_sim_")) {
              toDeactivate.push(r.id);
              deleted++;
            }
          });
        }

        if (!dry_run) {
          if (toUpsert.length > 0) {
            const { error: upsertErr } = await supabaseAdmin.from("google_reviews").upsert(toUpsert);
            if (upsertErr) throw upsertErr;
          }

          if (toDeactivate.length > 0) {
            const { error: deacErr } = await supabaseAdmin
              .from("google_reviews")
              .update({ is_active: false })
              .in("id", toDeactivate);
            if (deacErr) throw deacErr;
          }

          // Update Location settings with successful sync results
          await supabaseAdmin
            .from("google_review_locations")
            .update({
              sync_status: "success",
              sync_error: null,
              last_synced_at: new Date().toISOString(),
              total_reviews_synced: (loc.total_reviews_synced || 0) + added + updated,
              consecutive_failures: 0, // Reset DLQ count
            })
            .eq("id", loc.id);

          // Update overall user settings for reviews
          await supabaseAdmin
            .from("google_review_settings")
            .update({
              sync_status: "success",
              sync_error: null,
              last_synced_at: new Date().toISOString(),
              total_reviews_synced: (loc.total_reviews_synced || 0) + added + updated,
            })
            .eq("user_id", loc.user_id);
        }

        totalAdded += added;
        totalUpdated += updated;
        totalDeleted += deleted;

        syncReport.push({
          location_id: loc.id,
          business_name: loc.business_name,
          status: "success",
          added,
          updated,
          deleted,
        });

      } catch (err: any) {
        errorCount++;
        overallSuccess = false;
        console.error(`Sync failed for location ${loc.business_name}:`, err);

        const isQuotaExceeded = err.message.includes("Quota Exceeded") || err.message.includes("429");
        const errMsg = isQuotaExceeded ? "Google API quota exceeded (429)" : err.message;

        if (!dry_run) {
          // Increment Dead Letter Queue tracker
          const nextFailCount = (loc.consecutive_failures || 0) + 1;
          const dlqDisabled = nextFailCount >= 5;

          await supabaseAdmin
            .from("google_review_locations")
            .update({
              sync_status: "failed",
              sync_error: errMsg,
              consecutive_failures: nextFailCount,
              is_connected: dlqDisabled ? false : loc.is_connected, // Disable sync if DLQ limit hit
            })
            .eq("id", loc.id);

          await supabaseAdmin
            .from("google_review_settings")
            .update({
              sync_status: "failed",
              sync_error: errMsg,
            })
            .eq("user_id", loc.user_id);
        }

        syncReport.push({
          location_id: loc.id,
          business_name: loc.business_name,
          status: "failed",
          error: errMsg,
        });
      }
    }

    const duration = performance.now() - startTime;

    // Log sync operation outcome into activity_logs
    await supabaseAdmin.from("activity_logs").insert({
      user_id: callerProfile?.id || null,
      user_name: callerProfile?.full_name || "System",
      user_role: callerProfile?.role || "user",
      module: "reviews",
      action: "sync",
      details: {
        status: overallSuccess ? "success" : "failed",
        duration_ms: Math.round(duration),
        requests_count: apiRequests,
        errors_count: errorCount,
        added: totalAdded,
        updated: totalUpdated,
        deleted: totalDeleted,
        report: syncReport,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: Math.round(duration),
        api_requests: apiRequests,
        errors_count: errorCount,
        added: totalAdded,
        updated: totalUpdated,
        deleted: totalDeleted,
        report: syncReport,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err: any) {
    console.error("Critical sync controller error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
