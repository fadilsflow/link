import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import { orders, products, transactions, TRANSACTION_TYPE, user } from '@/db/schema'

async function main() {
  const issues: string[] = []

  // 1) orders.refundedAmount vs refund ledger aggregate per order
  const refundDriftRows = await db
    .select({
      orderId: orders.id,
      orderRefundedAmount: orders.refundedAmount,
      ledgerRefundedAmount:
        sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} IN ('refund', 'partial_refund') AND ${transactions.amount} < 0 THEN -${transactions.amount} ELSE 0 END), 0)`.as(
          'ledgerRefundedAmount',
        ),
    })
    .from(orders)
    .leftJoin(transactions, eq(transactions.orderId, orders.id))
    .groupBy(orders.id)
    .having(
      sql`COALESCE(SUM(CASE WHEN ${transactions.type} IN ('refund', 'partial_refund') AND ${transactions.amount} < 0 THEN -${transactions.amount} ELSE 0 END), 0) <> ${orders.refundedAmount}`,
    )

  if (refundDriftRows.length > 0) {
    issues.push(`refund drift on ${refundDriftRows.length} orders`)
    console.error('[reconcile] order refund drift', refundDriftRows.slice(0, 20))
  }

  // 2) cached creator totalRevenue vs ledger aggregate (sale/refund only)
  const creatorRevenueRows = await db
    .select({
      creatorId: user.id,
      cachedRevenue: user.totalRevenue,
      ledgerRevenue: sql<number>`COALESCE(SUM(${transactions.amount} - ${transactions.platformFeeAmount}), 0)`.as(
        'ledgerRevenue',
      ),
    })
    .from(user)
    .leftJoin(
      transactions,
      and(
        eq(transactions.creatorId, user.id),
        inArray(transactions.type, [
          TRANSACTION_TYPE.SALE,
          TRANSACTION_TYPE.REFUND,
          TRANSACTION_TYPE.PARTIAL_REFUND,
        ]),
      ),
    )
    .groupBy(user.id)
    .having(
      sql`COALESCE(SUM(${transactions.amount} - ${transactions.platformFeeAmount}), 0) <> ${user.totalRevenue}`,
    )

  if (creatorRevenueRows.length > 0) {
    issues.push(`creator cache drift on ${creatorRevenueRows.length} creators`)
    console.error('[reconcile] creator revenue drift', creatorRevenueRows.slice(0, 20))
  }

  // 3) cached product totalRevenue vs orders net (amountPaid - refundedAmount)
  const productRevenueRows = await db
    .select({
      productId: products.id,
      cachedRevenue: products.totalRevenue,
      orderBackedRevenue:
        sql<number>`COALESCE(SUM(${orders.amountPaid} - ${orders.refundedAmount}), 0)`.as(
          'orderBackedRevenue',
        ),
    })
    .from(products)
    .leftJoin(orders, eq(orders.productId, products.id))
    .groupBy(products.id)
    .having(
      sql`COALESCE(SUM(${orders.amountPaid} - ${orders.refundedAmount}), 0) <> ${products.totalRevenue}`,
    )

  if (productRevenueRows.length > 0) {
    issues.push(`product cache drift on ${productRevenueRows.length} products`)
    console.error('[reconcile] product revenue drift', productRevenueRows.slice(0, 20))
  }

  if (issues.length > 0) {
    console.error('[reconcile] finance drift detected', { issues })
    process.exitCode = 1
    return
  }

  console.log('[reconcile] ok: no financial drift detected')
}

main().catch((error) => {
  console.error('[reconcile] fatal error', error)
  process.exit(1)
})
