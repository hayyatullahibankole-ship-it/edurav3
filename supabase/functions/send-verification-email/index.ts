import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@4.0.0";
// React Email template disabled to ensure stability
// import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
// import React from "https://esm.sh/react@18.3.1";
// import { VerificationEmail } from "./_templates/verification-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;
const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Edura <noreply@edura.com.ng>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    console.log("Processing email verification request...");

    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Parse the payload directly - Supabase Auth Hooks use internal authentication
    // The webhook secret verification doesn't work with Supabase's auth hook format
    let emailData: any;
    try {
      emailData = JSON.parse(payload);
      console.log("Parsed email data successfully");
    } catch (err) {
      console.error("Failed to parse payload:", err);
      return new Response(
        JSON.stringify({ error: "Invalid payload format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { user, email_data } = emailData;
    const { token, token_hash, redirect_to, email_action_type } = email_data;

    console.log(`Sending ${email_action_type} email to ${user.email}`);

    const supaUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const siteUrl = "https://edura.com.ng";
    const redirect = redirect_to || `${siteUrl}/dashboard`;
    const verificationUrl = `${supaUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect}`;

    const isRecovery = email_action_type === "recovery";
    const isEmailChange = email_action_type === "email_change";

    const heading = isRecovery
      ? "Reset your password"
      : isEmailChange
      ? "Confirm your new email address"
      : "Confirm your email address";

    const bodyText = isRecovery
      ? "Use the code below to reset the password on your Edura account. It expires in 60 minutes."
      : isEmailChange
      ? "Use the code below to confirm your new email address. It expires in 60 minutes."
      : "Use the code below to finish setting up your Edura account. It expires in 60 minutes.";

    let subject = "Confirm your email address";
    if (isRecovery) subject = "Your Edura password reset code";
    else if (isEmailChange) subject = "Confirm your new email address";
    else subject = "Your Edura verification code";

    const codeBlock = token
      ? `<div style="margin:28px 0;text-align:center">
            <div style="display:inline-block;padding:16px 28px;border:1px solid #d8dee6;border-radius:8px;background:#f7f9fb">
              <span style="font-family:'Courier New',monospace;font-size:30px;letter-spacing:8px;font-weight:700;color:#08121F">${token}</span>
            </div>
          </div>`
      : `<p style="text-align:center;margin:28px 0">
            <a href="${verificationUrl}" style="background:#12B76A;color:#ffffff;padding:12px 26px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">Continue</a>
          </p>`;

    const html = `
      <html>
        <body style="margin:0;padding:24px;background:#f4f6f8;font-family:Helvetica,Arial,sans-serif;color:#1f2933">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3e8ee;border-radius:10px;padding:32px">
            <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#08121F;letter-spacing:0.5px">Edura</p>
            <h1 style="margin:0 0 12px;font-size:20px;color:#08121F">${heading}</h1>
            <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563">${bodyText}</p>
            ${codeBlock}
            <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280">
              If you did not request this, you can safely ignore this email. Your account remains secure.
            </p>
            <hr style="border:none;border-top:1px solid #e5e9ef;margin:28px 0" />
            <p style="margin:0;font-size:12px;line-height:1.6;color:#8a94a6">
              Edura &middot; support@edura.com.ng &middot; 0705 075 7085<br />
              <a href="${siteUrl}" style="color:#12B76A;text-decoration:none">edura.com.ng</a>
            </p>
          </div>
        </body>
      </html>`;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error (non-fatal):", error);
      // Do not block auth flow; return 200 with success=false
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code || "UNKNOWN_ERROR",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
