import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Edura <noreply@edura.com.ng>';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptEmailRequest {
  userId: string;
  email: string;
  firstName?: string;
  reference: string;
  amount: number;
  currency?: string;
  planName?: string;
  isSchoolSubscription?: boolean;
  studentSeats?: number;
}

const createReceiptEmailHtml = (data: ReceiptEmailRequest) => {
  const {
    firstName,
    reference,
    amount,
    currency = 'NGN',
    planName,
    isSchoolSubscription,
    studentSeats
  } = data;

  const currencySymbol = currency === 'NGN' ? '₦' : currency;
  const displayName = firstName || 'Valued Customer';
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #059669 0%, #1e40af 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .success-badge { 
            background: white; 
            color: #059669; 
            display: inline-block; 
            padding: 8px 20px; 
            border-radius: 20px; 
            font-weight: bold; 
            margin-top: 15px;
            font-size: 14px;
          }
          .content { padding: 40px 30px; }
          .greeting { color: #111827; margin: 0 0 20px 0; font-size: 20px; }
          .message { color: #374151; line-height: 1.6; margin-bottom: 30px; }
          .receipt-box { 
            background: #f9fafb; 
            border: 2px solid #e5e7eb; 
            border-radius: 12px; 
            padding: 24px; 
            margin: 30px 0;
          }
          .receipt-box h2 { 
            color: #111827; 
            margin: 0 0 20px 0; 
            font-size: 20px; 
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 15px;
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 12px 0; 
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
          }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: normal; }
          .detail-value { font-weight: bold; color: #111827; }
          .amount-row { 
            background: #dcfce7; 
            padding: 16px; 
            border-radius: 8px; 
            margin-top: 20px;
          }
          .amount-row .detail-value { 
            color: #059669; 
            font-size: 24px; 
          }
          .benefits { 
            background: #eff6ff; 
            border: 2px solid #bfdbfe; 
            border-radius: 12px; 
            padding: 24px; 
            margin: 30px 0;
          }
          .benefits h3 { 
            color: #1e40af; 
            margin: 0 0 15px 0; 
            font-size: 18px; 
          }
          .benefits ul { 
            margin: 0; 
            padding-left: 20px; 
            color: #374151; 
          }
          .benefits li { 
            margin: 10px 0; 
            line-height: 1.5;
          }
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
          .footer { 
            background-color: #111827; 
            padding: 24px 30px; 
            text-align: center; 
          }
          .footer p { 
            color: #9ca3af; 
            font-size: 12px; 
            margin: 5px 0; 
          }
          .support-info { 
            background: #fef3c7; 
            border-left: 4px solid #f59e0b; 
            padding: 16px; 
            margin: 20px 0; 
            border-radius: 4px;
          }
          .support-info p { 
            margin: 0; 
            color: #92400e; 
            font-size: 14px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Receipt</h1>
            <div class="success-badge">PAYMENT SUCCESSFUL</div>
          </div>
          
          <div class="content">
            <h2 class="greeting">Hello ${displayName},</h2>
            <p class="message">
              Thank you for your payment! Your ${isSchoolSubscription ? 'school' : ''} subscription has been successfully activated. 
              Below are the details of your transaction.
            </p>

            <div class="receipt-box">
              <h2>📄 Transaction Details</h2>
              
              <div class="detail-row">
                <span class="detail-label">Reference Number:</span>
                <span class="detail-value" style="font-family: monospace;">${reference}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${today}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #059669;">SUCCESS</span>
              </div>
              
              ${planName ? `
              <div class="detail-row">
                <span class="detail-label">Plan:</span>
                <span class="detail-value">${planName}</span>
              </div>
              ` : ''}
              
              ${studentSeats ? `
              <div class="detail-row">
                <span class="detail-label">Student Seats:</span>
                <span class="detail-value">${studentSeats} students</span>
              </div>
              ` : ''}
              
              <div class="amount-row">
                <div class="detail-row" style="border: none;">
                  <span class="detail-label" style="font-size: 18px;">Total Amount Paid:</span>
                  <span class="detail-value">${currencySymbol}${amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div class="benefits">
              <h3>🎉 Your Subscription Benefits</h3>
              <ul>
                ${isSchoolSubscription ? `
                  <li>Manage up to ${studentSeats} student accounts</li>
                  <li>Access to comprehensive school admin dashboard</li>
                  <li>Detailed student performance analytics</li>
                  <li>Custom exam creation and scheduling</li>
                  <li>Bulk student management tools</li>
                  <li>Priority support for your institution</li>
                ` : `
                  <li>Unlimited access to all exam questions</li>
                  <li>Full access to study materials and resources</li>
                  <li>Detailed performance analytics</li>
                  <li>Downloadable past questions</li>
                  <li>Priority customer support</li>
                  <li>Ad-free learning experience</li>
                `}
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="https://edura.com.ng/${isSchoolSubscription ? 'school-dashboard' : 'dashboard'}" class="cta-button">
                Go to Dashboard
              </a>
            </div>

            <div class="support-info">
              <p><strong>💡 Need Help?</strong></p>
              <p>If you have any questions about your subscription or need assistance, our support team is here to help at support@edura.com.ng</p>
            </div>

            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">
              Please save this email for your records. This serves as your official payment receipt.
            </p>
          </div>

          <div class="footer">
            <p><strong>Edura - Educational Excellence Platform</strong></p>
            <p>© ${new Date().getFullYear()} Edura. All rights reserved.</p>
            <p style="margin-top: 10px;">📧 support@edura.com.ng | 🌐 www.edura.com.ng</p>
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
    const requestData: ReceiptEmailRequest = await req.json();
    const { userId, email } = requestData;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`📧 Sending receipt email to ${email} (User ID: ${userId})`);

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

    const emailHtml = createReceiptEmailHtml(requestData);

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `Payment Receipt - ${requestData.reference}`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    // Log email delivery
    await supabase.from('email_delivery_log').insert({
      user_id: userId,
      recipient_email: email,
      email_type: 'receipt',
      subject: `Payment Receipt - ${requestData.reference}`,
      status: 'sent',
      provider_message_id: emailResponse.data?.id,
      sent_at: new Date().toISOString()
    });

    // Log for rate limiting
    await supabase.rpc('log_security_event', {
      action_type: 'EMAIL_SENT',
      target_type: 'email',
      target_id: userId,
      details: { recipient: email, type: 'receipt', reference: requestData.reference }
    });

    console.log(`✅ Receipt email sent successfully to ${email}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Receipt email sent successfully'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-receipt-email function:", error);
    
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
