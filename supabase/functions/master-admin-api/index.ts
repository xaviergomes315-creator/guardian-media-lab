import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // Initialize DB Client
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // --- AUTHENTICATION & SUPER ADMIN AUTHORIZATION GUARD ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid credentials token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Query profiles for super_admin role check
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileErr || !profile || profile.role !== "super_admin" || !profile.is_active) {
      return new Response(JSON.stringify({ error: "Forbidden: Master Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- SUB-ROUTING HANDLERS ---

    // 1. COMPANY MANAGER (/company-manager)
    if (path.endsWith("/company-manager")) {
      // GET: List all tenants
      if (req.method === "GET") {
        const { data: tenantsList, error: tenantsErr } = await supabase
          .from("tenants")
          .select("*")
          .order("created_at", { ascending: false });

        if (tenantsErr) throw tenantsErr;
        return new Response(JSON.stringify(tenantsList || []), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST: Create a new company tenant
      if (req.method === "POST") {
        const body = await req.json();
        if (!body.name || !body.subdomain) {
          return new Response(JSON.stringify({ error: "Missing company name or subdomain keys" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: newTenant, error: insertErr } = await supabase
          .from("tenants")
          .insert({
            name: body.name,
            subdomain: body.subdomain,
            status: body.status || "trial",
            branding: body.branding || { theme: "dark" },
            storage_limit_bytes: body.storage_limit_bytes || 10737418240,
            api_quota_per_month: body.api_quota_per_month || 50000,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;

        // Auto provision default modules for this tenant
        const defaultModules = ['crm', 'leads', 'google_reviews', 'ai_assistant', 'reports'];
        const modulePayloads = defaultModules.map(mod => ({
          tenant_id: newTenant.id,
          module_key: mod,
          enabled: true,
        }));

        await supabase.from("tenant_modules").insert(modulePayloads);

        // Audit Log
        await supabase.from("master_audit_logs").insert({
          user_id: user.id,
          tenant_id: newTenant.id,
          action: "company:create",
          details: { name: newTenant.name, subdomain: newTenant.subdomain },
        });

        return new Response(JSON.stringify(newTenant), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PATCH: Update profile or toggle suspension status
      if (req.method === "PATCH") {
        const body = await req.json();
        if (!body.id) {
          return new Response(JSON.stringify({ error: "Missing company ID key" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updates: any = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.status !== undefined) updates.status = body.status;
        if (body.branding !== undefined) updates.branding = body.branding;
        if (body.storage_limit_bytes !== undefined) updates.storage_limit_bytes = body.storage_limit_bytes;
        if (body.api_quota_per_month !== undefined) updates.api_quota_per_month = body.api_quota_per_month;
        updates.updated_at = new Date().toISOString();

        const { data: updatedTenant, error: updateErr } = await supabase
          .from("tenants")
          .update(updates)
          .eq("id", body.id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        // Audit Log
        await supabase.from("master_audit_logs").insert({
          user_id: user.id,
          tenant_id: updatedTenant.id,
          action: body.status ? `company:${body.status}` : "company:update",
          details: updates,
        });

        return new Response(JSON.stringify(updatedTenant), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. SYSTEM HEALTH MONITOR (/system-health)
    if (path.endsWith("/system-health")) {
      if (req.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Connectivity Check
      const dbCheckStart = Date.now();
      const { data: dbPing, error: dbErr } = await supabase.rpc("is_super_admin").select();
      const dbLatency = Date.now() - dbCheckStart;

      // Extract general aggregates
      const { count: totalCompanies } = await supabase.from("tenants").select("id", { count: "exact", head: true });
      const { count: activeUsers } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      const { count: totalAiRequests } = await supabase.from("ai_history").select("id", { count: "exact", head: true });

      const healthStats = {
        status: dbErr ? "unhealthy" : "healthy",
        database: {
          connected: !dbErr,
          latency_ms: dbLatency,
          active_connections: 5, // Mock pools stats
        },
        system_aggregates: {
          total_tenants: totalCompanies || 0,
          active_users: activeUsers || 0,
          ai_requests_processed: totalAiRequests || 0,
        },
        timestamp: new Date().toISOString(),
      };

      return new Response(JSON.stringify(healthStats), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. BILLING PROCESSOR (/billing-processor)
    if (path.endsWith("/billing-processor")) {
      if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      if (!body.tenant_id || !body.plan_type) {
        return new Response(JSON.stringify({ error: "Missing tenant_id or plan_type parameters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Renew / Apply new Subscription plan
      const startDate = new Date();
      const endDate = new Date();
      if (body.plan_type === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (body.plan_type === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const { data: newSubscription, error: subErr } = await supabase
        .from("tenant_subscriptions")
        .insert({
          tenant_id: body.tenant_id,
          plan_type: body.plan_type,
          status: "active",
          start_date: startDate.toISOString().split("T")[0],
          end_date: body.plan_type === "lifetime" ? null : endDate.toISOString().split("T")[0],
          payment_status: body.payment_status || "paid",
          coupon_code: body.coupon_code || null,
        })
        .select()
        .single();

      if (subErr) throw subErr;

      // Update tenant status if suspended
      await supabase
        .from("tenants")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", body.tenant_id);

      // Audit Log
      await supabase.from("master_audit_logs").insert({
        user_id: user.id,
        tenant_id: body.tenant_id,
        action: "subscription:renew",
        details: { plan_type: body.plan_type, coupon: body.coupon_code || "none" },
      });

      return new Response(JSON.stringify(newSubscription), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default 404 Route
    return new Response(JSON.stringify({ error: "API Route not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Master Admin API critical failure:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
