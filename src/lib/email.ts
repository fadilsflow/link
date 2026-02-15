import { Resend } from 'resend'
import { getOrderConfirmationEmailHtml } from './emails/templates'
import { generateInvoicePdf } from './invoice'

const resend = new Resend(process.env.RESEND_API_KEY)

type CreatorSummary = {
  id?: string
  name?: string | null
  email?: string | null
}

type SendOrderEmailParams = {
  to: string
  deliveryUrl: string
  order: any
  creators: Array<CreatorSummary>
}

export async function sendOrderEmail({
  to,
  deliveryUrl,
  order,
  creators,
}: SendOrderEmailParams) {
  const from = 'onboarding@webtron.biz.id'
  const lineItems =
    order.items?.length > 0
      ? order.items.map((item: any) => ({
          title: item.productTitle ?? 'Product',
          quantity: item.quantity ?? 1,
          totalPrice: item.amountPaid ?? 0,
        }))
      : [
          {
            title: order.productTitle ?? 'Product',
            quantity: order.quantity ?? 1,
            totalPrice: order.amountPaid ?? 0,
          },
        ]

  const productLabel =
    lineItems.length === 1 ? lineItems[0].title : `${lineItems.length} products`
  const creatorLabel =
    creators.length === 1
      ? (creators[0]?.name ?? 'Creator')
      : `${creators.length} creators`

  const html = getOrderConfirmationEmailHtml({
    buyerName: order.buyerName || 'Valued Customer',
    orderId: order.id,
    orderDate: new Date(order.createdAt),
    amountPaid: order.amountPaid,
    deliveryUrl,
    creatorName: creatorLabel,
    supportEmail: creators[0]?.email ?? '',
    lineItems,
  })

  const attachments: Array<any> = []
  try {
    const invoiceBuffer = await generateInvoicePdf(order, creators)
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
      subject: `Your order for ${productLabel} is ready!`,
      html,
      attachments,
    })
    return { success: true, id: data.data?.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
