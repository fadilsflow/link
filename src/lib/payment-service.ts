import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  ORDER_STATUS,
  TRANSACTION_TYPE,
  metaPixelConfigs,
  orderItems,
  orders,
  paymentSessions,
  paymentWebhookEvents,
  products,
  transactions,
  user,
} from '@/db/schema'
import { BASE_URL } from '@/lib/constans'
import { sendConsolidatedCheckoutEmail, sendOrderEmail } from '@/lib/email'
import {
  calculatePaymentGatewayFee,
  calculatePlatformServiceFee,
  getPaymentMethodCatalogEntry,
} from '@/lib/payment-methods'
import {
  MIDTRANS_PROVIDER,
  buildMidtransChargeRequest,
  createMidtransCharge,
  createMidtransOrderId,
  derivePaymentStatus,
  getMidtransPaymentStatus,
  getMidtransEventKey,
  normalizeMidtransInstructions,
  type MidtransNotificationPayload,
  type MidtransRequestedPaymentMethod,
} from '@/lib/midtrans'
import { sendMetaPurchaseEvent } from '@/lib/meta-events'

const HOLD_PERIOD_DAYS = 7
const PLATFORM_FEE_PERCENT = 5

type CreateSingleProductPaymentParams = {
  productId: string
  buyerEmail: string
  buyerName?: string
  amountPaid: number
  quantity: number
  answers?: Record<string, string>
  note?: string
  paymentMethod: MidtransRequestedPaymentMethod
  purchaseEventId?: string
  sourceUrl?: string
  fbp?: string
  fbc?: string
  clientIpAddress?: string | null
  clientUserAgent?: string | null
}

type CreateMultiProductPaymentParams = {
  items: Array<{
    productId: string
    quantity: number
    amountPaidPerUnit: number
    answers?: Record<string, string>
  }>
  buyerEmail: string
  buyerName?: string
  note?: string
  paymentMethod: MidtransRequestedPaymentMethod
}

type FinalizableOrder = {
  id: string
  creatorId: string | null
  productId: string | null
  buyerEmail: string
  buyerName: string | null
  amountPaid: number
  deliveryToken: string
  status: string
  paymentMethod: string | null
  emailSent: boolean
  checkoutGroupId: string | null
  productTitle: string
  productPrice: number
  quantity: number
  createdAt: Date
  items: Array<{
    id: string
    productId: string | null
    creatorId: string | null
    productTitle: string
    productPrice: number
    quantity: number
    amountPaid: number
  }>
  creator: {
    id: string
    name: string | null
    email: string | null
  } | null
}

function getAvailableAt(): Date {
  const d = new Date()
  d.setDate(d.getDate() + HOLD_PERIOD_DAYS)
  return d
}

function calculateFee(amount: number): {
  feeAmount: number
  netAmount: number
} {
  const feeAmount = Math.round((amount * PLATFORM_FEE_PERCENT) / 100)
  return { feeAmount, netAmount: amount - feeAmount }
}

function getEffectiveUnitPrice(
  product: {
    payWhatYouWant: boolean
    price: number | null
    salePrice: number | null
  },
  amountPaidPerUnit: number,
): number {
  if (product.payWhatYouWant) return amountPaidPerUnit
  if (product.salePrice && product.price && product.salePrice < product.price) {
    return product.salePrice
  }
  return product.price ?? 0
}

function parseCustomerQuestions(
  raw: unknown,
): Array<{ id: string; label: string; required: boolean }> {
  if (typeof raw !== 'string') return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (q: any) =>
          q &&
          typeof q.id === 'string' &&
          typeof q.label === 'string' &&
          typeof q.required === 'boolean',
      )
      .map((q: any) => ({
        id: q.id,
        label: q.label,
        required: q.required,
      }))
  } catch {
    return []
  }
}

function calculateCheckoutTotalAmount(
  subtotalAmount: number,
  paymentMethod: MidtransRequestedPaymentMethod,
) {
  const serviceFeeAmount = calculatePlatformServiceFee(subtotalAmount)
  const gatewayFeeAmount = calculatePaymentGatewayFee(
    subtotalAmount,
    paymentMethod,
  )

  return {
    subtotalAmount,
    serviceFeeAmount,
    gatewayFeeAmount,
    totalAmount: subtotalAmount + serviceFeeAmount + gatewayFeeAmount,
  }
}

function buildPaymentSessionView(
  session: typeof paymentSessions.$inferSelect,
  groupOrders: Array<{
    id: string
    deliveryToken: string
    status: string
    amountPaid: number
    productTitle?: string
    quantity?: number
  }>,
) {
  const instructions = normalizeMidtransInstructions(
    session.chargeResponse ?? session.lastWebhookPayload ?? null,
  )
  const firstCompletedOrder = groupOrders.find(
    (order) => order.status === ORDER_STATUS.COMPLETED,
  )

  const subtotalAmount = groupOrders.reduce(
    (total, order) => total + order.amountPaid,
    0,
  )
  const requestedMethod = session.requestedPaymentMethod as MidtransRequestedPaymentMethod
  const serviceFeeAmount = calculatePlatformServiceFee(subtotalAmount)
  const gatewayFeeAmount = calculatePaymentGatewayFee(
    subtotalAmount,
    requestedMethod,
  )
  const totalAmount = subtotalAmount + serviceFeeAmount + gatewayFeeAmount

  return {
    id: session.id,
    checkoutGroupId: session.checkoutGroupId,
    providerOrderId: session.providerOrderId,
    status: session.status,
    paymentType: session.paymentType,
    requestedPaymentMethod: session.requestedPaymentMethod,
    expiresAt: session.expiresAt?.toISOString() ?? null,
    paidAt: session.paidAt?.toISOString() ?? null,
    amountBreakdown: {
      subtotalAmount,
      serviceFeeAmount,
      gatewayFeeAmount,
      totalAmount,
    },
    selectedPaymentMethod: getPaymentMethodCatalogEntry(requestedMethod),
    orders: groupOrders.map((order) => ({
      id: order.id,
      deliveryToken: order.deliveryToken,
      status: order.status,
      amountPaid: order.amountPaid,
      productTitle: order.productTitle ?? 'Order',
      quantity: order.quantity ?? 1,
    })),
    instructions,
    deliveryUrl: firstCompletedOrder
      ? `${BASE_URL}/d/${firstCompletedOrder.deliveryToken}`
      : null,
    paymentPageUrl: `${BASE_URL}/pay/${session.checkoutGroupId}`,
  }
}

async function refreshRevenueCounters(params: {
  creatorIds: Array<string>
  productIds: Array<string>
}) {
  const creatorIds = [...new Set(params.creatorIds.filter(Boolean))]
  const productIds = [...new Set(params.productIds.filter(Boolean))]

  if (creatorIds.length > 0) {
    const creatorRevenueRows = await db
      .select({
        creatorId: transactions.creatorId,
        totalRevenue: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        totalSalesCount: sql<number>`COALESCE(SUM(COALESCE((${transactions.metadata}->>'quantity')::int, 1)), 0)`,
      })
      .from(transactions)
      .where(
        and(
          inArray(transactions.creatorId, creatorIds),
          eq(transactions.type, TRANSACTION_TYPE.SALE),
        ),
      )
      .groupBy(transactions.creatorId)

    const revenueByCreator = new Map(
      creatorRevenueRows.map((row) => [
        row.creatorId,
        {
          totalRevenue: row.totalRevenue ?? 0,
          totalSalesCount: row.totalSalesCount ?? 0,
        },
      ]),
    )

    await Promise.all(
      creatorIds.map((creatorId) =>
        db
          .update(user)
          .set({
            totalRevenue: revenueByCreator.get(creatorId)?.totalRevenue ?? 0,
            totalSalesCount:
              revenueByCreator.get(creatorId)?.totalSalesCount ?? 0,
          })
          .where(eq(user.id, creatorId)),
      ),
    )
  }

  if (productIds.length > 0) {
    await Promise.all(
      productIds.map(async (productId) => {
        const [productTotals] = await db
          .select({
            totalRevenue: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
            salesCount: sql<number>`COALESCE(SUM(COALESCE((${transactions.metadata}->>'quantity')::int, 1)), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.type, TRANSACTION_TYPE.SALE),
              sql`(${transactions.metadata}->>'productId') = ${productId}`,
            ),
          )

        await db
          .update(products)
          .set({
            totalRevenue: productTotals?.totalRevenue ?? 0,
            salesCount: productTotals?.salesCount ?? 0,
          })
          .where(eq(products.id, productId))
      }),
    )
  }
}

async function fetchOrdersByCheckoutGroup(checkoutGroupId: string) {
  return db.query.orders.findMany({
    where: eq(orders.checkoutGroupId, checkoutGroupId),
    with: {
      creator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        columns: {
          id: true,
          productId: true,
          creatorId: true,
          productTitle: true,
          productPrice: true,
          quantity: true,
          amountPaid: true,
        },
      },
    },
  })
}

async function ensureOrderTransactions(
  order: FinalizableOrder,
  checkoutGroupId: string,
) {
  const lineItems =
    order.items.length > 0
      ? order.items
      : [
          {
            id: order.id,
            productId: order.productId,
            creatorId: order.creatorId,
            productTitle: order.productTitle,
            productPrice: order.productPrice,
            quantity: order.quantity,
            amountPaid: order.amountPaid,
          },
        ]

  const creatorId = order.creatorId
  if (!creatorId) {
    return {
      creatorIds: [] as Array<string>,
      productIds: [] as Array<string>,
    }
  }

  const inserted = await db
    .insert(transactions)
    .values(
      lineItems.map((item) => {
        const { feeAmount, netAmount } = calculateFee(item.amountPaid)
        return {
          id: crypto.randomUUID(),
          creatorId,
          orderId: order.id,
          type: TRANSACTION_TYPE.SALE,
          amount: item.amountPaid,
          netAmount,
          platformFeePercent: PLATFORM_FEE_PERCENT,
          platformFeeAmount: feeAmount,
          description: `Sale: ${item.productTitle} x${item.quantity}`,
          idempotencyKey: `${MIDTRANS_PROVIDER}:${checkoutGroupId}:${order.id}:${item.id}`,
          availableAt: getAvailableAt(),
          metadata: {
            checkoutGroupId,
            productId: item.productId,
            buyerEmail: order.buyerEmail,
            quantity: item.quantity,
          },
        }
      }),
    )
    .onConflictDoNothing()
    .returning({
      creatorId: transactions.creatorId,
      productId: sql<string | null>`(${transactions.metadata}->>'productId')`,
    })

  return {
    creatorIds: inserted.map((row) => row.creatorId),
    productIds: inserted
      .map((row) => row.productId)
      .filter((value): value is string => typeof value === 'string'),
  }
}

async function sendFulfillmentEmails(ordersInGroup: Array<FinalizableOrder>) {
  const pendingEmailOrders = ordersInGroup.filter(
    (order) => order.status === ORDER_STATUS.COMPLETED && !order.emailSent,
  )

  if (pendingEmailOrders.length === 0) return

  if (pendingEmailOrders.length === 1) {
    const order = pendingEmailOrders[0]
    const creator = order.creator
    const result = await sendOrderEmail({
      to: order.buyerEmail,
      deliveryUrl: `${BASE_URL}/d/${order.deliveryToken}`,
      order,
      creators: creator ? [creator] : [],
    })

    if (result.success) {
      await db
        .update(orders)
        .set({ emailSent: true, emailSentAt: new Date() })
        .where(eq(orders.id, order.id))
    }

    return
  }

  const emailResult = await sendConsolidatedCheckoutEmail({
    to: pendingEmailOrders[0].buyerEmail,
    checkoutGroupId: pendingEmailOrders[0].checkoutGroupId ?? pendingEmailOrders[0].id,
    buyerName: pendingEmailOrders[0].buyerName,
    buyerEmail: pendingEmailOrders[0].buyerEmail,
    createdAt: pendingEmailOrders[0].createdAt,
    orders: pendingEmailOrders.map((order) => ({
      id: order.id,
      deliveryToken: order.deliveryToken,
      amountPaid: order.amountPaid,
      creatorName: order.creator?.name ?? 'Creator',
      creatorEmail: order.creator?.email ?? null,
      items:
        order.items.length > 0
          ? order.items.map((item) => ({
              productTitle: item.productTitle,
              quantity: item.quantity,
              amountPaid: item.amountPaid,
              productPrice: item.productPrice,
            }))
          : [
              {
                productTitle: order.productTitle,
                quantity: order.quantity,
                amountPaid: order.amountPaid,
                productPrice: order.productPrice,
              },
            ],
    })),
  })

  if (emailResult.success) {
    await db
      .update(orders)
      .set({ emailSent: true, emailSentAt: new Date() })
      .where(inArray(orders.id, pendingEmailOrders.map((order) => order.id)))
  }
}

async function sendMetaPurchaseEventsForCompletedOrders(
  ordersInGroup: Array<FinalizableOrder>,
  session: typeof paymentSessions.$inferSelect,
) {
  for (const order of ordersInGroup) {
    if (!order.creatorId || order.status !== ORDER_STATUS.COMPLETED) continue

    const metaPixelConfig = await db.query.metaPixelConfigs.findFirst({
      where: eq(metaPixelConfigs.userId, order.creatorId),
    })

    if (!metaPixelConfig) continue

    await sendMetaPurchaseEvent({
      pixelId: metaPixelConfig.pixelId,
      accessToken: metaPixelConfig.accessToken,
      eventId: order.id,
      eventSourceUrl:
        typeof session.metadata?.sourceUrl === 'string'
          ? session.metadata.sourceUrl
          : null,
      value: order.amountPaid,
      currency: session.currency ?? 'IDR',
      buyerEmail: order.buyerEmail,
      productId: order.productId,
      productTitle: order.productTitle,
      orderId: order.id,
      paymentMethod: session.paymentType ?? session.requestedPaymentMethod,
      clientIpAddress:
        typeof session.metadata?.clientIpAddress === 'string'
          ? session.metadata.clientIpAddress
          : null,
      clientUserAgent:
        typeof session.metadata?.clientUserAgent === 'string'
          ? session.metadata.clientUserAgent
          : null,
      fbp:
        typeof session.metadata?.fbp === 'string' ? session.metadata.fbp : null,
      fbc:
        typeof session.metadata?.fbc === 'string' ? session.metadata.fbc : null,
    })
  }
}

export async function createSingleProductPayment(
  params: CreateSingleProductPaymentParams,
) {
  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, params.productId),
      eq(products.isDeleted, false),
    ),
    with: {
      user: true,
    },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  if (!product.isActive) {
    throw new Error('Product is not active')
  }

  if (product.totalQuantity !== null && product.totalQuantity <= 0) {
    throw new Error('Product sold out')
  }
  if (
    product.totalQuantity !== null &&
    product.totalQuantity < params.quantity
  ) {
    throw new Error('Product sold out or not enough stock')
  }
  if (
    product.limitPerCheckout !== null &&
    params.quantity > product.limitPerCheckout
  ) {
    throw new Error('Product exceeds per-checkout limit')
  }

  const questions = parseCustomerQuestions(product.customerQuestions)
  for (const question of questions) {
    if (question.required && !(params.answers?.[question.id] || '').trim()) {
      throw new Error(
        `Please answer required question for ${product.title}: ${question.label}`,
      )
    }
  }

  const effectivePrice = getEffectiveUnitPrice(product, params.amountPaid)
  if (product.payWhatYouWant && product.minimumPrice) {
    if (params.amountPaid < product.minimumPrice) {
      throw new Error(
        `${product.title} requires at least ${product.minimumPrice}`,
      )
    }
  }

  const checkoutGroupId = crypto.randomUUID()
  const providerOrderId = createMidtransOrderId(checkoutGroupId)
  const deliveryToken = crypto.randomUUID()
  const orderId = crypto.randomUUID()
  const subtotalAmount = params.amountPaid * params.quantity
  const totals = calculateCheckoutTotalAmount(
    subtotalAmount,
    params.paymentMethod,
  )

  const [newOrder] = await db
    .insert(orders)
    .values({
      id: orderId,
      creatorId: product.user.id,
      productId: product.id,
      productTitle: product.title,
      productPrice: effectivePrice,
      productImage: product.images?.[0] ?? null,
      buyerEmail: params.buyerEmail,
      buyerName: params.buyerName ?? '',
      quantity: params.quantity,
      amountPaid: subtotalAmount,
      checkoutAnswers: params.answers ?? {},
      note: params.note ?? null,
      status: ORDER_STATUS.PENDING,
      paymentMethod: params.paymentMethod,
      deliveryToken,
      emailSent: false,
      checkoutGroupId,
    })
    .returning()

  const [session] = await db
    .insert(paymentSessions)
    .values({
      id: crypto.randomUUID(),
      checkoutGroupId,
      provider: MIDTRANS_PROVIDER,
      providerOrderId,
      status: 'pending',
      requestedPaymentMethod: params.paymentMethod,
      grossAmount: totals.totalAmount,
      buyerEmail: params.buyerEmail,
      buyerName: params.buyerName ?? null,
      metadata: {
        sourceUrl: params.sourceUrl ?? null,
        purchaseEventId: params.purchaseEventId ?? null,
        fbp: params.fbp ?? null,
        fbc: params.fbc ?? null,
        clientIpAddress: params.clientIpAddress ?? null,
        clientUserAgent: params.clientUserAgent ?? null,
        subtotalAmount: totals.subtotalAmount,
        serviceFeeAmount: totals.serviceFeeAmount,
        gatewayFeeAmount: totals.gatewayFeeAmount,
      },
    })
    .returning()

  const chargeRequest = buildMidtransChargeRequest({
    providerOrderId,
    requestedMethod: params.paymentMethod,
    grossAmount: totals.totalAmount,
    buyerEmail: params.buyerEmail,
    buyerName: params.buyerName ?? null,
    serviceFeeAmount: totals.serviceFeeAmount,
    gatewayFeeAmount: totals.gatewayFeeAmount,
    itemDetails: [
      {
        id: product.id,
        price: params.amountPaid,
        quantity: params.quantity,
        name: product.title,
      },
    ],
  })

  try {
    const chargeResponse = await createMidtransCharge(chargeRequest)
    const normalizedStatus = derivePaymentStatus({
      transactionStatus: chargeResponse.transaction_status,
      fraudStatus: chargeResponse.fraud_status,
    })

    const [updatedSession] = await db
      .update(paymentSessions)
      .set({
        status: normalizedStatus,
        paymentType: chargeResponse.payment_type ?? chargeRequest.payment_type,
        transactionStatus: chargeResponse.transaction_status ?? null,
        fraudStatus: chargeResponse.fraud_status ?? null,
        providerTransactionId: chargeResponse.transaction_id ?? null,
        expiresAt: chargeResponse.expiry_time
          ? new Date(chargeResponse.expiry_time)
          : null,
        chargeRequest,
        chargeResponse,
        updatedAt: new Date(),
      })
      .where(eq(paymentSessions.id, session.id))
      .returning()

    return {
      order: newOrder,
      payment: buildPaymentSessionView(updatedSession, [newOrder]),
    }
  } catch (error) {
    await db
      .update(paymentSessions)
      .set({
        status: 'failed',
        chargeRequest,
        chargeResponse: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        updatedAt: new Date(),
      })
      .where(eq(paymentSessions.id, session.id))

    throw error
  }
}

export async function createMultiProductPayment(
  params: CreateMultiProductPaymentParams,
) {
  if (params.items.length === 0) {
    throw new Error('No items selected for checkout')
  }

  const checkoutGroupId = crypto.randomUUID()
  const providerOrderId = createMidtransOrderId(checkoutGroupId)
  const productIds = [...new Set(params.items.map((item) => item.productId))]
  const productsList = await db.query.products.findMany({
    where: and(
      inArray(products.id, productIds),
      eq(products.isDeleted, false),
    ),
    with: { user: true },
  })

  const productMap = new Map(productsList.map((product) => [product.id, product]))
  const normalizedItems: Array<{
    product: (typeof productsList)[number]
    quantity: number
    amountPaidPerUnit: number
    effectivePrice: number
    totalAmount: number
    answers: Record<string, string>
    creatorId: string
  }> = []

  for (const item of params.items) {
    const product = productMap.get(item.productId)
    if (!product) {
      throw new Error('One or more selected products no longer exist')
    }
    if (!product.isActive) {
      throw new Error(`${product.title} is no longer available`)
    }
    if (product.totalQuantity !== null && product.totalQuantity < item.quantity) {
      throw new Error(`Product ${product.title} sold out or not enough stock`)
    }
    if (
      product.limitPerCheckout !== null &&
      item.quantity > product.limitPerCheckout
    ) {
      throw new Error(`Product ${product.title} exceeds per-checkout limit`)
    }

    const questions = parseCustomerQuestions(product.customerQuestions)
    for (const question of questions) {
      if (question.required && !(item.answers?.[question.id] || '').trim()) {
        throw new Error(
          `Please answer required question for ${product.title}: ${question.label}`,
        )
      }
    }

    const effectivePrice = getEffectiveUnitPrice(product, item.amountPaidPerUnit)
    if (product.payWhatYouWant && product.minimumPrice) {
      if (item.amountPaidPerUnit < product.minimumPrice) {
        throw new Error(`${product.title} requires at least ${product.minimumPrice}`)
      }
    }

    normalizedItems.push({
      product,
      quantity: item.quantity,
      amountPaidPerUnit: item.amountPaidPerUnit,
      effectivePrice,
      totalAmount: item.amountPaidPerUnit * item.quantity,
      answers: item.answers ?? {},
      creatorId: product.user.id,
    })
  }

  const itemsByCreator = new Map<string, Array<(typeof normalizedItems)[number]>>()
  for (const item of normalizedItems) {
    const existing = itemsByCreator.get(item.creatorId) ?? []
    existing.push(item)
    itemsByCreator.set(item.creatorId, existing)
  }

  const createdOrders: Array<{
    id: string
    deliveryToken: string
    amountPaid: number
    status: string
  }> = []

  for (const [creatorId, creatorItems] of itemsByCreator.entries()) {
    const orderId = crypto.randomUUID()
    const deliveryToken = crypto.randomUUID()
    const orderAmount = creatorItems.reduce(
      (total, item) => total + item.totalAmount,
      0,
    )
    const totalQuantity = creatorItems.reduce(
      (total, item) => total + item.quantity,
      0,
    )
    const primaryItem = creatorItems[0]

    const [order] = await db
      .insert(orders)
      .values({
        id: orderId,
        creatorId,
        productId: creatorItems.length === 1 ? primaryItem.product.id : null,
        productTitle:
          creatorItems.length === 1
            ? primaryItem.product.title
            : `${creatorItems.length} products`,
        productPrice:
          creatorItems.length === 1 ? primaryItem.effectivePrice : orderAmount,
        productImage: primaryItem.product.images?.[0] ?? null,
        buyerEmail: params.buyerEmail,
        buyerName: params.buyerName ?? '',
        amountPaid: orderAmount,
        quantity: totalQuantity,
        checkoutAnswers: null,
        note: params.note ?? null,
        status: ORDER_STATUS.PENDING,
        paymentMethod: params.paymentMethod,
        deliveryToken,
        emailSent: false,
        checkoutGroupId,
      })
      .returning({
        id: orders.id,
        deliveryToken: orders.deliveryToken,
        amountPaid: orders.amountPaid,
        status: orders.status,
      })

    await db.insert(orderItems).values(
      creatorItems.map((item) => ({
        id: crypto.randomUUID(),
        orderId,
        creatorId,
        productId: item.product.id,
        productTitle: item.product.title,
        productPrice: item.effectivePrice,
        productImage: item.product.images?.[0] ?? null,
        quantity: item.quantity,
        amountPaid: item.totalAmount,
        checkoutAnswers: item.answers,
      })),
    )

    createdOrders.push(order)
  }

  const grossAmount = normalizedItems.reduce(
    (total, item) => total + item.totalAmount,
    0,
  )
  const totals = calculateCheckoutTotalAmount(grossAmount, params.paymentMethod)

  const [session] = await db
    .insert(paymentSessions)
    .values({
      id: crypto.randomUUID(),
      checkoutGroupId,
      provider: MIDTRANS_PROVIDER,
      providerOrderId,
      status: 'pending',
      requestedPaymentMethod: params.paymentMethod,
      grossAmount: totals.totalAmount,
      buyerEmail: params.buyerEmail,
      buyerName: params.buyerName ?? null,
      metadata: {
        subtotalAmount: totals.subtotalAmount,
        serviceFeeAmount: totals.serviceFeeAmount,
        gatewayFeeAmount: totals.gatewayFeeAmount,
      },
    })
    .returning()

  const chargeRequest = buildMidtransChargeRequest({
    providerOrderId,
    requestedMethod: params.paymentMethod,
    grossAmount: totals.totalAmount,
    buyerEmail: params.buyerEmail,
    buyerName: params.buyerName ?? null,
    serviceFeeAmount: totals.serviceFeeAmount,
    gatewayFeeAmount: totals.gatewayFeeAmount,
    itemDetails: normalizedItems.map((item) => ({
      id: item.product.id,
      price: item.amountPaidPerUnit,
      quantity: item.quantity,
      name: item.product.title,
    })),
  })

  try {
    const chargeResponse = await createMidtransCharge(chargeRequest)
    const normalizedStatus = derivePaymentStatus({
      transactionStatus: chargeResponse.transaction_status,
      fraudStatus: chargeResponse.fraud_status,
    })

    const [updatedSession] = await db
      .update(paymentSessions)
      .set({
        status: normalizedStatus,
        paymentType: chargeResponse.payment_type ?? chargeRequest.payment_type,
        transactionStatus: chargeResponse.transaction_status ?? null,
        fraudStatus: chargeResponse.fraud_status ?? null,
        providerTransactionId: chargeResponse.transaction_id ?? null,
        expiresAt: chargeResponse.expiry_time
          ? new Date(chargeResponse.expiry_time)
          : null,
        chargeRequest,
        chargeResponse,
        updatedAt: new Date(),
      })
      .where(eq(paymentSessions.id, session.id))
      .returning()

    return {
      checkoutGroupId,
      orders: createdOrders,
      payment: buildPaymentSessionView(updatedSession, createdOrders),
    }
  } catch (error) {
    await db
      .update(paymentSessions)
      .set({
        status: 'failed',
        chargeRequest,
        chargeResponse: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        updatedAt: new Date(),
      })
      .where(eq(paymentSessions.id, session.id))

    throw error
  }
}

export async function getPaymentSessionByCheckoutGroup(checkoutGroupId: string) {
  const session = await db.query.paymentSessions.findFirst({
    where: eq(paymentSessions.checkoutGroupId, checkoutGroupId),
  })

  if (!session) return null

  const groupOrders = await db.query.orders.findMany({
    where: eq(orders.checkoutGroupId, checkoutGroupId),
    columns: {
      id: true,
      deliveryToken: true,
      status: true,
      amountPaid: true,
      productTitle: true,
      quantity: true,
    },
  })

  return buildPaymentSessionView(session, groupOrders)
}

async function applyMidtransStatusToSession(
  session: typeof paymentSessions.$inferSelect,
  payload: {
    order_id?: string
    transaction_id?: string
    transaction_status?: string
    fraud_status?: string
    status_code?: string
    payment_type?: string
    transaction_time?: string
    expiry_time?: string
  },
  options?: {
    eventKey?: string | null
    recordNotificationPayload?: boolean
  },
) {
  const normalizedStatus = derivePaymentStatus({
    transactionStatus: payload.transaction_status,
    fraudStatus: payload.fraud_status,
  })

  const [updatedSession] = await db
    .update(paymentSessions)
    .set({
      status: normalizedStatus,
      paymentType: payload.payment_type ?? session.paymentType,
      requestedPaymentMethod: session.requestedPaymentMethod,
      transactionStatus: payload.transaction_status ?? null,
      fraudStatus: payload.fraud_status ?? null,
      providerTransactionId: payload.transaction_id ?? null,
      paidAt:
        normalizedStatus === 'paid'
          ? new Date(payload.transaction_time ?? new Date().toISOString())
          : session.paidAt,
      expiresAt: payload.expiry_time
        ? new Date(payload.expiry_time)
        : session.expiresAt,
      lastNotifiedAt: options?.recordNotificationPayload ? new Date() : session.lastNotifiedAt,
      lastWebhookEventKey: options?.eventKey ?? session.lastWebhookEventKey,
      lastWebhookPayload:
        options?.recordNotificationPayload
          ? payload
          : session.lastWebhookPayload,
      updatedAt: new Date(),
    })
    .where(eq(paymentSessions.id, session.id))
    .returning()

  const groupOrders = (await fetchOrdersByCheckoutGroup(
    updatedSession.checkoutGroupId,
  )) as Array<FinalizableOrder>

  if (normalizedStatus === 'paid') {
    const creatorIds = new Set<string>()
    const productIds = new Set<string>()

    for (const order of groupOrders) {
      await db
        .update(orders)
        .set({
          status: ORDER_STATUS.COMPLETED,
          paymentMethod:
            payload.payment_type ?? updatedSession.paymentType ?? order.paymentMethod,
          paidAt: updatedSession.paidAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))

      const insertedKeys = await ensureOrderTransactions(
        order,
        updatedSession.checkoutGroupId,
      )
      insertedKeys.creatorIds.forEach((id) => creatorIds.add(id))
      insertedKeys.productIds.forEach((id) => productIds.add(id))
    }

    await refreshRevenueCounters({
      creatorIds: [...creatorIds],
      productIds: [...productIds],
    })

    const refreshedOrders = (await fetchOrdersByCheckoutGroup(
      updatedSession.checkoutGroupId,
    )) as Array<FinalizableOrder>

    await sendFulfillmentEmails(refreshedOrders)
    await sendMetaPurchaseEventsForCompletedOrders(refreshedOrders, updatedSession)
  }

  if (
    normalizedStatus === 'failed' ||
    normalizedStatus === 'expired' ||
    normalizedStatus === 'cancelled'
  ) {
    await db
      .update(orders)
      .set({
        status: ORDER_STATUS.CANCELLED,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.checkoutGroupId, updatedSession.checkoutGroupId),
          eq(orders.status, ORDER_STATUS.PENDING),
        ),
      )
  }

  return {
    found: true,
    status: normalizedStatus,
  }
}

export async function refreshPaymentSessionStatus(checkoutGroupId: string) {
  const session = await db.query.paymentSessions.findFirst({
    where: eq(paymentSessions.checkoutGroupId, checkoutGroupId),
  })

  if (!session) return null

  const latestStatus = await getMidtransPaymentStatus(session.providerOrderId)
  await applyMidtransStatusToSession(session, latestStatus)
  return getPaymentSessionByCheckoutGroup(checkoutGroupId)
}

export async function processMidtransNotification(
  payload: MidtransNotificationPayload,
) {
  const eventKey = getMidtransEventKey(payload)
  const existingEvent = await db.query.paymentWebhookEvents.findFirst({
    where: and(
      eq(paymentWebhookEvents.provider, MIDTRANS_PROVIDER),
      eq(paymentWebhookEvents.eventKey, eventKey),
    ),
  })

  if (existingEvent) {
    return { duplicate: true }
  }

  await db.insert(paymentWebhookEvents).values({
    id: crypto.randomUUID(),
    provider: MIDTRANS_PROVIDER,
    providerOrderId: payload.order_id ?? '',
    eventKey,
    eventType: payload.transaction_status ?? null,
    payload,
  })

  const session = await db.query.paymentSessions.findFirst({
    where: and(
      eq(paymentSessions.provider, MIDTRANS_PROVIDER),
      eq(paymentSessions.providerOrderId, payload.order_id ?? ''),
    ),
  })

  if (!session) {
    return { duplicate: false, found: false }
  }
  const syncResult = await applyMidtransStatusToSession(session, payload, {
    eventKey,
    recordNotificationPayload: true,
  })

  return {
    duplicate: false,
    found: syncResult.found,
    status: syncResult.status,
  }
}
