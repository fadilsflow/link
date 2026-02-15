import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatPrice } from '@/lib/utils'

export function generateInvoicePdf(
  order: any,
  creators: Array<{ name?: string | null; email?: string | null }>,
): Buffer {
  const doc = new jsPDF()
  doc.setFont('helvetica')

  doc.setFontSize(20)
  doc.text('INVOICE', 14, 22)

  doc.setFontSize(10)
  doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, 14, 30)
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 35)

  const sellerNames = creators
    .map((creator) => creator.name)
    .filter(Boolean)
    .join(', ')
  const primaryEmail = creators.find((creator) => creator.email)?.email ?? ''

  const pageWidth = doc.internal.pageSize.width
  doc.text(sellerNames || 'Seller', pageWidth - 14, 22, { align: 'right' })
  doc.text(primaryEmail, pageWidth - 14, 27, { align: 'right' })

  doc.text('Bill To:', 14, 50)
  doc.setFontSize(12)
  doc.text(order.buyerName || order.buyerEmail, 14, 56)
  doc.setFontSize(10)
  doc.text(order.buyerEmail, 14, 61)

  const lineItems =
    order.items?.length > 0
      ? order.items.map((item: any) => ({
          title: item.productTitle ?? 'Product',
          quantity: item.quantity ?? 1,
          unitPrice: item.productPrice ?? item.amountPaid,
          totalPrice: item.amountPaid ?? 0,
        }))
      : [
          {
            title: order.productTitle ?? 'Product',
            quantity: order.quantity ?? 1,
            unitPrice: order.productPrice ?? order.amountPaid,
            totalPrice: order.amountPaid,
          },
        ]

  const tableColumn = ['Item', 'Quantity', 'Price', 'Total']
  const tableRows = lineItems.map((item: any) => [
    item.title,
    item.quantity,
    formatPrice(item.unitPrice),
    formatPrice(item.totalPrice),
  ])

  const autoTableFn = (autoTable as any).default || autoTable
  if (typeof autoTableFn === 'function') {
    autoTableFn(doc, {
      startY: 70,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
    })
  }

  const finalY = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 10
    : 80

  doc.setFontSize(12)
  doc.text(`Total: ${formatPrice(order.amountPaid)}`, pageWidth - 14, finalY, {
    align: 'right',
  })

  doc.setFontSize(10)
  doc.text('Thank you for your business!', 14, finalY + 25)

  return Buffer.from(doc.output('arraybuffer'))
}
