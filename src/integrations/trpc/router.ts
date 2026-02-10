import { z } from 'zod'
import { and, asc, desc, eq, gte, inArray, lte, sql, isNull } from 'drizzle-orm'
import { createTRPCRouter, publicProcedure } from './init'
import type { TRPCRouterRecord } from '@trpc/server'
import { db } from '@/db'
import {
  blockClicks,
  blocks,
  orders,
  payouts,
  products,
  profileViews,
  socialLinks,
  transactions,
  user,
  TRANSACTION_TYPE,
  PAYOUT_STATUS,
} from '@/db/schema'
import { StorageService } from '@/lib/storage'
import { sendOrderEmail } from '@/lib/email'
import { BASE_URL } from '@/lib/constans'

// ─── Hold period for funds (in days) ─────────────────────────────────────────
const HOLD_PERIOD_DAYS = 7
const PLATFORM_FEE_PERCENT = 5 // 5% fee

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

function getTransactionNetAmount(txn: {
  amount: number
  platformFeeAmount: number
}): number {
  return txn.amount - txn.platformFeeAmount
}

// ─── User Router ─────────────────────────────────────────────────────────────

const userRouter = {
  getByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const foundUser = await db.query.user.findFirst({
        where: eq(user.email, input.email),
      })
      return foundUser ?? null
    }),
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const foundUser = await db.query.user.findFirst({
        where: eq(user.username, input.username),
      })
      return foundUser ?? null
    }),
  setUsername: publicProcedure
    .input(z.object({ userId: z.string(), username: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await db.query.user.findFirst({
        where: eq(user.username, input.username),
      })

      if (existing && existing.id !== input.userId) {
        throw new Error('Username is already taken')
      }

      const [updatedUser] = await db
        .update(user)
        .set({ username: input.username })
        .where(eq(user.id, input.userId))
        .returning()

      return updatedUser
    }),
  getDashboard: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const userProfile = await db.query.user.findFirst({
        where: eq(user.username, input.username),
        with: {
          blocks: {
            where: eq(blocks.isEnabled, true),
            orderBy: [asc(blocks.order)],
          },
          products: {
            where: and(
              eq(products.isActive, true),
              eq(products.isDeleted, false),
            ),
            orderBy: [desc(products.createdAt)],
          },
          socialLinks: {
            where: eq(socialLinks.isEnabled, true),
            orderBy: [asc(socialLinks.order)],
          },
        },
      })

      return userProfile ?? null
    }),
  trackView: publicProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input }) => {
      const existingUser = await db.query.user.findFirst({
        where: eq(user.username, input.username),
        columns: { id: true },
      })

      if (!existingUser) return { success: false }

      // Insert into profileViews table for period-based tracking
      await db.insert(profileViews).values({
        id: crypto.randomUUID(),
        userId: existingUser.id,
      })

      // Also update legacy counter for backwards compatibility
      await db
        .update(user)
        .set({ totalViews: sql`${user.totalViews} + 1` })
        .where(eq(user.id, existingUser.id))

      return { success: true }
    }),
  updateProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        title: z.string().optional(),
        bio: z.string().optional(),
        image: z.string().nullable().optional(),
        appearanceBgType: z.enum(['banner', 'wallpaper']).optional(),
        appearanceBgWallpaperStyle: z
          .enum(['flat', 'gradient', 'avatar', 'image'])
          .optional(),
        appearanceBgColor: z.string().nullable().optional(),
        appearanceBgImageUrl: z.string().nullable().optional(),
        appearanceWallpaperImageUrl: z.string().nullable().optional(),
        appearanceWallpaperColor: z.string().nullable().optional(),
        appearanceWallpaperGradientTop: z.string().nullable().optional(),
        appearanceWallpaperGradientBottom: z.string().nullable().optional(),
        appearanceBlockStyle: z.enum(['basic', 'flat', 'shadow']).optional(),
        appearanceBlockRadius: z.enum(['rounded', 'square']).optional(),
        appearanceBlockColor: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updatedUser] = await db
        .update(user)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.title !== undefined ? { title: input.title || null } : {}),
          ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
          ...(input.image !== undefined ? { image: input.image } : {}),
          ...(input.appearanceBgType
            ? { appearanceBgType: input.appearanceBgType }
            : {}),
          ...(input.appearanceBgWallpaperStyle !== undefined
            ? { appearanceBgWallpaperStyle: input.appearanceBgWallpaperStyle }
            : {}),
          ...(input.appearanceBgColor !== undefined
            ? { appearanceBgColor: input.appearanceBgColor }
            : {}),
          ...(input.appearanceBgImageUrl !== undefined
            ? { appearanceBgImageUrl: input.appearanceBgImageUrl }
            : {}),
          ...(input.appearanceWallpaperImageUrl !== undefined
            ? { appearanceWallpaperImageUrl: input.appearanceWallpaperImageUrl }
            : {}),
          ...(input.appearanceWallpaperColor !== undefined
            ? { appearanceWallpaperColor: input.appearanceWallpaperColor }
            : {}),
          ...(input.appearanceWallpaperGradientTop !== undefined
            ? {
                appearanceWallpaperGradientTop:
                  input.appearanceWallpaperGradientTop,
              }
            : {}),
          ...(input.appearanceWallpaperGradientBottom !== undefined
            ? {
                appearanceWallpaperGradientBottom:
                  input.appearanceWallpaperGradientBottom,
              }
            : {}),
          ...(input.appearanceBlockStyle
            ? { appearanceBlockStyle: input.appearanceBlockStyle }
            : {}),
          ...(input.appearanceBlockRadius
            ? { appearanceBlockRadius: input.appearanceBlockRadius }
            : {}),
          ...(input.appearanceBlockColor !== undefined
            ? { appearanceBlockColor: input.appearanceBlockColor }
            : {}),
        })
        .where(eq(user.id, input.userId))
        .returning()
      return updatedUser
    }),
} satisfies TRPCRouterRecord

// ─── Block Router ────────────────────────────────────────────────────────────

const blockRouter = {
  trackClick: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Get block to find the userId
      const block = await db.query.blocks.findFirst({
        where: eq(blocks.id, input.id),
        columns: { id: true, userId: true },
      })

      if (!block) return { success: false }

      // Insert into blockClicks table for period-based tracking
      await db.insert(blockClicks).values({
        id: crypto.randomUUID(),
        blockId: input.id,
        userId: block.userId,
      })

      // Also update legacy counter for backwards compatibility
      await db
        .update(blocks)
        .set({ clicks: sql`${blocks.clicks} + 1` })
        .where(eq(blocks.id, input.id))

      return { success: true }
    }),
  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string().default(''),
        url: z.string().default('').optional(), // Optional URL
        type: z.string().default('link'),
        content: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Get max order
      const userBlocks = await db.query.blocks.findMany({
        where: eq(blocks.userId, input.userId),
        orderBy: [asc(blocks.order)],
      })
      const maxOrder = userBlocks[userBlocks.length - 1]?.order ?? 0

      const [newBlock] = await db
        .insert(blocks)
        .values({
          id: crypto.randomUUID(),
          userId: input.userId,
          title: input.title,
          url: input.url ?? null,
          type: input.type,
          content: input.content ?? null,
          order: maxOrder + 1,
          isEnabled: true,
        })
        .returning()
      return newBlock
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        url: z.string().optional(),
        type: z.string().optional(),
        content: z.string().optional(),
        isEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updatedBlock] = await db
        .update(blocks)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.url !== undefined ? { url: input.url } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.content !== undefined ? { content: input.content } : {}),
          ...(input.isEnabled !== undefined
            ? { isEnabled: input.isEnabled }
            : {}),
        })
        .where(eq(blocks.id, input.id))
        .returning()
      return updatedBlock
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(blocks).where(eq(blocks.id, input.id))
      return { success: true }
    }),
  reorder: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      console.log('TRPC: Reordering blocks', input.items.length, 'items')
      // neon-http driver does not support transactions, so we run these in parallel
      await Promise.all(
        input.items.map((item) =>
          db
            .update(blocks)
            .set({ order: item.order })
            .where(eq(blocks.id, item.id)),
        ),
      )
      return { success: true }
    }),
} satisfies TRPCRouterRecord

// ─── Product Router ──────────────────────────────────────────────────────────

const priceSettingsSchema = z
  .object({
    payWhatYouWant: z.boolean(),
    price: z.number().int().nonnegative().optional(),
    salePrice: z.number().int().nonnegative().optional(),
    minimumPrice: z.number().int().nonnegative().optional(),
    suggestedPrice: z.number().int().nonnegative().optional(),
  })
  .refine(
    (val) => {
      if (val.payWhatYouWant) {
        return (
          val.minimumPrice !== undefined || val.suggestedPrice !== undefined
        )
      }
      return val.price !== undefined
    },
    {
      message:
        'For pay-what-you-want products provide at least a minimum or suggested price; otherwise provide a fixed price.',
    },
  )

const customerQuestionSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  required: z.boolean().default(false),
})

const productBaseInput = z.object({
  userId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  productUrl: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
  productFiles: z.array(z.any()).optional(), // JSON content
  isActive: z.boolean().optional(),
  totalQuantity: z.number().int().positive().optional(),
  limitPerCheckout: z.number().int().positive().optional(),
  priceSettings: priceSettingsSchema,
  customerQuestions: z.array(customerQuestionSchema).optional(),
})

// Reusable input schemas & types for frontend and backend
export const priceSettingsInputSchema = priceSettingsSchema
export const customerQuestionInputSchema = customerQuestionSchema
export const productInputSchema = productBaseInput

export type PriceSettingsInput = z.infer<typeof priceSettingsInputSchema>
export type CustomerQuestionInput = z.infer<typeof customerQuestionInputSchema>
export type ProductInput = z.infer<typeof productInputSchema>

const productRouter = {
  listByUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const rows = await db.query.products.findMany({
        where: and(
          eq(products.userId, input.userId),
          eq(products.isDeleted, false),
        ),
        orderBy: [desc(products.createdAt)],
      })

      // Fetch net revenue from transactions (ledger)
      const stats = await db
        .select({
          productId: orders.productId,
          netRevenue: sql<number>`sum(${transactions.netAmount})`,
        })
        .from(transactions)
        .leftJoin(orders, eq(transactions.orderId, orders.id))
        .where(
          and(
            eq(transactions.creatorId, input.userId),
            eq(transactions.type, TRANSACTION_TYPE.SALE),
          ),
        )
        .groupBy(orders.productId)

      const revenueMap = new Map(stats.map((s) => [s.productId, s.netRevenue]))

      return rows.map((product) => ({
        ...product,
        totalRevenue: revenueMap.get(product.id) ?? 0,
      }))
    }),
  create: publicProcedure
    .input(productBaseInput)
    .mutation(async ({ input }) => {
      const id = crypto.randomUUID()
      const price = input.priceSettings.payWhatYouWant
        ? null
        : (input.priceSettings.price ?? null)
      const salePrice = input.priceSettings.payWhatYouWant
        ? null
        : (input.priceSettings.salePrice ?? null)

      const [row] = await db
        .insert(products)
        .values({
          id,
          userId: input.userId,
          title: input.title,
          description: input.description ?? null,
          productUrl: input.productUrl || null,
          images: input.images || null,
          productFiles: input.productFiles || null,
          isActive: input.isActive ?? true,
          totalQuantity: input.totalQuantity ?? null,
          limitPerCheckout: input.limitPerCheckout ?? null,
          payWhatYouWant: input.priceSettings.payWhatYouWant,
          price,
          salePrice,
          minimumPrice: input.priceSettings.minimumPrice ?? null,
          suggestedPrice: input.priceSettings.suggestedPrice ?? null,
          customerQuestions: input.customerQuestions
            ? JSON.stringify(input.customerQuestions)
            : null,
        })
        .returning()

      return row
    }),
  update: publicProcedure
    .input(
      productBaseInput.extend({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const price = input.priceSettings.payWhatYouWant
        ? null
        : (input.priceSettings.price ?? null)
      const salePrice = input.priceSettings.payWhatYouWant
        ? null
        : (input.priceSettings.salePrice ?? null)

      const [row] = await db
        .update(products)
        .set({
          title: input.title,
          description: input.description ?? null,
          productUrl: input.productUrl || null,
          images: input.images || null,
          productFiles: input.productFiles || null,
          isActive: input.isActive ?? true,
          totalQuantity: input.totalQuantity ?? null,
          limitPerCheckout: input.limitPerCheckout ?? null,
          payWhatYouWant: input.priceSettings.payWhatYouWant,
          price,
          salePrice,
          minimumPrice: input.priceSettings.minimumPrice ?? null,
          suggestedPrice: input.priceSettings.suggestedPrice ?? null,
          customerQuestions: input.customerQuestions
            ? JSON.stringify(input.customerQuestions)
            : null,
        })
        .where(eq(products.id, input.id))
        .returning()

      return row
    }),
  duplicate: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const product = await db.query.products.findFirst({
        where: eq(products.id, input.id),
      })

      if (!product) {
        throw new Error('Product not found')
      }

      const newId = crypto.randomUUID()
      const [newProduct] = await db
        .insert(products)
        .values({
          id: newId,
          userId: product.userId,
          title: `${product.title} (Copy)`,
          description: product.description,
          payWhatYouWant: product.payWhatYouWant,
          price: product.price,
          salePrice: product.salePrice,
          minimumPrice: product.minimumPrice,
          suggestedPrice: product.suggestedPrice,
          totalQuantity: product.totalQuantity,
          limitPerCheckout: product.limitPerCheckout,
          productUrl: product.productUrl,
          productFiles: product.productFiles,
          images: product.images,
          customerQuestions: product.customerQuestions,
          isActive: false, // Default to inactive
          salesCount: 0,
          totalRevenue: 0,
        })
        .returning()

      return newProduct
    }),

  /**
   * SOFT DELETE — sets isDeleted = true, preserving historical data.
   * Orders, transactions, and payouts referencing this product remain intact.
   */
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(products)
        .set({ isDeleted: true, isActive: false })
        .where(eq(products.id, input.id))
      return { success: true }
    }),

  toggleActive: publicProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(products)
        .set({ isActive: input.isActive })
        .where(eq(products.id, input.id))
        .returning()
      return row
    }),
} satisfies TRPCRouterRecord

// ─── Social Link Router ──────────────────────────────────────────────────────

const socialLinkRouter = {
  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        platform: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const userSocialLinks = await db.query.socialLinks.findMany({
        where: eq(socialLinks.userId, input.userId),
        orderBy: [asc(socialLinks.order)],
      })
      const maxOrder = userSocialLinks[userSocialLinks.length - 1]?.order ?? 0

      const [newSocialLink] = await db
        .insert(socialLinks)
        .values({
          id: crypto.randomUUID(),
          userId: input.userId,
          platform: input.platform,
          url: input.url,
          order: maxOrder + 1,
          isEnabled: true,
        })
        .returning()
      return newSocialLink
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        platform: z.string().optional(),
        url: z.string().optional(),
        isEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updatedSocialLink] = await db
        .update(socialLinks)
        .set({
          ...(input.platform !== undefined ? { platform: input.platform } : {}),
          ...(input.url !== undefined ? { url: input.url } : {}),
          ...(input.isEnabled !== undefined
            ? { isEnabled: input.isEnabled }
            : {}),
        })
        .where(eq(socialLinks.id, input.id))
        .returning()
      return updatedSocialLink
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(socialLinks).where(eq(socialLinks.id, input.id))
      return { success: true }
    }),
  reorder: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      await Promise.all(
        input.items.map((item) =>
          db
            .update(socialLinks)
            .set({ order: item.order })
            .where(eq(socialLinks.id, item.id)),
        ),
      )
      return { success: true }
    }),
} satisfies TRPCRouterRecord

// ─── Storage Router ──────────────────────────────────────────────────────────

export const storageRouter = {
  getUploadUrl: publicProcedure
    .input(z.object({ key: z.string(), contentType: z.string() }))
    .mutation(async ({ input }) => {
      return await StorageService.getUploadUrl(input.key, input.contentType)
    }),
} satisfies TRPCRouterRecord

// ─── Order Router ────────────────────────────────────────────────────────────

const orderRouter = {
  /**
   * Single product checkout.
   *
   * Flow: validate product → snapshot product data → create order →
   *       create SALE transaction → update cached counters → send email
   */
  create: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        buyerEmail: z.string().email(),
        buyerName: z.string().optional(),
        amountPaid: z.number().int().nonnegative(),
        answers: z.any().optional(),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // 1. Get product and creator
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.id, input.productId),
          eq(products.isDeleted, false),
        ),
        with: {
          user: true, // creator
        },
      })

      if (!product) {
        throw new Error('Product not found')
      }

      if (!product.isActive) {
        throw new Error('Product is not active')
      }

      // Check quantity limits
      if (
        product.totalQuantity !== null &&
        product.totalQuantity !== undefined &&
        product.totalQuantity <= 0
      ) {
        throw new Error('Product sold out')
      }

      const creator = product.user

      // 2. Snapshot product data at checkout
      const productImage = product.images?.[0] ?? null
      const effectivePrice = product.payWhatYouWant
        ? input.amountPaid
        : product.salePrice &&
            product.price &&
            product.salePrice < product.price
          ? product.salePrice
          : (product.price ?? 0)

      // 3. Create Order with snapshot
      const deliveryToken = crypto.randomUUID()
      const orderId = crypto.randomUUID()

      const [newOrder] = await db
        .insert(orders)
        .values({
          id: orderId,
          creatorId: creator.id,
          productId: product.id,
          // Snapshot fields
          productTitle: product.title,
          productPrice: effectivePrice,
          productImage,
          // Buyer info
          buyerEmail: input.buyerEmail,
          buyerName: input.buyerName ?? '',
          amountPaid: input.amountPaid,
          checkoutAnswers: input.answers ?? {},
          note: input.note ?? null,
          status: 'completed',
          deliveryToken,
          emailSent: false,
        })
        .returning()

      // 4. Create SALE transaction (append-only ledger entry)
      const { feeAmount, netAmount } = calculateFee(input.amountPaid)
      const txnId = crypto.randomUUID()

      await db.insert(transactions).values({
        id: txnId,
        creatorId: creator.id,
        orderId: orderId,
        type: TRANSACTION_TYPE.SALE,
        amount: input.amountPaid,
        netAmount,
        platformFeePercent: PLATFORM_FEE_PERCENT,
        platformFeeAmount: feeAmount,
        description: `Sale: ${product.title}`,
        availableAt: getAvailableAt(),
        metadata: {
          productId: product.id,
          buyerEmail: input.buyerEmail,
        },
      })

      // 5. Update cached analytics counters (denormalized, not source of truth)
      await db
        .update(products)
        .set({
          salesCount: sql`${products.salesCount} + 1`,
          totalRevenue: sql`${products.totalRevenue} + ${input.amountPaid}`,
        })
        .where(eq(products.id, product.id))

      await db
        .update(user)
        .set({
          totalSalesCount: sql`${user.totalSalesCount} + 1`,
          totalRevenue: sql`${user.totalRevenue} + ${input.amountPaid}`,
        })
        .where(eq(user.id, creator.id))

      // 6. Send Email
      const deliveryUrl = `${BASE_URL}/d/${deliveryToken}`
      const emailResult = await sendOrderEmail({
        to: input.buyerEmail,
        deliveryUrl,
        order: newOrder,
        product,
        creator,
      })

      if (emailResult.success) {
        await db
          .update(orders)
          .set({ emailSent: true, emailSentAt: new Date() })
          .where(eq(orders.id, newOrder.id))
      } else {
        console.error(
          'Email failed to send for order:',
          newOrder.id,
          emailResult.error,
        )
      }

      return {
        ...newOrder,
        deliveryUrl,
      }
    }),

  /**
   * Multi-product cart checkout.
   * Creates one order + one SALE transaction per product in the cart.
   */
  createMultiple: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1).default(1),
            amountPaidPerUnit: z.number().min(0),
          }),
        ),
        buyerEmail: z.string().email(),
        buyerName: z.string().optional(),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.items.length === 0) {
        throw new Error('No items in cart')
      }

      const productIds = input.items.map((i) => i.productId)
      const productsList = await db.query.products.findMany({
        where: and(
          inArray(products.id, productIds),
          eq(products.isDeleted, false),
        ),
        with: { user: true },
      })

      const productMap = new Map(productsList.map((p) => [p.id, p]))
      const ordersCreated: any[] = []

      for (const item of input.items) {
        const product = productMap.get(item.productId)
        if (!product) continue
        if (!product.isActive) continue

        // Check quantity limits
        if (
          product.totalQuantity !== null &&
          product.totalQuantity !== undefined &&
          product.totalQuantity < item.quantity
        ) {
          throw new Error(
            `Product ${product.title} sold out or not enough stock`,
          )
        }

        const creator = product.user
        const totalAmount = item.amountPaidPerUnit * item.quantity

        // Snapshot product data
        const productImage = product.images?.[0] ?? null
        const effectivePrice = product.payWhatYouWant
          ? item.amountPaidPerUnit
          : product.salePrice &&
              product.price &&
              product.salePrice < product.price
            ? product.salePrice
            : (product.price ?? 0)

        const deliveryToken = crypto.randomUUID()
        const orderId = crypto.randomUUID()

        const [newOrder] = await db
          .insert(orders)
          .values({
            id: orderId,
            creatorId: creator.id,
            productId: product.id,
            // Snapshot fields
            productTitle: product.title,
            productPrice: effectivePrice,
            productImage,
            // Buyer info
            buyerEmail: input.buyerEmail,
            buyerName: input.buyerName ?? '',
            amountPaid: totalAmount,
            quantity: item.quantity,
            checkoutAnswers: {},
            note: input.note ?? null,
            status: 'completed',
            deliveryToken,
            emailSent: false,
          })
          .returning()

        // Create SALE transaction
        const { feeAmount, netAmount } = calculateFee(totalAmount)
        await db.insert(transactions).values({
          id: crypto.randomUUID(),
          creatorId: creator.id,
          orderId: orderId,
          type: TRANSACTION_TYPE.SALE,
          amount: totalAmount,
          netAmount,
          platformFeePercent: PLATFORM_FEE_PERCENT,
          platformFeeAmount: feeAmount,
          description: `Sale: ${product.title} x${item.quantity}`,
          availableAt: getAvailableAt(),
          metadata: {
            productId: product.id,
            buyerEmail: input.buyerEmail,
            quantity: item.quantity,
          },
        })

        // Update cached counters
        await db
          .update(products)
          .set({
            salesCount: sql`${products.salesCount} + ${item.quantity}`,
            totalRevenue: sql`${products.totalRevenue} + ${totalAmount}`,
          })
          .where(eq(products.id, product.id))

        await db
          .update(user)
          .set({
            totalSalesCount: sql`${user.totalSalesCount} + ${item.quantity}`,
            totalRevenue: sql`${user.totalRevenue} + ${totalAmount}`,
          })
          .where(eq(user.id, creator.id))

        // Send email
        const deliveryUrl = `${BASE_URL}/d/${deliveryToken}`
        const emailResult = await sendOrderEmail({
          to: input.buyerEmail,
          deliveryUrl,
          order: newOrder,
          product,
          creator,
        })

        if (emailResult.success) {
          await db
            .update(orders)
            .set({ emailSent: true, emailSentAt: new Date() })
            .where(eq(orders.id, newOrder.id))
        }

        ordersCreated.push({
          ...newOrder,
          deliveryUrl,
          productTitle: product.title,
        })
      }

      return ordersCreated
    }),

  listByCreator: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const rows = await db.query.orders.findMany({
        where: eq(orders.creatorId, input.userId),
        with: {
          product: true, // may be null if product was hard-deleted
          transactions: true,
        },
        orderBy: [desc(orders.createdAt)],
      })
      return rows
    }),

  resendEmail: publicProcedure
    .input(z.object({ orderId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: {
          product: true,
          creator: true,
        },
      })

      if (!order) throw new Error('Order not found')
      if (order.creatorId !== input.userId) throw new Error('Unauthorized')

      const deliveryUrl = `${BASE_URL}/d/${order.deliveryToken}`

      // Use snapshot data for email, fallback to product relation if available
      const emailProduct = order.product ?? {
        title: order.productTitle,
        images: order.productImage ? [order.productImage] : [],
      }

      const emailCreator = order.creator ?? {
        name: 'Creator',
        email: '',
      }

      const emailResult = await sendOrderEmail({
        to: order.buyerEmail,
        deliveryUrl,
        order,
        product: emailProduct,
        creator: emailCreator,
      })

      if (emailResult.success) {
        await db
          .update(orders)
          .set({ emailSent: true, emailSentAt: new Date() })
          .where(eq(orders.id, order.id))
        return { success: true }
      } else {
        throw new Error('Failed to send email')
      }
    }),
} satisfies TRPCRouterRecord

// ─── Transaction / Balance Router ────────────────────────────────────────────

const balanceRouter = {
  /**
   * Get creator's financial summary.
   * Balance is computed from the transactions ledger (single source of truth).
   */
  getSummary: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const now = new Date()

      // Total balance (all transactions)
      const allTxns = await db.query.transactions.findMany({
        where: eq(transactions.creatorId, input.userId),
        columns: {
          amount: true,
          platformFeeAmount: true,
          type: true,
          availableAt: true,
        },
      })

      let totalEarnings = 0
      let totalPayouts = 0
      let totalFees = 0
      let availableBalance = 0
      let pendingBalance = 0

      for (const txn of allTxns) {
        const netAmount = getTransactionNetAmount(txn)

        if (txn.type === TRANSACTION_TYPE.SALE) {
          totalEarnings += netAmount
        } else if (txn.type === TRANSACTION_TYPE.PAYOUT) {
          totalPayouts += Math.abs(netAmount)
        } else if (txn.type === TRANSACTION_TYPE.FEE) {
          totalFees += Math.abs(netAmount)
        }

        // Compute available vs pending balance from ledger + availableAt only.
        if (txn.availableAt <= now) {
          availableBalance += netAmount
        } else {
          pendingBalance += netAmount
        }
      }

      const currentBalance = availableBalance + pendingBalance

      return {
        totalEarnings,
        totalPayouts,
        totalFees,
        currentBalance,
        availableBalance,
        pendingBalance,
        holdPeriodDays: HOLD_PERIOD_DAYS,
      }
    }),

  /**
   * Get transaction history for a creator.
   */
  getTransactions: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
        type: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const conditions = [eq(transactions.creatorId, input.userId)]
      if (input.type) {
        conditions.push(eq(transactions.type, input.type))
      }

      const rows = await db.query.transactions.findMany({
        where: and(...conditions),
        with: {
          order: {
            columns: {
              id: true,
              buyerEmail: true,
              buyerName: true,
              productTitle: true,
            },
          },
        },
        orderBy: [desc(transactions.createdAt)],
        limit: input.limit,
        offset: input.offset,
      })

      return rows
    }),
} satisfies TRPCRouterRecord

// ─── Payout Router ───────────────────────────────────────────────────────────

const payoutRouter = {
  /**
   * Request a payout of available balance.
   * Creates a payout record + debit transaction.
   */
  request: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        amount: z.number().int().positive().optional(), // if not specified, payout all available
        payoutMethod: z.string().optional(),
        payoutDetails: z.any().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const now = new Date()

      try {
        const result = await db.transaction(async (tx) => {
          // Calculate available balance using drizzle's query builder
          const availableResult = await tx
            .select({
              availableBalance: sql<number>`COALESCE(SUM(${transactions.amount} - ${transactions.platformFeeAmount}), 0)`,
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.creatorId, input.userId),
                lte(transactions.availableAt, now),
              ),
            )

          const availableBalance = Number(
            availableResult[0]?.availableBalance ?? 0,
          )
          const payoutAmount = input.amount ?? availableBalance

          if (payoutAmount <= 0) {
            throw new Error('No available balance for payout')
          }
          if (payoutAmount > availableBalance) {
            throw new Error(
              `Requested ${payoutAmount} but only ${availableBalance} available`,
            )
          }

          const payoutId = crypto.randomUUID()

          // Insert payout record
          const [payout] = await tx
            .insert(payouts)
            .values({
              id: payoutId,
              creatorId: input.userId,
              amount: payoutAmount,
              status: 'pending',
              periodEnd: now,
              payoutMethod: input.payoutMethod ?? null,
              payoutDetails: input.payoutDetails ?? null,
            })
            .returning()

          // Insert debit transaction
          await tx.insert(transactions).values({
            id: crypto.randomUUID(),
            creatorId: input.userId,
            payoutId: payoutId,
            type: TRANSACTION_TYPE.PAYOUT,
            amount: -payoutAmount,
            netAmount: -payoutAmount,
            platformFeePercent: 0,
            platformFeeAmount: 0,
            description: `Payout request #${payoutId.slice(0, 8)}`,
            metadata: { payoutId, payoutMethod: input.payoutMethod },
            availableAt: now,
          })

          return payout
        })

        return result
      } catch (error) {
        console.error('[finance][payout-request] transaction failed', {
          userId: input.userId,
          amount: input.amount,
          error,
        })

        const message =
          error instanceof Error ? error.message.toLowerCase() : ''
        if (message.includes('payout_one_pending_per_creator_idx')) {
          throw new Error('You already have a pending payout request')
        }

        throw new Error('Payout request failed. Please retry.')
      }
    }),

  /**
   * List all payouts for a creator.
   */
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const rows = await db.query.payouts.findMany({
        where: eq(payouts.creatorId, input.userId),
        orderBy: [desc(payouts.createdAt)],
      })
      return rows
    }),

  /**
   * Cancel a pending payout (reverses the debit transaction).
   */
  cancel: publicProcedure
    .input(z.object({ payoutId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const payout = await db.query.payouts.findFirst({
        where: eq(payouts.id, input.payoutId),
      })

      if (!payout) throw new Error('Payout not found')
      if (payout.creatorId !== input.userId) throw new Error('Unauthorized')
      if (payout.status !== 'pending') {
        throw new Error('Can only cancel pending payouts')
      }

      // Update payout status
      await db
        .update(payouts)
        .set({ status: 'cancelled' })
        .where(eq(payouts.id, payout.id))

      // Create reversal transaction (positive amount to restore balance)
      await db.insert(transactions).values({
        id: crypto.randomUUID(),
        creatorId: input.userId,
        payoutId: payout.id,
        type: TRANSACTION_TYPE.ADJUSTMENT,
        amount: payout.amount,
        netAmount: payout.amount,
        platformFeePercent: 0,
        platformFeeAmount: 0,
        description: `Payout cancelled: #${payout.id.slice(0, 8)}`,
        availableAt: new Date(),
        metadata: { cancelledPayoutId: payout.id },
      })

      return { success: true }
    }),
} satisfies TRPCRouterRecord

// ─── Analytics Router ────────────────────────────────────────────────────────

const analyticsRouter = {
  getOverview: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const fromDate = input.from
        ? new Date(`${input.from}T00:00:00.000Z`)
        : null
      const toDate = input.to ? new Date(`${input.to}T23:59:59.999Z`) : null

      const profile = await db.query.user.findFirst({
        where: eq(user.id, input.userId),
        columns: {
          totalRevenue: true,
          totalSalesCount: true,
          totalViews: true,
        },
      })

      const blockRows = await db.query.blocks.findMany({
        where: eq(blocks.userId, input.userId),
        columns: {
          id: true,
          title: true,
          type: true,
          clicks: true,
          isEnabled: true,
        },
        orderBy: [desc(blocks.clicks)],
      })

      // Transactions query for revenue calculation (replacing orders query)
      const txnConditions = [
        eq(transactions.creatorId, input.userId),
        eq(transactions.type, TRANSACTION_TYPE.SALE),
      ]
      if (fromDate) txnConditions.push(gte(transactions.createdAt, fromDate))
      if (toDate) txnConditions.push(lte(transactions.createdAt, toDate))

      const txnRows = await db.query.transactions.findMany({
        where: and(...txnConditions),
        columns: {
          netAmount: true,
          type: true,
          createdAt: true,
        },
        orderBy: [asc(transactions.createdAt)],
      })

      // Views query for period
      const viewsConditions = [eq(profileViews.userId, input.userId)]
      if (fromDate) viewsConditions.push(gte(profileViews.createdAt, fromDate))
      if (toDate) viewsConditions.push(lte(profileViews.createdAt, toDate))

      const viewRows = await db.query.profileViews.findMany({
        where: and(...viewsConditions),
        columns: { id: true, createdAt: true },
      })

      // Clicks query for period
      const clicksConditions = [eq(blockClicks.userId, input.userId)]
      if (fromDate) clicksConditions.push(gte(blockClicks.createdAt, fromDate))
      if (toDate) clicksConditions.push(lte(blockClicks.createdAt, toDate))

      const clickRows = await db.query.blockClicks.findMany({
        where: and(...clicksConditions),
        columns: { id: true, createdAt: true },
      })

      const byDay = new Map<
        string,
        {
          date: string
          sales: number
          revenue: number
          views: number
          clicks: number
        }
      >()

      let rangeRevenue = 0
      let rangeSales = 0

      for (const txn of txnRows) {
        const day = txn.createdAt.toISOString().slice(0, 10)
        const existing = byDay.get(day) ?? {
          date: day,
          sales: 0,
          revenue: 0,
          views: 0,
          clicks: 0,
        }

        if (txn.type === TRANSACTION_TYPE.SALE) {
          existing.sales += 1
          rangeSales += 1
        }

        // txn.netAmount is already net of fees for sale transactions
        existing.revenue += txn.netAmount
        rangeRevenue += txn.netAmount

        byDay.set(day, existing)
      }

      for (const view of viewRows) {
        const day = view.createdAt.toISOString().slice(0, 10)
        const existing = byDay.get(day) ?? {
          date: day,
          sales: 0,
          revenue: 0,
          views: 0,
          clicks: 0,
        }
        existing.views += 1
        byDay.set(day, existing)
      }

      for (const click of clickRows) {
        const day = click.createdAt.toISOString().slice(0, 10)
        const existing = byDay.get(day) ?? {
          date: day,
          sales: 0,
          revenue: 0,
          views: 0,
          clicks: 0,
        }
        existing.clicks += 1
        byDay.set(day, existing)
      }

      // Sort chart data by date
      const chart = Array.from(byDay.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      )

      const rangeViews = viewRows.length
      const rangeClicks = clickRows.length
      const totalBlocks = blockRows.length
      const totalClicks = blockRows.reduce((acc, row) => acc + row.clicks, 0)

      return {
        totals: {
          totalRevenue: profile?.totalRevenue ?? 0,
          totalSalesCount: profile?.totalSalesCount ?? 0,
          totalViews: profile?.totalViews ?? 0,
          totalBlocks,
          totalClicks,
          clicksPerBlock: totalBlocks > 0 ? totalClicks / totalBlocks : 0,
        },
        range: {
          revenue: rangeRevenue,
          sales: rangeSales,
          views: rangeViews,
          clicks: rangeClicks,
        },
        chart: Array.from(byDay.values()),
        blocks: blockRows,
      }
    }),

  // Get per-product analytics
  getProductAnalytics: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const productRows = await db.query.products.findMany({
        where: and(
          eq(products.userId, input.userId),
          eq(products.isDeleted, false),
        ),
        columns: {
          id: true,
          title: true,
          images: true,
          salesCount: true,
          totalRevenue: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: [desc(products.totalRevenue)],
      })

      // Fetch net revenue from transactions (ledger)
      const stats = await db
        .select({
          productId: orders.productId,
          netRevenue: sql<number>`sum(${transactions.netAmount})`,
        })
        .from(transactions)
        .leftJoin(orders, eq(transactions.orderId, orders.id))
        .where(
          and(
            eq(transactions.creatorId, input.userId),
            eq(transactions.type, TRANSACTION_TYPE.SALE),
          ),
        )
        .groupBy(orders.productId)

      const revenueMap = new Map(stats.map((s) => [s.productId, s.netRevenue]))

      return productRows.map((p) => ({
        id: p.id,
        title: p.title,
        image: p.images?.[0] ?? null,
        salesCount: p.salesCount,
        totalRevenue: revenueMap.get(p.id) ?? 0,
        isActive: p.isActive,
        createdAt: p.createdAt,
      }))
    }),
} satisfies TRPCRouterRecord

// ─── Main Router ─────────────────────────────────────────────────────────────

export const trpcRouter = createTRPCRouter({
  user: userRouter,
  block: blockRouter,
  product: productRouter,
  socialLink: socialLinkRouter,
  storage: storageRouter,
  order: orderRouter,
  balance: balanceRouter,
  payout: payoutRouter,
  analytics: analyticsRouter,
})
export type TRPCRouter = typeof trpcRouter
