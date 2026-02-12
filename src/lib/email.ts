import { Resend } from 'resend'
import { getOrderConfirmationEmailHtml } from './emails/templates'
import { generateInvoicePdf } from './invoice'

// Initialize Resend with API key
// Ideally this should be in process.env.RESEND_API_KEY
// The user should have this set up in their environment
const resend = new Resend(process.env.RESEND_API_KEY)

type SendOrderEmailParams = {
  to: string
  deliveryUrl: string
  order: any
  product: any
  creator: any
}

export async function sendOrderEmail({
  to,
  deliveryUrl,
  order,
  product,
  creator,
}: SendOrderEmailParams) {
  // Use a verified domain or the resend testing domain
  const from = 'onboarding@webtron.biz.id'
  const subject = `Your order for ${product.title} is ready!`

  const html = getOrderConfirmationEmailHtml({
    buyerName: order.buyerName || 'Valued Customer',
    productName: product.title,
    orderId: order.id,
    orderDate: new Date(order.createdAt),
    amountPaid: order.amountPaid,
    deliveryUrl,
    creatorName: creator.name,
    supportEmail: creator.email,
  })

  // Generate invoice
  const attachments: Array<any> = []
  try {
    const invoiceBuffer = await generateInvoicePdf(order, product, creator)
    attachments.push({
      filename: `Invoice-${order.id.slice(0, 8)}.pdf`,
      content: invoiceBuffer,
    })
  } catch (error) {
    console.error('Failed to generate invoice:', error)
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments,
    })
    return { success: true, id: data.data?.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
