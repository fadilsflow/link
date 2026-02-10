import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatPrice } from '@/lib/utils'

// Add type definition for jspdf-autotable

export async function generateInvoicePdf(
  order: any,
  product: any,
  creator: any,
): Promise<Buffer> {
  // Create a new PDF document
  const doc = new jsPDF()

  // Set font
  doc.setFont('helvetica')

  // Header
  doc.setFontSize(20)
  doc.text('INVOICE', 14, 22)

  doc.setFontSize(10)
  doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, 14, 30)
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 35)

  // Seller Info (Right aligned) — use snapshot creator data
  const pageWidth = doc.internal.pageSize.width
  doc.text(creator.name || 'Seller', pageWidth - 14, 22, { align: 'right' })
  doc.text(creator.email || '', pageWidth - 14, 27, { align: 'right' })

  // Bill To
  doc.text('Bill To:', 14, 50)
  doc.setFontSize(12)
  doc.text(order.buyerName || order.buyerEmail, 14, 56)
  doc.setFontSize(10)
  doc.text(order.buyerEmail, 14, 61)

  // Order Items Table — use snapshot product title from order
  const displayTitle = order.productTitle ?? product.title ?? 'Product'
  const tableColumn = ['Item', 'Quantity', 'Price', 'Total']
  const tableRows = [
    [
      displayTitle,
      order.quantity || 1,
      formatPrice(order.amountPaid),
      formatPrice(order.amountPaid),
    ],
  ]

  // Handle potential module interop issues with jspdf-autotable
  const autoTableFn = (autoTable as any).default || autoTable

  if (typeof autoTableFn === 'function') {
    autoTableFn(doc, {
      startY: 70,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
    })
  } else {
    console.warn('jspdf-autotable is not a function:', autoTable, autoTableFn)
    // Fallback or error handling
  }

  // Total
  const finalY = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 10
    : 80

  doc.setFontSize(12)
  doc.text(`Total: ${formatPrice(order.amountPaid)}`, pageWidth - 14, finalY, {
    align: 'right',
  })


  // Footer
  doc.setFontSize(10)
  doc.text('Thank you for your business!', 14, finalY + 25)

  // Return as Buffer
  return Buffer.from(doc.output('arraybuffer'))
}
