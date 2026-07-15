import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-timestamp, x-hub-signature-256",
};

// Web Crypto HMAC Verification Helper
async function verifyHMACSignature(secret: string, bodyText: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Convert hex signature to Uint8Array
  const sigHex = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  const sigBytes = new Uint8Array(
    sigHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  return await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(bodyText)
  );
}

// Request Hashing for Idempotency
async function computeSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // Initialize Admin DB Client
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  // --- 1. WEBHOOK VERIFICATION (GET Handshake for Meta/Facebook) ---
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Standard Meta verification
    if (mode === "subscribe" && token === "guardian_meta_token") {
      return new Response(challenge, { status: 200 });
    }

    // --- 2. GOOGLE SHEETS EXPORT ENDPOINT (GET /export) ---
    if (path.endsWith("/export")) {
      try {
        const authHeader = req.headers.get("Authorization") || url.searchParams.get("token");
        if (!authHeader) {
          return new Response(JSON.stringify({ error: "Missing Authorization token" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const tokenString = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

        // Query integration by token
        const { data: integration, error: tokenErr } = await supabaseAdmin
          .from("lead_integrations")
          .select("user_id")
          .filter("config->>api_token", "eq", tokenString)
          .maybeSingle();

        if (tokenErr || !integration) {
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid API Token" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Fetch leads for Sheets Export
        const { data: leads, error: leadsErr } = await supabaseAdmin
          .from("leads")
          .select("company_name, contact_person, email, phone, status, lead_source, utm_source, utm_campaign, created_at")
          .eq("user_id", integration.user_id)
          .order("created_at", { ascending: false });

        if (leadsErr) throw leadsErr;

        return new Response(JSON.stringify(leads || []), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  }

  // --- 3. POST INGESTION CONTROLLER (Custom Webhooks, Meta Ads, Rest API) ---
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // A. API Token Authentication
    const authHeader = req.headers.get("Authorization") || req.headers.get("x-api-key");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing API authorization headers" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenString = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    const { data: integration, error: tokenErr } = await supabaseAdmin
      .from("lead_integrations")
      .select("*")
      .filter("config->>api_token", "eq", tokenString)
      .maybeSingle();

    if (tokenErr || !integration || !integration.is_connected) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid or inactive API Token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // B. Replay Attack Protection (Timestamp Verification)
    const requestTimestamp = req.headers.get("x-timestamp");
    if (requestTimestamp) {
      const now = Date.now();
      const sentTime = new Date(requestTimestamp).getTime();
      if (isNaN(sentTime) || Math.abs(now - sentTime) > 5 * 60 * 1000) { // Reject if deviation > 5 mins
        return new Response(JSON.stringify({ error: "Replay attack protection: request timestamp is stale" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Read raw body to compute hashes and signatures
    const rawBody = await req.text();

    // C. HMAC Signature Verification
    const signature = req.headers.get("x-hub-signature-256") || req.headers.get("x-signature");
    const webhookSecret = (integration.config as any)?.webhook_secret;
    if (webhookSecret && signature) {
      const isValidSig = await verifyHMACSignature(webhookSecret, rawBody, signature);
      if (!isValidSig) {
        return new Response(JSON.stringify({ error: "Invalid signature: HMAC validation failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Parse payload body
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new Error("Malformed JSON payload");
    }

    // D. Ingestion Rate Limiting (60 requests per minute per user account)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: requestsCount } = await supabaseAdmin
      .from("lead_import_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", integration.user_id)
      .gt("created_at", oneMinuteAgo);

    if (requestsCount && requestsCount >= 60) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (60 requests per minute)" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // E. Idempotency Check (Check request body hash or external ID)
    const bodyHash = await computeSHA256(rawBody);
    const externalLeadId = body.external_lead_id || bodyHash;

    const { data: duplicateLead } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("user_id", integration.user_id)
      .eq("external_lead_id", externalLeadId)
      .maybeSingle();

    if (duplicateLead) {
      // Log duplicate event
      await supabaseAdmin.from("lead_import_logs").insert({
        user_id: integration.user_id,
        platform: integration.platform,
        total_rows: 1,
        imported_count: 0,
        duplicate_count: 1,
        failed_count: 0,
        status: "completed",
      });

      return new Response(
        JSON.stringify({ success: true, message: "Duplicate lead skipped (Idempotency Lock)", duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // F. Parse Lead Info & UTMs
    // Support Meta payload format mapping or standard format
    let companyName = body.company_name || body.company || "Unknown";
    let contactPerson = body.contact_person || body.name || "Unknown";
    let email = body.email || null;
    let phone = body.phone || body.telephone || null;

    // Check Meta Lead Form specific mapping
    if (body.object === "page" && body.entry) {
      // Meta webhook structure extraction
      const changeVal = body.entry[0]?.changes[0]?.value;
      if (changeVal) {
        companyName = "Meta Lead Gen Form";
        contactPerson = `Meta User ${changeVal.leadgen_id}`;
        email = changeVal.email || `meta_${changeVal.leadgen_id}@facebook.import`;
        phone = changeVal.phone_number || null;
      }
    }

    const payload = {
      user_id: integration.user_id,
      company_name: companyName,
      contact_person: contactPerson,
      email: email || `lead_${Date.now()}@webhook.import`,
      phone: phone,
      source: integration.platform,
      status: "new",
      lead_source: integration.platform,
      platform: integration.platform,
      campaign_name: body.campaign_name || body.utm_campaign || null,
      website_name: body.website_name || body.referrer || null,
      external_lead_id: externalLeadId,
      sync_status: "synced",
      imported_at: new Date().toISOString(),
      // UTM Parameters
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || body.campaign_name || null,
      utm_term: body.utm_term || null,
      utm_content: body.utm_content || null,
      referrer: body.referrer || null,
      adset_name: body.adset_name || body.adset || null,
      ad_name: body.ad_name || body.ad || null,
    };

    // G. Auto-create Lead (Inserts and automatically triggers Postgres round-robin assignment)
    const { data: leadData, error: insertErr } = await supabaseAdmin
      .from("leads")
      .insert(payload)
      .select("id, assigned_to, contact_person, company_name, email, phone")
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        return new Response(
          JSON.stringify({ success: true, message: "Duplicate lead skipped", duplicate: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw insertErr;
    }

    // H. CRM Automations (Auto-create follow-up task and notifications)
    const assignedUserId = leadData.assigned_to || integration.user_id;

    // Create Follow-up Task (due in 2 days)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    const { data: taskData } = await supabaseAdmin
      .from("tasks")
      .insert({
        user_id: integration.user_id,
        assigned_to: assignedUserId,
        title: `Follow up with ${leadData.contact_person}`,
        description: `Auto-generated follow-up task for lead from ${leadData.company_name}. Email: ${leadData.email}. Phone: ${leadData.phone || "N/A"}.`,
        status: "pending",
        priority: "high",
        due_date: dueDate.toISOString().split("T")[0],
      })
      .select("id")
      .single();

    // Send Notification to assigned user
    if (leadData.assigned_to) {
      await supabaseAdmin.from("notifications").insert({
        user_id: leadData.assigned_to,
        title: "New Lead Assigned",
        message: `You have been assigned a new lead: ${leadData.contact_person} from ${leadData.company_name}. Follow-up task created.`,
        type: "info",
        read: false,
      });
    }

    // Log complete imports
    await supabaseAdmin.from("lead_import_logs").insert({
      user_id: integration.user_id,
      platform: integration.platform,
      total_rows: 1,
      imported_count: 1,
      duplicate_count: 0,
      failed_count: 0,
      status: "completed",
    });

    // Update integration totals
    await supabaseAdmin
      .from("lead_integrations")
      .update({
        total_leads_imported: (integration.total_leads_imported || 0) + 1,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    // Save success audit log
    await supabaseAdmin.from("activity_logs").insert({
      user_id: integration.user_id,
      user_name: "Lead Ingestion Service",
      user_role: "system",
      module: "leads",
      action: "ingest",
      details: {
        status: "success",
        platform: integration.platform,
        lead_id: leadData.id,
        task_id: taskData?.id || null,
        assigned_to: leadData.assigned_to || null,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Lead ingested successfully",
        lead_id: leadData.id,
        assigned_to: leadData.assigned_to || null,
        task_created: !!taskData,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Ingestion failed:", err);

    // Write failure audit log if integration user context is known
    if (integration) {
      await supabaseAdmin.from("activity_logs").insert({
        user_id: integration.user_id,
        user_name: "Lead Ingestion Service",
        user_role: "system",
        module: "leads",
        action: "ingest_fail",
        details: {
          status: "failed",
          error: err.message,
        },
      }).catch((e: any) => console.error("Failed to write activity logs:", e));
    }

    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
