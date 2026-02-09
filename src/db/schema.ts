import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// Order status enum values
export const ORDER_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  username: text('username').unique(),
  bio: text('bio'),
  title: text('title'),
  // Appearance settings
  //
  // Background:
  // - appearanceBgType:
  //   - 'banner'    => hero banner image + background color
  //   - 'wallpaper' => full-screen wallpaper (flat / gradient / avatar blur / image)
  // - appearanceBgWallpaperStyle (when type = 'wallpaper'):
  //   - 'flat' | 'gradient' | 'avatar' | 'image'
  // - appearanceBgColor: hex or CSS gradient
  // - appearanceBgImageUrl: image URL for banner or wallpaper
  appearanceBgType: text('appearance_bg_type').default('banner').notNull(),
  appearanceBgWallpaperStyle: text('appearance_bg_wallpaper_style'),
  appearanceBgColor: text('appearance_bg_color'),
  appearanceBgImageUrl: text('appearance_bg_image_url'), // Used for BANNER image
  appearanceWallpaperImageUrl: text('appearance_wallpaper_image_url'),
  appearanceWallpaperColor: text('appearance_wallpaper_color'), // For flat wallpaper
  appearanceWallpaperGradientTop: text('appearance_wallpaper_gradient_top'),
  appearanceWallpaperGradientBottom: text(
    'appearance_wallpaper_gradient_bottom',
  ),
  // Block styling:
  // - appearanceBlockStyle: 'basic' | 'flat' | 'shadow'
  // - appearanceBlockRadius: 'rounded' | 'square'
  appearanceBlockStyle: text('appearance_block_style')
    .default('basic')
    .notNull(),
  appearanceBlockRadius: text('appearance_block_radius')
    .default('rounded')
    .notNull(),
  appearanceBlockColor: text('appearance_block_color'),
  // Analytics fields
  totalRevenue: integer('total_revenue').notNull().default(0), // in cents
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
  // Analytics fields
  salesCount: integer('sales_count').notNull().default(0),
  totalRevenue: integer('total_revenue').notNull().default(0), // in cents
  // Visibility
  isActive: boolean('is_active').notNull().default(true),
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
  content: text('content'), // Storing as text for simplicity (JSON.stringify), or use jsonb if supported by neon-serverless easily but text is safer for now across drivers
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
  platform: text('platform').notNull(), // e.g., 'twitter', 'linkedin', 'email', 'instagram', 'github', etc.
  url: text('url').notNull(),
  order: integer('order').notNull().default(0),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Orders table for checkout management
export const orders = pgTable(
  'order',
  {
    id: text('id').primaryKey(),
    // Creator (seller) reference
    creatorId: text('creator_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Product reference
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    // Buyer information
    buyerEmail: text('buyer_email').notNull(),
    buyerName: text('buyer_name'),
    // Quantity of items purchased
    quantity: integer('quantity').notNull().default(1),
    // Amount paid (in cents) - stored for historical record
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
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  blocks: many(blocks),
  products: many(products),
  socialLinks: many(socialLinks),
  orders: many(orders, { relationName: 'creatorOrders' }),
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
}))

export const socialLinksRelations = relations(socialLinks, ({ one }) => ({
  user: one(user, {
    fields: [socialLinks.userId],
    references: [user.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one }) => ({
  creator: one(user, {
    fields: [orders.creatorId],
    references: [user.id],
    relationName: 'creatorOrders',
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
}))
