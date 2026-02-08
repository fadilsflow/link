import { z } from 'zod'
import { asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { createTRPCRouter, publicProcedure } from './init'
import type { TRPCRouterRecord } from '@trpc/server'
import { db } from '@/db'
import { blocks, orders, products, socialLinks, user } from '@/db/schema'
import { StorageService } from '@/lib/storage'
import { sendOrderEmail } from '@/lib/email'
import { BASE_URL } from '@/lib/constans'

const userRouter = {
  getByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const foundUser = await db.query.user.findFirst({
        where: eq(user.email, input.email),
      })
      return foundUser
    }),
  updateUsername: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        username: z
          .string()
          .min(3)
          .max(30)
          .regex(/^[a-zA-Z0-9_-]+$/),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if username already exists
      const existingUser = await db.query.user.findFirst({
        where: eq(user.username, input.username),
      })

      if (existingUser && existingUser.id !== input.userId) {
        throw new Error('Username sudah digunakan')
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
            orderBy: [asc(blocks.order)],
          },
          socialLinks: {
            orderBy: [asc(socialLinks.order)],
          },
        },
      })
      if (!userProfile) return null
      return {
        user: userProfile,
        blocks: userProfile.blocks,
        socialLinks: userProfile.socialLinks,
      }
    }),
  updateProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        title: z.string().optional(),
        bio: z.string().optional(),
        image: z.string().nullable().optional(),
        // Appearance settings
        // Keep backward compatibility with existing values ('color', 'image')
        // while allowing a future 'wallpaper' mode if needed.
        appearanceBgType: z
          .enum(['banner', 'color', 'image', 'wallpaper'])
          .optional(),
        appearanceBgWallpaperStyle: z
          .enum(['flat', 'gradient', 'avatar', 'image'])
          .optional(),
        appearanceBgColor: z.string().optional(),
        appearanceBgImageUrl: z.string().optional(),
        appearanceWallpaperImageUrl: z.string().optional(),
        appearanceWallpaperColor: z.string().optional(),
        appearanceWallpaperGradientTop: z.string().optional(),
        appearanceWallpaperGradientBottom: z.string().optional(),
        appearanceBlockStyle: z.enum(['basic', 'flat', 'shadow']).optional(),
        appearanceBlockRadius: z.enum(['rounded', 'square']).optional(),
        appearanceBlockColor: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updatedUser] = await db
        .update(user)
        .set({
          ...(input.name ? { name: input.name } : {}),
          ...(input.title ? { title: input.title } : {}),
          ...(input.bio ? { bio: input.bio } : {}),
          ...(input.image !== undefined ? { image: input.image } : {}),
          ...(input.appearanceBgType
            ? { appearanceBgType: input.appearanceBgType }
            : {}),
          ...(input.appearanceBgWallpaperStyle
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

const blockRouter = {
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
        where: eq(products.userId, input.userId),
        orderBy: [desc(products.createdAt)],
      })
      return rows
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
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(products).where(eq(products.id, input.id))
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
      // Get max order
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

export const storageRouter = {
  getUploadUrl: publicProcedure
    .input(z.object({ key: z.string(), contentType: z.string() }))
    .mutation(async ({ input }) => {
      return await StorageService.getUploadUrl(input.key, input.contentType)
    }),
} satisfies TRPCRouterRecord

const orderRouter = {
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
        where: eq(products.id, input.productId),
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

      // Check quantity limits if applicable (simple check)
      if (
        product.totalQuantity !== null &&
        product.totalQuantity !== undefined &&
        product.totalQuantity <= 0
      ) {
        throw new Error('Product sold out')
      }

      const creator = product.user

      // 2. Create Order
      const deliveryToken = crypto.randomUUID()
      const orderId = crypto.randomUUID()

      const [newOrder] = await db
        .insert(orders)
        .values({
          id: orderId,
          creatorId: creator.id,
          productId: product.id,
          buyerEmail: input.buyerEmail,
          buyerName: input.buyerName ?? '',
          amountPaid: input.amountPaid,
          checkoutAnswers: input.answers ?? {},
          note: input.note ?? null,
          status: 'completed', // No payment gateway yet, so auto-complete
          deliveryToken,
          emailSent: false,
        })
        .returning()

      // 3. Update analytics counters
      // Update product analytics (salesCount, totalRevenue)
      await db
        .update(products)
        .set({
          salesCount: sql`${products.salesCount} + 1`,
          totalRevenue: sql`${products.totalRevenue} + ${input.amountPaid}`,
        })
        .where(eq(products.id, product.id))

      // Update creator/profile analytics (totalSalesCount, totalRevenue)
      await db
        .update(user)
        .set({
          totalSalesCount: sql`${user.totalSalesCount} + 1`,
          totalRevenue: sql`${user.totalRevenue} + ${input.amountPaid}`,
        })
        .where(eq(user.id, creator.id))

      // 4. Send Email (async / fire and forget, but update status)
      // In a real message queue, this would be separate.
      // Here we await it to report status early, or we can background it.
      // For MVP, we'll await it to ensure it works.
      const deliveryUrl = `${BASE_URL}/d/${deliveryToken}`
      const emailResult = await sendOrderEmail({
        to: input.buyerEmail,
        buyerName: input.buyerName ?? '',
        creatorName: creator.name,
        creatorUsername: creator.username || '',
        productName: product.title,
        deliveryUrl,
        supportEmail: creator.email,
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
        where: inArray(products.id, productIds),
        with: { user: true },
      })

      const productMap = new Map(productsList.map((p) => [p.id, p]))
      const ordersCreated: any[] = []

      for (const item of input.items) {
        const product = productMap.get(item.productId)
        if (!product) continue // Skip if not found
        if (!product.isActive) continue // Skip if inactive

        // Check quantity limits if applicable (simple check)
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

        // Create orders based on quantity?
        // No, create one order record with quantity field.

        const deliveryToken = crypto.randomUUID()
        const orderId = crypto.randomUUID()

        const [newOrder] = await db
          .insert(orders)
          .values({
            id: orderId,
            creatorId: creator.id,
            productId: product.id,
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

        // Update analytics
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
          buyerName: input.buyerName ?? '',
          creatorName: creator.name,
          creatorUsername: creator.username || '',
          productName: product.title,
          deliveryUrl,
          supportEmail: creator.email,
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
          product: true,
        },
        orderBy: [desc(orders.createdAt)],
      })
      return rows
    }),

  resendEmail: publicProcedure
    .input(z.object({ orderId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      // 1. Get order with details
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

      const emailResult = await sendOrderEmail({
        to: order.buyerEmail,
        buyerName: order.buyerName ?? '',
        creatorName: order.creator.name,
        creatorUsername: order.creator.username || '',
        productName: order.product.title,
        deliveryUrl,
        supportEmail: order.creator.email,
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

const analyticsRouter = {
  // Get profile-level analytics (total revenue, total sales count)
  getProfileAnalytics: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const profile = await db.query.user.findFirst({
        where: eq(user.id, input.userId),
        columns: {
          totalRevenue: true,
          totalSalesCount: true,
        },
      })

      if (!profile) {
        return {
          totalRevenue: 0,
          totalSalesCount: 0,
        }
      }

      return {
        totalRevenue: profile.totalRevenue,
        totalSalesCount: profile.totalSalesCount,
      }
    }),

  // Get per-product analytics
  getProductAnalytics: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const productRows = await db.query.products.findMany({
        where: eq(products.userId, input.userId),
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

      return productRows.map((p) => ({
        id: p.id,
        title: p.title,
        image: p.images?.[0] ?? null,
        salesCount: p.salesCount,
        totalRevenue: p.totalRevenue,
        isActive: p.isActive,
        createdAt: p.createdAt,
      }))
    }),
} satisfies TRPCRouterRecord

export const trpcRouter = createTRPCRouter({
  user: userRouter,
  block: blockRouter,
  product: productRouter,
  socialLink: socialLinkRouter,
  storage: storageRouter,
  order: orderRouter,
  analytics: analyticsRouter,
})
export type TRPCRouter = typeof trpcRouter
