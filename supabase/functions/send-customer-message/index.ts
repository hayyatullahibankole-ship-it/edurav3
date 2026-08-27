import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MessageRequest {
  userIds: string[];
  subject: string;
  message: string;
  type: 'email' | 'whatsapp' | 'both';
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  isBulk?: boolean;
}

const createEmailHtml = (
  firstName: string, 
  message: string, 
  imageUrl?: string,
  ctaText?: string,
  ctaUrl?: string
) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #059669 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 32px; }
          .content { padding: 40px 30px; background-color: #f9fafb; }
          .content h2 { color: #111827; margin: 0 0 20px 0; font-size: 24px; }
          .message-box { background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; line-height: 1.6; color: #374151; }
          .image-container { text-align: center; margin: 20px 0; }
          .image-container img { max-width: 100%; height: auto; border-radius: 8px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .cta-button:hover { opacity: 0.9; }
          .footer-note { color: #6b7280; font-size: 14px; margin-top: 20px; }
          .footer { background-color: #111827; padding: 24px 30px; text-align: center; }
          .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Edura</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
            </div>
            ${imageUrl ? `
              <div class="image-container">
                <img src="${imageUrl}" alt="Message attachment" />
              </div>
            ` : ''}
            ${ctaText && ctaUrl ? `
              <div style="text-align: center;">
                <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
              </div>
            ` : ''}
            <p class="footer-note">
              This is an official communication from the Edura team.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Edura. All rights reserved.</p>
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      userIds, 
      subject, 
      message, 
      type, 
      imageUrl, 
      ctaText, 
      ctaUrl,
      isBulk 
    }: MessageRequest = await req.json();

    console.log(`Sending ${isBulk ? 'bulk' : 'individual'} message to ${userIds.length} user(s)`);

    // Get users info
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone')
      .in('id', userIds);

    if (usersError || !usersData) {
      throw new Error('Users not found');
    }

    const results = {
      total: userIds.length,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Send emails
    if (type === 'email' || type === 'both') {
      for (const user of usersData) {
        if (!user.email) {
          results.failed++;
          results.errors.push(`${user.first_name} ${user.last_name}: No email address`);
          continue;
        }

        try {
          const emailHtml = createEmailHtml(
            user.first_name,
            message,
            imageUrl,
            ctaText,
            ctaUrl
          );

          const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Edura <noreply@edura.com.ng>';
          
          const emailResponse = await resend.emails.send({
            from: fromEmail,
            to: [user.email],
            subject: subject,
            html: emailHtml,
          });

          if (emailResponse.error) {
            throw emailResponse.error;
          }

          console.log(`✅ Email sent successfully to ${user.email}`);
          results.sent++;
        } catch (emailError: any) {
          console.error(`Email failed for ${user.email}:`, emailError);
          results.failed++;
          results.errors.push(`${user.email}: ${emailError.message}`);
        }
      }
    }

    // WhatsApp handling (placeholder)
    if (type === 'whatsapp' || type === 'both') {
      console.log('WhatsApp sending not yet implemented');
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-customer-message function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
