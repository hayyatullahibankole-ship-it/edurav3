import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Edura <noreply@edura.com.ng>";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    // Create client with caller's JWT to verify permissions
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { school_id, email, full_name, role, resend } = body;
    if (!school_id || !email) return json({ error: "school_id and email are required" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify the caller is the school admin
    const { data: school, error: schoolErr } = await admin
      .from("schools")
      .select("id, name, admin_user_id, email")
      .eq("id", school_id)
      .maybeSingle();
    if (schoolErr || !school) return json({ error: "School not found" }, 404);

    const { data: caller } = await admin
      .from("users")
      .select("id, auth_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!caller || caller.id !== school.admin_user_id) {
      return json({ error: "Only the school admin can invite staff" }, 403);
    }

    // Check for existing staff record
    const { data: existing } = await admin
      .from("school_staff")
      .select("id, invite_status")
      .eq("school_id", school_id)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    const inviteToken = crypto.randomUUID();
    const now = new Date().toISOString();

    if (existing && !resend) {
      return json({ error: "This email has already been invited" }, 409);
    }

    if (existing) {
      // Resend: update token and timestamp
      await admin
        .from("school_staff")
        .update({ invite_token: inviteToken, invited_at: now, invite_status: "pending" })
        .eq("id", existing.id);
    } else {
      // Create new staff record
      const { error: insertErr } = await admin.from("school_staff").insert([
        {
          school_id,
          email: email.toLowerCase(),
          full_name: full_name || null,
          role: role || "teacher",
          invite_status: "pending",
          invite_token: inviteToken,
          invited_at: now,
          is_active: true,
        },
      ]);
      if (insertErr) return json({ error: "Failed to create staff record: " + insertErr.message }, 500);
    }

    // Build the invite acceptance link
    const appUrl = Deno.env.get("APP_URL") || "https://edura.lovable.app";
    const inviteUrl = `${appUrl}/school-login?invite=${inviteToken}`;

    // Send email via Resend
    if (RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY);
      const schoolName = school.name || "your school";
      const recipientName = full_name || email.split("@")[0];

      const html = `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
            <div style="max-width:600px;margin:0 auto;background:#fff;">
              <div style="padding:40px 30px;text-align:center;background:#0F3D2E;">
                <h1 style="color:#fff;margin:0;font-size:24px;">You've been invited</h1>
              </div>
              <div style="padding:40px 30px;">
                <h2 style="color:#111827;margin:0 0 20px;">Hello ${recipientName},</h2>
                <p style="color:#374151;font-size:16px;line-height:1.6;">
                  You've been invited to join <strong>${schoolName}</strong> as a <strong>${role || "teacher"}</strong> on Edura Schools.
                  You'll be able to manage exams and view student reports without sharing the main admin login.
                </p>
                <div style="text-align:center;margin:30px 0;">
                  <a href="${inviteUrl}" style="display:inline-block;background:#0F3D2E;color:#fff;padding:14px 40px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                    Accept Invitation
                  </a>
                </div>
                <p style="color:#6b7280;font-size:14px;line-height:1.5;">
                  If the button doesn't work, copy this link:<br>
                  <a href="${inviteUrl}" style="color:#0F3D2E;word-break:break-all;">${inviteUrl}</a>
                </p>
                <p style="color:#6b7280;font-size:14px;margin-top:30px;">
                  If you weren't expecting this invite, you can safely ignore this email.
                </p>
              </div>
              <div style="background:#111827;padding:24px 30px;text-align:center;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Edura. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const emailRes = await resend.emails.send({
        from: FROM_EMAIL,
        to: [email],
        subject: `You're invited to join ${schoolName} on Edura`,
        html,
      });

      if (emailRes.error) {
        console.error("Resend error:", emailRes.error);
        return json({ error: "Failed to send invite email" }, 500);
      }

      // Log delivery
      await admin.from("email_delivery_log").insert({
        recipient_email: email,
        email_type: "staff_invite",
        subject: `You're invited to join ${schoolName} on Edura`,
        status: "sent",
        provider_message_id: emailRes.data?.id,
        sent_at: now,
      });
    }

    console.log("Staff invite sent:", email, "for school", school.name);
    return json({ success: true, message: "Invite sent to " + email });
  } catch (error: any) {
    console.error("invite-school-staff error:", error);
    return json({ error: error.message }, 500);
  }
};

serve(handler);
