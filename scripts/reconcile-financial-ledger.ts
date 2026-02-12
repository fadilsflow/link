import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  TRANSACTION_TYPE,
  orders,
  products,
  transactions,
  user,
} from '@/db/schema'

async function main() {
  const issues: Array<string> = []

  // 1) cached creator totalRevenue vs ledger aggregate (sale only)
  const creatorRevenueRows = await db
    .select({
      creatorId: user.id,
      cachedRevenue: user.totalRevenue,
      ledgerRevenue:
        sql<number>`COALESCE(SUM(${transactions.amount} - ${transactions.platformFeeAmount}), 0)`.as(
          'ledgerRevenue',
        ),
    })
    .from(user)
    .leftJoin(
      transactions,
      and(
        eq(transactions.creatorId, user.id),
        eq(transactions.type, TRANSACTION_TYPE.SALE),
      ),
    )
    .groupBy(user.id)
    .having(
      sql`COALESCE(SUM(${transactions.amount} - ${transactions.platformFeeAmount}), 0) <> ${user.totalRevenue}`,
    )

  if (creatorRevenueRows.length > 0) {
    issues.push(`creator cache drift on ${creatorRevenueRows.length} creators`)
    console.error(
      '[reconcile] creator revenue drift',
      creatorRevenueRows.slice(0, 20),
    )
  }

  // 2) cached product totalRevenue vs sales ledger aggregate
  const productRevenueRows = await db
    .select({
      productId: products.id,
      cachedRevenue: products.totalRevenue,
      ledgerRevenue:
        sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'sale' THEN ${transactions.netAmount} ELSE 0 END), 0)`.as(
          'ledgerRevenue',
        ),
    })
    .from(products)
    .leftJoin(orders, eq(orders.productId, products.id))
    .leftJoin(transactions, eq(transactions.orderId, orders.id))
    .groupBy(products.id)
    .having(
      sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'sale' THEN ${transactions.netAmount} ELSE 0 END), 0) <> ${products.totalRevenue}`,
    )

  if (productRevenueRows.length > 0) {
    issues.push(`product cache drift on ${productRevenueRows.length} products`)
    console.error(
      '[reconcile] product revenue drift',
      productRevenueRows.slice(0, 20),
    )
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
