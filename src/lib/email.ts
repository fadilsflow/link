import { Resend } from 'resend'
import { getOrderConfirmationEmailHtml } from './emails/templates'
import { generateInvoicePdf } from './invoice'
import { BASE_URL } from '@/lib/constans'

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

type SendConsolidatedCheckoutEmailParams = {
  to: string
  checkoutGroupId: string
  buyerName?: string | null
  buyerEmail: string
  createdAt: Date
  orders: Array<{
    id: string
    deliveryToken: string
    amountPaid: number
    creatorName: string
    creatorEmail?: string | null
    items: Array<{
      productTitle: string
      quantity: number
      amountPaid: number
      productPrice?: number
    }>
  }>
}

function getLineItems(order: any) {
  return order.items?.length > 0
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
}

export async function sendOrderEmail({
  to,
  deliveryUrl,
  order,
  creators,
}: SendOrderEmailParams) {
  const from = 'onboarding@webtron.biz.id'
  const lineItems = getLineItems(order)
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

export async function sendConsolidatedCheckoutEmail({
  to,
  checkoutGroupId,
  buyerName,
  buyerEmail,
  createdAt,
  orders,
}: SendConsolidatedCheckoutEmailParams) {
  const from = 'onboarding@webtron.biz.id'
  const flattenedItems = orders.flatMap((order) => order.items)
  const totalAmountPaid = orders.reduce(
    (acc, order) => acc + order.amountPaid,
    0,
  )

  const invoiceOrder = {
    id: checkoutGroupId,
    createdAt,
    buyerName,
    buyerEmail,
    amountPaid: totalAmountPaid,
    items: flattenedItems,
  }

  const creators: Array<CreatorSummary> = Array.from(
    new Map(
      orders.map((order) => [
        order.creatorName,
        { name: order.creatorName, email: order.creatorEmail },
      ]),
    ).values(),
  )

  const html = getOrderConfirmationEmailHtml({
    buyerName: buyerName || 'Valued Customer',
    orderId: checkoutGroupId,
    orderDate: createdAt,
    amountPaid: totalAmountPaid,
    deliveryUrl: `${BASE_URL}/d/${orders[0]?.deliveryToken ?? ''}`,
    deliveryLinks: orders.map((order) => ({
      label: `Access ${order.creatorName}'s delivery`,
      url: `${BASE_URL}/d/${order.deliveryToken}`,
    })),
    creatorName:
      creators.length === 1
        ? (creators[0]?.name ?? 'Creator')
        : `${creators.length} creators`,
    supportEmail: creators[0]?.email ?? '',
    lineItems: flattenedItems.map((item) => ({
      title: item.productTitle,
      quantity: item.quantity,
      totalPrice: item.amountPaid,
    })),
  })

  const attachments: Array<any> = []
  try {
    const invoiceBuffer = await generateInvoicePdf(invoiceOrder, creators)
    attachments.push({
      filename: `Invoice-${checkoutGroupId.slice(0, 8)}.pdf`,
      content: invoiceBuffer,
    })
  } catch (error) {
    console.error('Failed to generate invoice:', error)
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject: `Your checkout with ${flattenedItems.length} items is ready!`,
      html,
      attachments,
    })
    return { success: true, id: data.data?.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
