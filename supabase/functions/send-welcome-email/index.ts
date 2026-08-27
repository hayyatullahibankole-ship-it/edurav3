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
    ? `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/unsubscribe?token=${unsubscribeToken}`
    : null;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #059669 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 32px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .content h2 { color: #111827; margin: 0 0 20px 0; font-size: 24px; }
          .message-box { background: #f9fafb; padding: 24px; border-radius: 12px; margin-bottom: 30px; line-height: 1.6; color: #374151; }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #1e40af 0%, #059669 100%); 
            color: white; 
            padding: 16px 40px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            font-size: 16px;
            margin: 20px 0;
          }
          .cta-button:hover { opacity: 0.9; }
          .plans-section { margin: 30px 0; }
          .plan-card { 
            background: #f9fafb; 
            border: 2px solid #e5e7eb; 
            border-radius: 12px; 
            padding: 20px; 
            margin: 15px 0;
          }
          .plan-card h3 { color: #1e40af; margin: 0 0 10px 0; font-size: 20px; }
          .plan-card .price { color: #059669; font-size: 24px; font-weight: bold; margin: 10px 0; }
          .plan-card ul { margin: 15px 0; padding-left: 20px; color: #374151; }
          .plan-card li { margin: 8px 0; }
          .footer { background-color: #111827; padding: 24px 30px; text-align: center; }
          .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Edura!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <div class="message-box">
              <p><strong>Congratulations on creating your Edura account!</strong></p>
              <p>We're thrilled to have you join our community of learners. Edura is your comprehensive platform for exam preparation, featuring practice tests, study materials, and progress tracking.</p>
              <p>Ready to get started? Click the button below to access your dashboard and explore everything Edura has to offer.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="cta-button">Go to My Dashboard</a>
            </div>

            <div class="plans-section">
              <h3 style="color: #111827; font-size: 22px; margin-bottom: 20px;">📚 Choose Your Plan</h3>
              <p style="color: #374151; margin-bottom: 20px;">Unlock your full potential with our premium features:</p>
              
              <div class="plan-card">
                <h3>Free Plan</h3>
                <div class="price">₦0</div>
                <ul>
                  <li>Access to basic practice questions</li>
                  <li>Limited exam attempts</li>
                  <li>Standard study materials</li>
                </ul>
              </div>

              <div class="plan-card" style="border-color: #1e40af; border-width: 3px;">
                <h3>Premium Plan</h3>
                <div class="price">From ₦5,000/month</div>
                <ul>
                  <li>Unlimited practice tests</li>
                  <li>Advanced analytics & progress tracking</li>
                  <li>Premium study materials & video lessons</li>
                  <li>Priority support</li>
                  <li>Downloadable resources</li>
                </ul>
              </div>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
              Visit your dashboard to explore subscription options and start your learning journey today!
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Edura. All rights reserved.</p>
            <p style="margin-top: 10px;">Need help? Contact us at support@edura.com.ng</p>
            ${unsubscribeUrl ? `<p style="margin-top: 15px;"><a href="${unsubscribeUrl}" style="color: #9ca3af; font-size: 11px; text-decoration: underline;">Unsubscribe from these emails</a></p>` : ''}
          </div>
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
    const dashboardUrl = `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/dashboard` || 'https://edura.com.ng/dashboard';

    const emailHtml = createWelcomeEmailHtml(displayName, dashboardUrl, prefs?.unsubscribe_token);

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "🎉 Welcome to Edura - Start Your Learning Journey!",
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
      subject: "🎉 Welcome to Edura - Start Your Learning Journey!",
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
