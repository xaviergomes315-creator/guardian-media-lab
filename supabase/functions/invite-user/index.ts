import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "telecaller" | "accountant" | "client";
  phone?: string;
  department?: string;
}

Deno.serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Initialize Admin Client
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  let callerProfile: any = null;
  let requestBody: InviteRequest | null = null;

  try {
    // 1. Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized: Invalid token");
    }

    // 2. Fetch caller's profile & role to authenticate admin privileges
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Forbidden: Caller profile not found");
    }
    callerProfile = profile;

    const allowedRoles = ["super_admin", "admin", "manager"];
    if (!allowedRoles.includes(callerProfile.role)) {
      throw new Error("Forbidden: Only administrators or managers can invite users");
    }

    // 3. Parse and validate body parameters
    requestBody = (await req.json()) as InviteRequest;
    const { email, full_name, role, phone, department } = requestBody;

    if (!email || !full_name || !role) {
      throw new Error("Missing required fields: email, full_name, role are required");
    }

    const validRoles = ["super_admin", "admin", "telecaller", "accountant", "client"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of ${validRoles.join(", ")}`);
    }

    // 4. Duplicate Check
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, is_active, user_id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Database check error: ${checkError.message}`);
    }

    if (existingProfile) {
      // If the profile exists and is inactive, this represents a pending/expired invite
      if (existingProfile.is_active === false) {
        console.log(`Resending invitation to inactive/expired user: ${email}`);
        
        // Resend invitation email
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { full_name, role }
        });

        if (inviteError) {
          throw new Error(`Failed to resend invitation: ${inviteError.message}`);
        }

        // Optional: Update profile metadata in case they changed name/role/dept
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            full_name,
            role,
            phone: phone || null,
            department: department || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingProfile.id);

        if (updateError) {
          console.error("Warning: Failed to update profile details on resend:", updateError);
        }

        // Log SUCCESSFUL resend audit log
        await supabaseAdmin.from("activity_logs").insert({
          user_id: callerProfile.id,
          user_name: callerProfile.full_name || "Admin",
          user_role: callerProfile.role,
          module: "team",
          action: "invite",
          details: {
            invited_email: email,
            assigned_role: role,
            status: "success",
            action_type: "resend_invite"
          }
        });

        return new Response(JSON.stringify({ success: true, message: "Invitation resent successfully" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Active user exists
        throw new Error("A team member with this email already exists and is active.");
      }
    }

    // 5. Create new invitation
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name, role }
      }
    );

    if (inviteError) {
      throw new Error(`Invitation failed: ${inviteError.message}`);
    }

    const invitedUser = inviteData?.user;
    if (!invitedUser) {
      throw new Error("No user was returned from Supabase Auth invite.");
    }

    // 6. Create corresponding profile record
    const { error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: invitedUser.id,
        email: email,
        full_name: full_name,
        role: role,
        phone: phone || null,
        department: department || null,
        is_active: false // Pending acceptance
      });

    if (insertError) {
      // Transaction Rollback: Clean up auth user to prevent orphaned registrations
      console.error("Profile insert failed, rolling back invited auth user:", insertError);
      await supabaseAdmin.auth.admin.deleteUser(invitedUser.id);
      throw new Error(`Failed to save profile: ${insertError.message}`);
    }

    // Log SUCCESSFUL invite audit log
    await supabaseAdmin.from("activity_logs").insert({
      user_id: callerProfile.id,
      user_name: callerProfile.full_name || "Admin",
      user_role: callerProfile.role,
      module: "team",
      action: "invite",
      details: {
        invited_email: email,
        assigned_role: role,
        status: "success",
        action_type: "new_invite"
      }
    });

    return new Response(JSON.stringify({ success: true, message: "Invitation sent successfully", user: invitedUser }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Invite operation failed:", err);

    // Log FAILED audit log if caller is authenticated and email/role is known
    if (callerProfile) {
      await supabaseAdmin.from("activity_logs").insert({
        user_id: callerProfile.id,
        user_name: callerProfile.full_name || "Admin",
        user_role: callerProfile.role,
        module: "team",
        action: "invite_fail",
        details: {
          invited_email: requestBody?.email || "unknown",
          assigned_role: requestBody?.role || "unknown",
          status: "failed",
          error_message: err.message
        }
      }).catch((logErr: any) => console.error("Failed to write failure audit log:", logErr));
    }

    // Map error status code
    let status = 500;
    if (err.message.includes("Unauthorized") || err.message.includes("Missing Authorization")) {
      status = 401;
    } else if (err.message.includes("Forbidden")) {
      status = 403;
    } else if (err.message.includes("Missing required fields") || err.message.includes("Invalid role") || err.message.includes("exists")) {
      status = 400;
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
