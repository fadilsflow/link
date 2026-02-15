import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { type ThemeOption } from '@/lib/theme'
import { type BlockStyle, type BlockRadius } from '@/lib/block-styles'

// ─── Status Enums ────────────────────────────────────────────────────────────

export const ORDER_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const TRANSACTION_TYPE = {
  SALE: 'sale',
  PAYOUT: 'payout',
  FEE: 'fee',
  ADJUSTMENT: 'adjustment',
} as const

export type TransactionType =
  (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE]

export const PAYOUT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export type PayoutStatus = (typeof PAYOUT_STATUS)[keyof typeof PAYOUT_STATUS]

// ─── Core Tables ─────────────────────────────────────────────────────────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  username: text('username').unique(),
  bio: text('bio'),
  title: text('title'),
  // Custom profile banner image.
  appearanceBgImageUrl: text('appearance_bg_image_url'),
  appearanceBlockStyle: text('appearance_block_style')
    .$type<BlockStyle>()
    .default('basic')
    .notNull(),
  appearanceBlockRadius: text('appearance_block_radius')
    .$type<BlockRadius>()
    .default('rounded')
    .notNull(),
  publicTheme: text('public_theme')
    .$type<ThemeOption>()
    .default('system')
    .notNull(),
  // Denormalized analytics (cached, derived from transactions & events)
  totalRevenue: integer('total_revenue').notNull().default(0), // in cents — cached from transactions
  totalSalesCount: integer('total_sales_count').notNull().default(0),
  totalViews: integer('total_views').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const products = pgTable('product', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  // Pricing
  payWhatYouWant: boolean('pay_what_you_want').notNull().default(false),
  price: integer('price'), // in smallest currency unit (e.g. cents)
  salePrice: integer('sale_price'),
  minimumPrice: integer('minimum_price'),
  suggestedPrice: integer('suggested_price'),
  // Quantity limits (MVP – no inventory tracking)
  totalQuantity: integer('total_quantity'),
  limitPerCheckout: integer('limit_per_checkout'),
  // Delivery
  productUrl: text('product_url'),
  productFiles: json('product_files').$type<
    Array<{
      id: string
      name: string
      size: number
      type: string
      url: string
    }>
  >(), // Array of file objects
  images: text('images').array(), // Array of image URLs
  // Custom checkout questions (JSON string for simple, extendable schema)
  customerQuestions: text('customer_questions'),
  // Denormalized analytics (cached, derived from transactions)
  salesCount: integer('sales_count').notNull().default(0),
  totalRevenue: integer('total_revenue').notNull().default(0), // in cents — cached
  // Visibility
  isActive: boolean('is_active').notNull().default(true),
  // Soft delete — product stays in DB for historical orders & audit
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const blocks = pgTable('block', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url'),
  type: text('type').notNull().default('link'),
  content: text('content'),
  order: integer('order').notNull().default(0),
  isEnabled: boolean('is_enabled').notNull().default(true),
  isArchived: boolean('is_archived').notNull().default(false),
  clicks: integer('clicks').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const socialLinks = pgTable('social_link', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  url: text('url').notNull(),
  order: integer('order').notNull().default(0),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Commerce / Financial Tables ─────────────────────────────────────────────

/**
 * Orders table — stores every purchase with snapshot data.
 *
 * DESIGN NOTES:
 * - productId uses 'set null' on delete → order survives product removal
 * - creatorId uses 'set null' on delete → order survives account removal
 * - Product snapshot fields capture the state at time of purchase
 * - Financial data (amountPaid) is immutable audit trail
 */
export const orders = pgTable(
  'order',
  {
    id: text('id').primaryKey(),
    // Creator (seller) reference — nullable to survive account deletion
    creatorId: text('creator_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    // Product reference — nullable to survive product deletion
    productId: text('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    // ── Product snapshot at checkout time (immutable) ──
    productTitle: text('product_title').notNull(),
    productPrice: integer('product_price').notNull(), // unit price in cents at checkout
    productImage: text('product_image'), // first image URL at checkout
    // Buyer information
    buyerEmail: text('buyer_email').notNull(),
    buyerName: text('buyer_name'),
    // Quantity of items purchased
    quantity: integer('quantity').notNull().default(1),
    // Amount paid (in cents) — immutable historical record
    amountPaid: integer('amount_paid').notNull().default(0),
    // Checkout answers (JSON: { questionId: answer })
    checkoutAnswers: json('checkout_answers').$type<Record<string, string>>(),
    // Note to seller
    note: text('note'),
    // Order status
    status: text('status').notNull().default('completed'),
    // Delivery token for secure access
    deliveryToken: text('delivery_token').notNull().unique(),
    // Email tracking
    emailSent: boolean('email_sent').notNull().default(false),
    emailSentAt: timestamp('email_sent_at'),
    // Groups orders created from one unified checkout/payment intent
    checkoutGroupId: text('checkout_group_id'),
    // Idempotency key to prevent duplicate orders
    idempotencyKey: text('idempotency_key').unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('order_creator_id_idx').on(table.creatorId),
    index('order_product_id_idx').on(table.productId),
    index('order_buyer_email_idx').on(table.buyerEmail),
    index('order_delivery_token_idx').on(table.deliveryToken),
    index('order_status_idx').on(table.status),
    index('order_checkout_group_id_idx').on(table.checkoutGroupId),
  ],
)

/**
 * Order items table — line items that belong to a single order.
 *
 * This enables unified multi-product checkout while keeping order-level
 * snapshots for backward compatibility with legacy single-product records.
 */
export const orderItems = pgTable(
  'order_item',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    creatorId: text('creator_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    productId: text('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    productTitle: text('product_title').notNull(),
    productPrice: integer('product_price').notNull(),
    productImage: text('product_image'),
    quantity: integer('quantity').notNull().default(1),
    amountPaid: integer('amount_paid').notNull().default(0),
    // Checkout answers for this specific product item
    checkoutAnswers: json('checkout_answers').$type<Record<string, string>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('order_item_order_id_idx').on(table.orderId),
    index('order_item_creator_id_idx').on(table.creatorId),
    index('order_item_product_id_idx').on(table.productId),
  ],
)

/**
 * Transactions table — append-only financial ledger.
 *
 * This is the SINGLE SOURCE OF TRUTH for all money movement.
 *
 * RULES:
 * - NEVER update or delete rows (append-only)
 * - Positive amounts = money IN (sale)
 * - Negative amounts = money OUT (payout, fee)
 * - Creator balance = SUM(amount) WHERE creatorId = X
 * - Available balance = SUM(amount) WHERE creatorId = X AND availableAt <= NOW()
 *
 * ANTI-PATTERNS TO AVOID:
 * - Do NOT use mutable counters as source of truth
 * - Do NOT cascade delete financial records
 * - Do NOT modify existing transaction rows
 */
export const transactions = pgTable(
  'transaction',
  {
    id: text('id').primaryKey(),
    // Creator this transaction belongs to
    creatorId: text('creator_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    // Related order (nullable — payouts don't have an order)
    orderId: text('order_id').references(() => orders.id, {
      onDelete: 'set null',
    }),
    // Related payout (set when this is a payout debit)
    payoutId: text('payout_id').references(() => payouts.id, {
      onDelete: 'restrict',
    }),
    // Transaction type
    type: text('type').notNull(), // sale | payout | fee | adjustment
    // Amount in cents (positive = credit, negative = debit)
    amount: integer('amount').notNull(),
    // Net amount after platform fee (if applicable)
    netAmount: integer('net_amount').notNull(),
    // Platform fee percentage at time of transaction
    platformFeePercent: integer('platform_fee_percent').notNull().default(0),
    platformFeeAmount: integer('platform_fee_amount').notNull().default(0),
    // Description for audit trail
    description: text('description').notNull(),
    // Metadata (extensible JSON for extra context)
    metadata: json('metadata').$type<Record<string, any>>(),
    // When funds become available for payout (hold period)
    availableAt: timestamp('available_at').notNull().defaultNow(),
    // Immutable timestamp — do NOT use $onUpdate
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('transaction_creator_id_idx').on(table.creatorId),
    index('transaction_order_id_idx').on(table.orderId),
    index('transaction_type_idx').on(table.type),
    index('transaction_available_at_idx').on(table.availableAt),
    index('transaction_created_at_idx').on(table.createdAt),
  ],
)

/**
 * Payouts table — tracks creator withdrawal requests.
 *
 * Flow: creator requests payout → system aggregates available balance →
 * creates payout record + debit transaction → processes payment
 */
export const payouts = pgTable(
  'payout',
  {
    id: text('id').primaryKey(),
    creatorId: text('creator_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    // Amount to be paid out (positive, in cents)
    amount: integer('amount').notNull(),
    // Payout status
    status: text('status').notNull().default('pending'), // pending | processing | completed | failed | cancelled
    // Period covered by this payout
    periodStart: timestamp('period_start'),
    periodEnd: timestamp('period_end'),
    // Payout method & details (future: bank, paypal, etc.)
    payoutMethod: text('payout_method'),
    payoutDetails: json('payout_details').$type<Record<string, any>>(),
    // Processing info
    processedAt: timestamp('processed_at'),
    failureReason: text('failure_reason'),
    // Admin notes
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('payout_creator_id_idx').on(table.creatorId),
    index('payout_status_idx').on(table.status),
    index('payout_created_at_idx').on(table.createdAt),
    uniqueIndex('payout_one_pending_per_creator_idx')
      .on(table.creatorId)
      .where(sql`${table.status} = 'pending'`),
  ],
)

// ─── Analytics Tracking Tables ───────────────────────────────────────────────

export const profileViews = pgTable(
  'profile_view',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('profile_view_user_id_idx').on(table.userId),
    index('profile_view_created_at_idx').on(table.createdAt),
  ],
)

export const blockClicks = pgTable(
  'block_click',
  {
    id: text('id').primaryKey(),
    blockId: text('block_id')
      .notNull()
      .references(() => blocks.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('block_click_block_id_idx').on(table.blockId),
    index('block_click_user_id_idx').on(table.userId),
    index('block_click_created_at_idx').on(table.createdAt),
  ],
)

// ─── Relations ───────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  blocks: many(blocks),
  products: many(products),
  socialLinks: many(socialLinks),
  orders: many(orders, { relationName: 'creatorOrders' }),
  orderItems: many(orderItems),
  transactions: many(transactions),
  payouts: many(payouts),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const blocksRelations = relations(blocks, ({ one }) => ({
  user: one(user, {
    fields: [blocks.userId],
    references: [user.id],
  }),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(user, {
    fields: [products.userId],
    references: [user.id],
  }),
  orders: many(orders),
  orderItems: many(orderItems),
}))

export const socialLinksRelations = relations(socialLinks, ({ one }) => ({
  user: one(user, {
    fields: [socialLinks.userId],
    references: [user.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  creator: one(user, {
    fields: [orders.creatorId],
    references: [user.id],
    relationName: 'creatorOrders',
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  transactions: many(transactions),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  creator: one(user, {
    fields: [orderItems.creatorId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  creator: one(user, {
    fields: [transactions.creatorId],
    references: [user.id],
  }),
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
  payout: one(payouts, {
    fields: [transactions.payoutId],
    references: [payouts.id],
  }),
}))

export const payoutsRelations = relations(payouts, ({ one, many }) => ({
  creator: one(user, {
    fields: [payouts.creatorId],
    references: [user.id],
  }),
  transactions: many(transactions),
}))

export const profileViewsRelations = relations(profileViews, ({ one }) => ({
  user: one(user, {
    fields: [profileViews.userId],
    references: [user.id],
  }),
}))

export const blockClicksRelations = relations(blockClicks, ({ one }) => ({
  block: one(blocks, {
    fields: [blockClicks.blockId],
    references: [blocks.id],
  }),
  user: one(user, {
    fields: [blockClicks.userId],
    references: [user.id],
  }),
}))
