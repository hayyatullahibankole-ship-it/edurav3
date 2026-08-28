import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Edura <noreply@edura.com.ng>';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

const createWelcomeEmailHtml = (firstName: string, dashboardUrl: string, unsubscribeToken?: string) => {
  const unsubscribeUrl = unsubscribeToken
    ? `https://edura.com.ng/#/unsubscribe?token=${unsubscribeToken}`
    : null;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:24px;background:#f4f6f8;font-family:Helvetica,Arial,sans-serif;color:#1f2933">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3e8ee;border-radius:10px;padding:32px">
          <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#08121F;letter-spacing:0.5px">Edura</p>

          <h1 style="margin:0 0 12px;font-size:20px;color:#08121F">Welcome, ${firstName}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563">
            Your Edura account is ready. You can now practise past questions under exam conditions, follow a
            structured study plan, track your progress and request exam services in one place.
          </p>

          <p style="margin:24px 0">
            <a href="${dashboardUrl}" style="background:#12B76A;color:#ffffff;padding:12px 26px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">Open my dashboard</a>
          </p>

          <table role="presentation" width="100%" style="border-collapse:collapse;margin:8px 0 24px">
            <tr>
              <td style="padding:12px 0;border-top:1px solid #eef1f5;font-size:14px;color:#4b5563">
                <strong style="color:#08121F">Practice</strong> &mdash; JAMB, WAEC, NECO and NABTEB CBT practice with instant scoring.
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-top:1px solid #eef1f5;font-size:14px;color:#4b5563">
                <strong style="color:#08121F">Study tools</strong> &mdash; lessons, study decks and performance reports.
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-top:1px solid #eef1f5;font-size:14px;color:#4b5563">
                <strong style="color:#08121F">Services</strong> &mdash; result checker cards, admissions support and wallet payments.
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280">
            Need help getting started? Reply to this email or contact support@edura.com.ng.
          </p>

          <hr style="border:none;border-top:1px solid #e5e9ef;margin:28px 0" />
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8a94a6">
            &copy; ${new Date().getFullYear()} Edura &middot; support@edura.com.ng &middot; 0705 075 7085<br />
            <a href="https://edura.com.ng" style="color:#12B76A;text-decoration:none">edura.com.ng</a>
            ${unsubscribeUrl ? `&middot; <a href="${unsubscribeUrl}" style="color:#8a94a6;text-decoration:underline">Unsubscribe</a>` : ''}
          </p>
        </div>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, firstName, lastName }: WelcomeEmailRequest = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`📧 Sending welcome email to ${email} (User ID: ${userId})`);

    // Check email rate limit
    const { data: rateLimitOk } = await supabase.rpc('check_email_rate_limit', {
      recipient_email: email
    });
    
    if (!rateLimitOk) {
      console.warn(`⚠️ Email rate limit exceeded for ${email}`);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Rate limit exceeded'
      }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if user wants welcome emails
    const { data: canSend } = await supabase.rpc('can_send_email', {
      target_user_id: userId,
      email_type: 'welcome'
    });
    
    if (canSend === false) {
      console.log(`📭 User ${email} has unsubscribed from welcome emails`);
      return new Response(JSON.stringify({ 
        success: true,
        message: 'User has unsubscribed'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get unsubscribe token
    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('unsubscribe_token')
      .eq('user_id', userId)
      .single();

    const displayName = firstName || 'there';
    const dashboardUrl = 'https://edura.com.ng/#/dashboard';

    const emailHtml = createWelcomeEmailHtml(displayName, dashboardUrl, prefs?.unsubscribe_token);

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Welcome to Edura",
      html: emailHtml,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    // Log email delivery
    await supabase.from('email_delivery_log').insert({
      user_id: userId,
      recipient_email: email,
      email_type: 'welcome',
      subject: "Welcome to Edura",
      status: 'sent',
      provider_message_id: emailResponse.data?.id,
      sent_at: new Date().toISOString()
    });

    // Log for rate limiting
    await supabase.rpc('log_security_event', {
      action_type: 'EMAIL_SENT',
      target_type: 'email',
      target_id: userId,
      details: { recipient: email, type: 'welcome' }
    });

    console.log(`✅ Welcome email sent successfully to ${email}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Welcome email sent successfully'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-welcome-email function:", error);
    
    // Log failed delivery
    try {
      const { userId, email } = await req.json();
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      await supabase.from('email_delivery_log').insert({
        user_id: userId,
        recipient_email: email,
        email_type: 'welcome',
        status: 'failed',
        error_message: error.message
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
