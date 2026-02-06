import { Resend } from 'resend'

// Initialize Resend with API key
// Ideally this should be in process.env.RESEND_API_KEY
// The user should have this set up in their environment
const resend = new Resend(process.env.RESEND_API_KEY)

type SendOrderEmailParams = {
  to: string
  buyerName: string
  creatorName: string
  productName: string
  deliveryUrl: string
  supportEmail: string
  creatorUsername: string
}

export async function sendOrderEmail({
  to,
  buyerName,
  creatorName,
  productName,
  deliveryUrl,
  supportEmail,
  creatorUsername,
}: SendOrderEmailParams) {
  // Use a verified domain or the resend testing domain
  const from = 'onboarding@webtron.biz.id'
  const subject = `Your order for ${productName} is ready!`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Order Confirmation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; overflow: hidden; }
          .header { background-color: #f9fafb; padding: 20px; text-align: center; border-bottom: 1px solid #eaeaea; }
          .content { padding: 30px 20px; }
          .button { display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eaeaea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Order Confirmation</h2>
          </div>
          <div class="content">
            <p>Hi ${buyerName || 'there'},</p>
            <p>Thanks for purchasing <strong>${productName}</strong> from <strong>${creatorName}</strong>.</p>
            <p>You can access your product using the link below:</p>
            <div style="text-align: center;">
              <a href="${deliveryUrl}" class="button">Access Product</a>
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Or copy this link: <br>
              <a href="${deliveryUrl}" style="color: #0066cc;">${deliveryUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>Have questions? Reply to this email or contact ${supportEmail}</p>
            <p>Sent via ${creatorUsername} on Link App</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })
    return { success: true, id: data.data?.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
