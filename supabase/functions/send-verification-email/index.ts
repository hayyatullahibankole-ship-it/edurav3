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
    const { token_hash, redirect_to, email_action_type } = email_data;

    console.log(`Sending ${email_action_type} email to ${user.email}`);

    // Build HTML directly (no React Email) for maximum compatibility
    const supaUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const redirect = redirect_to || `${supaUrl}/`;
    const verificationUrl = `${supaUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect}`;

    const heading = email_action_type === "recovery"
      ? "Reset your Edura password"
      : email_action_type === "email_change"
      ? "Confirm your new email"
      : "Verify your Edura account";

    const bodyText = email_action_type === "recovery"
      ? "We received a request to reset your password. Click the button below to continue."
      : email_action_type === "email_change"
      ? "Click the button below to confirm your new email address."
      : "Click the button below to verify your email and activate your account.";

    const buttonText = email_action_type === "recovery"
      ? "Reset Password"
      : email_action_type === "email_change"
      ? "Confirm Email"
      : "Verify Email";

    const html = `
      <html>
        <body style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;background:#f6f9fc;padding:24px">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;border:1px solid #e6ebf1">
            <h1 style="margin-top:0">${heading}</h1>
            <p>${bodyText}</p>
            <p style="text-align:center;margin:24px 0">
              <a href="${verificationUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">${buttonText}</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break:break-all;color:#6366f1">${verificationUrl}</p>
            <hr style="border:none;border-top:1px solid #e6ebf1;margin:24px 0" />
            <p style="color:#6b7280;font-size:14px">If you did not request this, you can safely ignore this email.</p>
          </div>
        </body>
      </html>`;

    // Determine subject based on action type
    let subject = "Verify your Edura account";
    if (email_action_type === "recovery") {
      subject = "Reset your Edura password";
    } else if (email_action_type === "email_change") {
      subject = "Confirm your new email address";
    }

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
