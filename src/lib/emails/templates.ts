import { formatPrice } from '@/lib/utils'

interface BaseEmailProps {
  previewText?: string
  children: string
}

const BaseEmail = ({ previewText, children }: BaseEmailProps) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 0;
        background-color: #f4f4f5;
      }
      .container {
        background-color: #ffffff;
        margin: 20px auto;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      .header {
        background-color: #ffffff;
        padding: 30px 40px;
        text-align: center;
        border-bottom: 1px solid #f4f4f5;
      }
      .logo {
        font-size: 24px;
        font-weight: 800;
        color: #000;
        text-decoration: none;
        letter-spacing: -0.5px;
      }
      .content {
        padding: 40px;
      }
      .footer {
        padding: 30px 40px;
        text-align: center;
        font-size: 12px;
        color: #71717a;
        background-color: #fafafa;
        border-top: 1px solid #f4f4f5;
      }
      .button {
        display: inline-block;
        background-color: #18181b;
        color: #fff !important;
        padding: 14px 28px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin-top: 24px;
        font-size: 14px;
      }
      .divider {
        height: 1px;
        background-color: #e4e4e7;
        margin: 30px 0;
      }
      .summary-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      .summary-table th {
        text-align: left;
        padding: 12px 0;
        border-bottom: 1px solid #e4e4e7;
        font-weight: 600;
        font-size: 14px;
        color: #71717a;
      }
      .summary-table td {
        padding: 12px 0;
        border-bottom: 1px solid #f4f4f5;
        font-size: 14px;
      }
      .total-row td {
        font-weight: 700;
        border-top: 1px solid #e4e4e7;
        border-bottom: none;
        padding-top: 16px;
        font-size: 16px;
      }
      .text-sm {
        font-size: 14px;
        color: #52525b;
      }
      .text-muted {
        color: #71717a;
      }
      .link {
        color: #2563eb;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div style="display: none; max-height: 0px; overflow: hidden;">
      ${previewText || ''}
    </div>
    <div class="container">
      <div class="header">
        <a href="https://webtron.biz.id" class="logo">Link App</a>
      </div>
      <div class="content">
        ${children}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Link App. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`

export type OrderEmailProps = {
  buyerName: string
  orderId: string
  orderDate: Date
  amountPaid: number
  deliveryUrl: string
  creatorName: string
  supportEmail: string
  lineItems: Array<{
    title: string
    quantity: number
    totalPrice: number
  }>
}

export const getOrderConfirmationEmailHtml = ({
  buyerName,
  orderId,
  orderDate,
  amountPaid,
  deliveryUrl,
  creatorName,
  supportEmail,
  lineItems,
}: OrderEmailProps) => {
  const formattedDate = new Date(orderDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Order summary content
  const content = `
    <h2 style="margin-top: 0; font-size: 24px; font-weight: 700; color: #18181b;">
      Thanks for your order!
    </h2>
    <p class="text-sm">
      Hi ${buyerName || 'there'}, we're excited to let you know that your order from <strong>${creatorName}</strong> has been processed successfully.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${deliveryUrl}" class="button">Access Your Content</a>
    </div>

    <div class="divider"></div>

    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Order Summary</h3>
    <p class="text-sm text-muted" style="margin-bottom: 8px;">Order ID: ${orderId.slice(0, 8).toUpperCase()}</p>
    <p class="text-sm text-muted">Date: ${formattedDate}</p>

    <table class="summary-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems
          .map(
            (item) => `
        <tr>
          <td>${item.title}${item.quantity > 1 ? ` <span class="text-muted">× ${item.quantity}</span>` : ''}</td>
          <td style="text-align: right;">${formatPrice(item.totalPrice)}</td>
        </tr>`,
          )
          .join('')}
        <tr class="total-row">
          <td>Total</td>
          <td style="text-align: right;">${formatPrice(amountPaid)}</td>
        </tr>
      </tbody>
    </table>

    <div class="divider"></div>

    <p class="text-sm text-muted">
      Since this is a digital product, you can access it immediately. We've also attached an invoice for your records.
    </p>

    <p class="text-sm text-muted" style="margin-top: 24px;">
      If you have any questions, please reply to this email or contact <a href="mailto:${supportEmail}" class="link">${supportEmail}</a>.
    </p>
  `

  return BaseEmail({
    previewText: `Your order is confirmed!`,
    children: content,
  })
}
