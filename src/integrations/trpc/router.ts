import { z } from 'zod'
import { and, asc, desc, eq, gte, inArray, lte, or, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from './init'
import type { TRPCRouterRecord } from '@trpc/server'
import { db } from '@/db'
import {
  TRANSACTION_TYPE,
  blockClicks,
  blocks,
  orderItems,
  orders,
  payouts,
  products,
  profileViews,
  socialLinks,
  transactions,
  user,
} from '@/db/schema'
import { StorageService } from '@/lib/storage'
import { sendConsolidatedCheckoutEmail, sendOrderEmail } from '@/lib/email'
import { BASE_URL } from '@/lib/constans'
import {
  blockCreateInputSchema,
  blockUpdateInputSchema,
} from '@/lib/block-form'

// ─── Hold period for funds (in days) ─────────────────────────────────────────
const HOLD_PERIOD_DAYS = 7
const PLATFORM_FEE_PERCENT = 5 // 5% fee
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function getAvailableAt(): Date {
  const d = new Date()
  d.setDate(d.getDate() + HOLD_PERIOD_DAYS)
  return d
}

function isSafeUrlValue(value: string): boolean {
  if (value.startsWith('/')) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

const nullableTrimmedStringSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}, z.string().nullable())

const nullableUrlSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed.length === 0 ? null : trimmed
  },
  z
    .string()
    .max(2048)
    .refine((value) => isSafeUrlValue(value), {
      message: 'Invalid URL format',
    })
    .nullable(),
)

const nullableHexColorSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}, z.string().regex(HEX_COLOR_PATTERN, 'Invalid color format').nullable())

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username minimal 3 karakter')
  .max(30, 'Username maksimal 30 karakter')
  .regex(
    /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/,
    'Username hanya boleh huruf kecil, angka, underscore, atau dash',
  )

const onboardingDetailsSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  bio: nullableTrimmedStringSchema.pipe(z.string().max(300).nullable()).optional(),
  avatarUrl: nullableUrlSchema.optional(),
})

const onboardingStepSchema = z.discriminatedUnion('step', [
  z.object({
    step: z.literal('username'),
    username: usernameSchema,
  }),
  z.object({
    step: z.literal('role'),
    title: z.string().trim().min(1).max(80),
  }),
  z.object({
    step: z.literal('details'),
    details: onboardingDetailsSchema,
  }),
  z.object({
    step: z.literal('finish'),
  }),
])

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

type CheckoutQuestion = {
  id: string
  label: string
  required: boolean
}

function parseCustomerQuestions(raw: unknown): Array<CheckoutQuestion> {
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

function getEffectiveUnitPrice(
  product: any,
  amountPaidPerUnit: number,
): number {
  if (product.payWhatYouWant) return amountPaidPerUnit
  if (product.salePrice && product.price && product.salePrice < product.price) {
    return product.salePrice
  }
  return product.price ?? 0
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
    .input(z.object({ username: usernameSchema }))
    .query(async ({ input }) => {
      const foundUser = await db.query.user.findFirst({
        where: eq(user.username, input.username),
      })
      return foundUser ?? null
    }),
  setUsername: protectedProcedure
    .input(z.object({ username: usernameSchema }))
    .mutation(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
      const existing = await db.query.user.findFirst({
        where: eq(user.username, input.username),
      })

      if (existing && existing.id !== actorUserId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username is already taken',
        })
      }

      const [updatedUser] = await db
        .update(user)
        .set({ username: input.username })
        .where(eq(user.id, actorUserId))
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
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(80).optional(),
        title: nullableTrimmedStringSchema
          .pipe(z.string().max(80).nullable())
          .optional(),
        bio: nullableTrimmedStringSchema
          .pipe(z.string().max(300).nullable())
          .optional(),
        image: nullableUrlSchema.optional(),
        appearanceBannerEnabled: z.boolean().optional(),
        appearanceBgImageUrl: nullableUrlSchema.optional(),
        appearanceBackgroundType: z
          .enum(['none', 'flat', 'gradient', 'avatar-blur', 'image'])
          .optional(),
        appearanceBackgroundColor: nullableHexColorSchema.optional(),
        appearanceBackgroundGradientTop: nullableHexColorSchema.optional(),
        appearanceBackgroundGradientBottom: nullableHexColorSchema.optional(),
        appearanceBackgroundImageUrl: nullableUrlSchema.optional(),
        appearanceBlockStyle: z.enum(['basic', 'flat', 'shadow']).optional(),
        appearanceBlockRadius: z.enum(['rounded', 'square']).optional(),
        appearanceBlockColor: nullableHexColorSchema.optional(),
        appearanceBlockShadowColor: nullableHexColorSchema.optional(),
        appearanceTextColor: nullableHexColorSchema.optional(),
        appearanceTextFont: z.enum(['sans', 'heading', 'mono']).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
      const [updatedUser] = await db
        .update(user)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.title !== undefined ? { title: input.title || null } : {}),
          ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
          ...(input.image !== undefined ? { image: input.image } : {}),
          ...(input.appearanceBannerEnabled !== undefined
            ? { appearanceBannerEnabled: input.appearanceBannerEnabled }
            : {}),
          ...(input.appearanceBgImageUrl !== undefined
            ? { appearanceBgImageUrl: input.appearanceBgImageUrl }
            : {}),
          ...(input.appearanceBackgroundType !== undefined
            ? { appearanceBackgroundType: input.appearanceBackgroundType }
            : {}),
          ...(input.appearanceBackgroundColor !== undefined
            ? { appearanceBackgroundColor: input.appearanceBackgroundColor }
            : {}),
          ...(input.appearanceBackgroundGradientTop !== undefined
            ? {
                appearanceBackgroundGradientTop:
                  input.appearanceBackgroundGradientTop,
              }
            : {}),
          ...(input.appearanceBackgroundGradientBottom !== undefined
            ? {
                appearanceBackgroundGradientBottom:
                  input.appearanceBackgroundGradientBottom,
              }
            : {}),
          ...(input.appearanceBackgroundImageUrl !== undefined
            ? {
                appearanceBackgroundImageUrl:
                  input.appearanceBackgroundImageUrl,
              }
            : {}),
          ...(input.appearanceBlockStyle !== undefined
            ? { appearanceBlockStyle: input.appearanceBlockStyle }
            : {}),
          ...(input.appearanceBlockRadius !== undefined
            ? { appearanceBlockRadius: input.appearanceBlockRadius }
            : {}),
          ...(input.appearanceBlockColor !== undefined
            ? { appearanceBlockColor: input.appearanceBlockColor }
            : {}),
          ...(input.appearanceBlockShadowColor !== undefined
            ? { appearanceBlockShadowColor: input.appearanceBlockShadowColor }
            : {}),
          ...(input.appearanceTextColor !== undefined
            ? { appearanceTextColor: input.appearanceTextColor }
            : {}),
          ...(input.appearanceTextFont !== undefined
            ? { appearanceTextFont: input.appearanceTextFont }
            : {}),
        })
        .where(eq(user.id, actorUserId))
        .returning()
      return updatedUser
    }),
} satisfies TRPCRouterRecord

const onboardingRouter = {
  getState: protectedProcedure.query(async ({ ctx }) => {
    const actorUserId = ctx.session.user.id
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, actorUserId),
      columns: {
        username: true,
        title: true,
        name: true,
        bio: true,
        image: true,
      },
    })

    if (!existingUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    return existingUser
  }),
  saveStep: protectedProcedure
    .input(onboardingStepSchema)
    .mutation(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id

      if (input.step === 'finish') {
        const existingUser = await db.query.user.findFirst({
          where: eq(user.id, actorUserId),
          columns: {
            username: true,
            title: true,
            name: true,
            bio: true,
            image: true,
          },
        })

        if (!existingUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          })
        }

        return existingUser
      }

      if (input.step === 'username') {
        const existing = await db.query.user.findFirst({
          where: eq(user.username, input.username),
          columns: { id: true },
        })

        if (existing && existing.id !== actorUserId) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Username is already taken',
          })
        }

        const [updatedUser] = await db
          .update(user)
          .set({ username: input.username })
          .where(eq(user.id, actorUserId))
          .returning({
            username: user.username,
            title: user.title,
            name: user.name,
            bio: user.bio,
            image: user.image,
          })

        return updatedUser
      }

      if (input.step === 'role') {
        const [updatedUser] = await db
          .update(user)
          .set({ title: input.title })
          .where(eq(user.id, actorUserId))
          .returning({
            username: user.username,
            title: user.title,
            name: user.name,
            bio: user.bio,
            image: user.image,
          })

        return updatedUser
      }

      const [updatedUser] = await db
        .update(user)
        .set({
          name: input.details.displayName,
          bio: input.details.bio ?? null,
          image: input.details.avatarUrl ?? null,
        })
        .where(eq(user.id, actorUserId))
        .returning({
          username: user.username,
          title: user.title,
          name: user.name,
          bio: user.bio,
          image: user.image,
        })

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
  create: protectedProcedure
    .input(blockCreateInputSchema)
    .mutation(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
      // Get max order
      const userBlocks = await db.query.blocks.findMany({
        where: eq(blocks.userId, actorUserId),
        orderBy: [asc(blocks.order)],
      })
      const maxOrder = userBlocks[userBlocks.length - 1]?.order ?? 0

      const [newBlock] = await db
        .insert(blocks)
        .values({
          id: crypto.randomUUID(),
          userId: actorUserId,
          title: input.title.trim(),
          url: input.url.trim() || null,
          type: input.type,
          content: input.content?.trim() || null,
          order: maxOrder + 1,
          isEnabled: input.isEnabled ?? true,
        })
        .returning()
      return newBlock
    }),
  update: protectedProcedure
    .input(blockUpdateInputSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedBlock] = await db
        .update(blocks)
        .set({
          title: input.title.trim(),
          url: input.url.trim() || null,
          type: input.type,
          content: input.content?.trim() || null,
          ...(input.isEnabled !== undefined
            ? { isEnabled: input.isEnabled }
            : {}),
        })
        .where(
          and(eq(blocks.id, input.id), eq(blocks.userId, ctx.session.user.id)),
        )
        .returning()

      return updatedBlock
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await db
        .delete(blocks)
        .where(
          and(eq(blocks.id, input.id), eq(blocks.userId, ctx.session.user.id)),
        )
        .returning({ id: blocks.id })

      if (!deleted.length) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      return { success: true }
    }),
  reorder: protectedProcedure
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
    .mutation(async ({ input, ctx }) => {
      console.log('TRPC: Reordering blocks', input.items.length, 'items')
      // neon-http driver does not support transactions, so we run these in parallel
      await Promise.all(
        input.items.map((item) =>
          db
            .update(blocks)
            .set({ order: item.order })
            .where(
              and(
                eq(blocks.id, item.id),
                eq(blocks.userId, ctx.session.user.id),
              ),
            ),
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
const productMutationInput = productBaseInput.omit({ userId: true })

// Reusable input schemas & types for frontend and backend
export const priceSettingsInputSchema = priceSettingsSchema
export const customerQuestionInputSchema = customerQuestionSchema
export const productInputSchema = productBaseInput

export type PriceSettingsInput = z.infer<typeof priceSettingsInputSchema>
export type CustomerQuestionInput = z.infer<typeof customerQuestionInputSchema>
export type ProductInput = z.infer<typeof productInputSchema>

const productRouter = {
  listByUser: protectedProcedure.query(async ({ ctx }) => {
    const actorUserId = ctx.session.user.id
    const rows = await db.query.products.findMany({
      where: and(
        eq(products.userId, actorUserId),
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
          eq(transactions.creatorId, actorUserId),
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
  create: protectedProcedure
    .input(productMutationInput)
    .mutation(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
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
          userId: actorUserId,
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
  update: protectedProcedure
    .input(
      productMutationInput.extend({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
        .where(
          and(
            eq(products.id, input.id),
            eq(products.userId, ctx.session.user.id),
          ),
        )
        .returning()

      return row
    }),
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.id, input.id),
          eq(products.userId, ctx.session.user.id),
        ),
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
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(products)
        .set({ isDeleted: true, isActive: false })
        .where(
          and(
            eq(products.id, input.id),
            eq(products.userId, ctx.session.user.id),
          ),
        )
        .returning({ id: products.id })

      return { success: true }
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await db
        .update(products)
        .set({ isActive: input.isActive })
        .where(
          and(
            eq(products.id, input.id),
            eq(products.userId, ctx.session.user.id),
          ),
        )
        .returning()

      return row
    }),
} satisfies TRPCRouterRecord

// ─── Social Link Router ──────────────────────────────────────────────────────

const socialLinkRouter = {
  create: protectedProcedure
    .input(
      z.object({
        platform: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
      const userSocialLinks = await db.query.socialLinks.findMany({
        where: eq(socialLinks.userId, actorUserId),
        orderBy: [asc(socialLinks.order)],
      })
      const maxOrder = userSocialLinks[userSocialLinks.length - 1]?.order ?? 0

      const [newSocialLink] = await db
        .insert(socialLinks)
        .values({
          id: crypto.randomUUID(),
          userId: actorUserId,
          platform: input.platform,
          url: input.url,
          order: maxOrder + 1,
          isEnabled: true,
        })
        .returning()
      return newSocialLink
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        platform: z.string().optional(),
        url: z.string().optional(),
        isEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [updatedSocialLink] = await db
        .update(socialLinks)
        .set({
          ...(input.platform !== undefined ? { platform: input.platform } : {}),
          ...(input.url !== undefined ? { url: input.url } : {}),
          ...(input.isEnabled !== undefined
            ? { isEnabled: input.isEnabled }
            : {}),
        })
        .where(
          and(
            eq(socialLinks.id, input.id),
            eq(socialLinks.userId, ctx.session.user.id),
          ),
        )
        .returning()

      return updatedSocialLink
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await db
        .delete(socialLinks)
        .where(
          and(
            eq(socialLinks.id, input.id),
            eq(socialLinks.userId, ctx.session.user.id),
          ),
        )
        .returning({ id: socialLinks.id })

      if (!deleted.length) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      return { success: true }
    }),
  reorder: protectedProcedure
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
    .mutation(async ({ input, ctx }) => {
      await Promise.all(
        input.items.map((item) =>
          db
            .update(socialLinks)
            .set({ order: item.order })
            .where(
              and(
                eq(socialLinks.id, item.id),
                eq(socialLinks.userId, ctx.session.user.id),
              ),
            ),
        ),
      )
      return { success: true }
    }),
} satisfies TRPCRouterRecord

// ─── Storage Router ──────────────────────────────────────────────────────────

export const storageRouter = {
  getUploadUrl: protectedProcedure
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
      if (product.totalQuantity !== null && product.totalQuantity <= 0) {
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
          checkoutGroupId: orderId,
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
        creators: [creator],
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

  getCheckoutProducts: publicProcedure
    .input(z.object({ productIds: z.array(z.string()).min(1).max(50) }))
    .query(async ({ input }) => {
      const rows = await db.query.products.findMany({
        where: and(
          inArray(products.id, input.productIds),
          eq(products.isDeleted, false),
          eq(products.isActive, true),
        ),
        columns: {
          id: true,
          title: true,
          customerQuestions: true,
          payWhatYouWant: true,
          price: true,
          salePrice: true,
          minimumPrice: true,
          suggestedPrice: true,
        },
        with: {
          user: {
            columns: {
              name: true,
            },
          },
        },
      })

      return rows.map((product) => ({
        ...product,
        storeName: product.user.name,
        questions: parseCustomerQuestions(product.customerQuestions),
      }))
    }),

  /**
   * Multi-product cart checkout.
   * Processes one checkout transaction but splits into one order per store.
   */
  createMultiple: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1).default(1),
            amountPaidPerUnit: z.number().min(0),
            answers: z.record(z.string(), z.string()).optional(),
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

      const checkoutGroupId = crypto.randomUUID()
      const productIds = [...new Set(input.items.map((i) => i.productId))]
      const productsList = await db.query.products.findMany({
        where: and(
          inArray(products.id, productIds),
          eq(products.isDeleted, false),
        ),
        with: { user: true },
      })

      const productMap = new Map(productsList.map((p) => [p.id, p]))
      const normalizedItems: Array<any> = []

      for (const item of input.items) {
        const product = productMap.get(item.productId)
        if (!product) {
          throw new Error('One or more products in your cart no longer exist')
        }
        if (!product.isActive) {
          throw new Error(`${product.title} is no longer available`)
        }

        if (
          product.totalQuantity !== null &&
          product.totalQuantity < item.quantity
        ) {
          throw new Error(
            `Product ${product.title} sold out or not enough stock`,
          )
        }

        if (
          product.limitPerCheckout !== null &&
          item.quantity > product.limitPerCheckout
        ) {
          throw new Error(`Product ${product.title} exceeds per-checkout limit`)
        }

        const questions = parseCustomerQuestions(product.customerQuestions)
        for (const question of questions) {
          if (
            question.required &&
            !(item.answers?.[question.id] || '').trim()
          ) {
            throw new Error(
              `Please answer required question for ${product.title}: ${question.label}`,
            )
          }
        }

        const effectivePrice = getEffectiveUnitPrice(
          product,
          item.amountPaidPerUnit,
        )

        if (product.payWhatYouWant && product.minimumPrice) {
          if (item.amountPaidPerUnit < product.minimumPrice) {
            throw new Error(
              `${product.title} requires at least ${product.minimumPrice}`,
            )
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

      const itemsByCreator = new Map<string, Array<any>>()
      for (const item of normalizedItems) {
        const existing = itemsByCreator.get(item.creatorId) ?? []
        existing.push(item)
        itemsByCreator.set(item.creatorId, existing)
      }

      const createdOrders: Array<any> = []

      for (const [creatorId, creatorItems] of itemsByCreator.entries()) {
        const orderId = crypto.randomUUID()
        const deliveryToken = crypto.randomUUID()
        const orderAmount = creatorItems.reduce(
          (acc, item) => acc + item.totalAmount,
          0,
        )
        const totalQuantity = creatorItems.reduce(
          (acc, item) => acc + item.quantity,
          0,
        )
        const primaryItem = creatorItems[0]

        const [newOrder] = await db
          .insert(orders)
          .values({
            id: orderId,
            creatorId,
            productId:
              creatorItems.length === 1 ? primaryItem.product.id : null,
            productTitle:
              creatorItems.length === 1
                ? primaryItem.product.title
                : `${creatorItems.length} products`,
            productPrice:
              creatorItems.length === 1
                ? primaryItem.effectivePrice
                : orderAmount,
            productImage: primaryItem.product.images?.[0] ?? null,
            buyerEmail: input.buyerEmail,
            buyerName: input.buyerName ?? '',
            amountPaid: orderAmount,
            quantity: totalQuantity,
            checkoutAnswers: null,
            note: input.note ?? null,
            status: 'completed',
            deliveryToken,
            emailSent: false,
            checkoutGroupId,
          })
          .returning()

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

        for (const item of creatorItems) {
          const { feeAmount, netAmount } = calculateFee(item.totalAmount)

          await db.insert(transactions).values({
            id: crypto.randomUUID(),
            creatorId,
            orderId,
            type: TRANSACTION_TYPE.SALE,
            amount: item.totalAmount,
            netAmount,
            platformFeePercent: PLATFORM_FEE_PERCENT,
            platformFeeAmount: feeAmount,
            description: `Sale: ${item.product.title} x${item.quantity}`,
            availableAt: getAvailableAt(),
            metadata: {
              productId: item.product.id,
              buyerEmail: input.buyerEmail,
              quantity: item.quantity,
              checkoutGroupId,
            },
          })

          await db
            .update(products)
            .set({
              salesCount: sql`${products.salesCount} + ${item.quantity}`,
              totalRevenue: sql`${products.totalRevenue} + ${item.totalAmount}`,
            })
            .where(eq(products.id, item.product.id))

          await db
            .update(user)
            .set({
              totalSalesCount: sql`${user.totalSalesCount} + ${item.quantity}`,
              totalRevenue: sql`${user.totalRevenue} + ${item.totalAmount}`,
            })
            .where(eq(user.id, creatorId))
        }

        createdOrders.push({
          ...newOrder,
          items: creatorItems.map((item) => ({
            productTitle: item.product.title,
            quantity: item.quantity,
            productPrice: item.effectivePrice,
            amountPaid: item.totalAmount,
          })),
          creator: primaryItem.product.user,
        })
      }

      const emailResult = await sendConsolidatedCheckoutEmail({
        to: input.buyerEmail,
        checkoutGroupId,
        buyerName: input.buyerName ?? null,
        buyerEmail: input.buyerEmail,
        createdAt: new Date(),
        orders: createdOrders.map((order) => ({
          id: order.id,
          deliveryToken: order.deliveryToken,
          amountPaid: order.amountPaid,
          creatorName: order.creator?.name ?? 'Creator',
          creatorEmail: order.creator?.email ?? null,
          items: order.items,
        })),
      })

      if (emailResult.success) {
        await db
          .update(orders)
          .set({ emailSent: true, emailSentAt: new Date() })
          .where(
            inArray(
              orders.id,
              createdOrders.map((order) => order.id),
            ),
          )
      }

      const firstOrder = createdOrders[0]
      return {
        checkoutGroupId,
        deliveryUrl: `${BASE_URL}/d/${firstOrder.deliveryToken}`,
        deliveryUrls: createdOrders.map(
          (order) => `${BASE_URL}/d/${order.deliveryToken}`,
        ),
        orders: createdOrders,
      }
    }),

  listByCreator: protectedProcedure.query(async ({ ctx }) => {
    const actorUserId = ctx.session.user.id
    const creatorItemRows = await db.query.orderItems.findMany({
      where: eq(orderItems.creatorId, actorUserId),
      columns: { orderId: true },
    })

    const orderIdsFromItems = creatorItemRows.map((row) => row.orderId)
    const whereClause =
      orderIdsFromItems.length > 0
        ? or(
            eq(orders.creatorId, actorUserId),
            inArray(orders.id, orderIdsFromItems),
          )
        : eq(orders.creatorId, actorUserId)

    const rows = await db.query.orders.findMany({
      where: whereClause,
      with: {
        product: true,
        transactions: {
          where: eq(transactions.creatorId, actorUserId),
        },
        items: {
          where: eq(orderItems.creatorId, actorUserId),
        },
      },
      orderBy: [desc(orders.createdAt)],
    })
    return rows
  }),

  getDetail: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
      const order = await db.query.orders.findFirst({
        where: and(
          eq(orders.id, input.orderId),
          eq(orders.creatorId, actorUserId),
        ),
        with: {
          product: true,
          creator: true,
          transactions: {
            where: eq(transactions.creatorId, actorUserId),
          },
          items: {
            where: eq(orderItems.creatorId, actorUserId),
            with: {
              product: true,
              creator: true,
            },
          },
        },
      })

      if (!order) throw new Error('Order not found')

      return order
    }),

  resendEmail: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
      const order = await db.query.orders.findFirst({
        where: and(
          eq(orders.id, input.orderId),
          eq(orders.creatorId, actorUserId),
        ),
        with: {
          product: true,
          creator: true,
          items: {
            where: eq(orderItems.creatorId, actorUserId),
            with: {
              creator: true,
            },
          },
        },
      })

      if (!order) throw new Error('Order not found')

      const deliveryUrl = `${BASE_URL}/d/${order.deliveryToken}`
      const creators = Array.from(
        new Map(
          order.items
            .map((item) => item.creator)
            .filter(Boolean)
            .map((creator: any) => [creator.id, creator]),
        ).values(),
      )

      if (creators.length === 0 && order.creator) {
        creators.push(order.creator)
      }

      const emailResult = await sendOrderEmail({
        to: order.buyerEmail,
        deliveryUrl,
        order,
        creators,
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
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const actorUserId = ctx.session.user.id
    const now = new Date()

    // Total balance (all transactions)
    const allTxns = await db.query.transactions.findMany({
      where: eq(transactions.creatorId, actorUserId),
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
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
        type: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
      const conditions = [eq(transactions.creatorId, actorUserId)]
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
  request: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().positive().optional(), // if not specified, payout all available
        payoutMethod: z.string().optional(),
        payoutDetails: z.any().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
      const now = new Date()
      let createdPayoutId: string | null = null

      try {
        const existingPendingPayout = await db.query.payouts.findFirst({
          where: and(
            eq(payouts.creatorId, actorUserId),
            eq(payouts.status, 'pending'),
          ),
          columns: { id: true },
        })
        if (existingPendingPayout) {
          throw new Error('You already have a pending payout request')
        }

        // Calculate available balance using drizzle's query builder
        const availableResult = await db
          .select({
            availableBalance: sql<number>`COALESCE(SUM(${transactions.amount} - ${transactions.platformFeeAmount}), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.creatorId, actorUserId),
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
        createdPayoutId = payoutId

        // Insert payout record
        const [payout] = await db
          .insert(payouts)
          .values({
            id: payoutId,
            creatorId: actorUserId,
            amount: payoutAmount,
            status: 'pending',
            periodEnd: now,
            payoutMethod: input.payoutMethod ?? null,
            payoutDetails: input.payoutDetails ?? null,
          })
          .returning()

        // Insert debit transaction
        await db.insert(transactions).values({
          id: crypto.randomUUID(),
          creatorId: actorUserId,
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
      } catch (error) {
        console.error('[finance][payout-request] transaction failed', {
          userId: actorUserId,
          amount: input.amount,
          error,
        })

        if (createdPayoutId) {
          await db
            .update(payouts)
            .set({
              status: 'failed',
              failureReason: 'Failed to create ledger debit transaction',
              updatedAt: new Date(),
            })
            .where(eq(payouts.id, createdPayoutId))
            .catch((rollbackError) => {
              console.error(
                '[finance][payout-request] payout rollback failed',
                {
                  payoutId: createdPayoutId,
                  rollbackError,
                },
              )
            })
        }

        const rawMessage =
          error instanceof Error ? error.message : String(error)
        const message = rawMessage.toLowerCase()
        const isDomainValidationError =
          message.includes('you already have a pending payout request') ||
          message.includes('no available balance for payout') ||
          (message.includes('requested') && message.includes('available'))

        if (
          message.includes('payout_one_pending_per_creator_idx') ||
          (message.includes('duplicate key') &&
            message.includes('payout') &&
            message.includes('pending'))
        ) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'You already have a pending payout request',
          })
        }

        if (isDomainValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: rawMessage,
          })
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Payout request failed. Please retry.',
        })
      }
    }),

  /**
   * List all payouts for a creator.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const actorUserId = ctx.session.user.id
    const rows = await db.query.payouts.findMany({
      where: eq(payouts.creatorId, actorUserId),
      orderBy: [desc(payouts.createdAt)],
    })
    return rows
  }),

  /**
   * Cancel a pending payout (reverses the debit transaction).
   */
  cancel: protectedProcedure
    .input(z.object({ payoutId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
      const payout = await db.query.payouts.findFirst({
        where: eq(payouts.id, input.payoutId),
      })

      if (!payout) throw new Error('Payout not found')
      if (payout.creatorId !== actorUserId) throw new Error('Unauthorized')
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
        creatorId: actorUserId,
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
  getOverview: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        mode: z.enum(['all', 'activity', 'revenue']).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const actorUserId = ctx.session.user.id
      const mode = input.mode ?? 'all'
      const includeActivity = mode === 'all' || mode === 'activity'
      const includeRevenue = mode === 'all' || mode === 'revenue'
      const includeLegacyTotals = mode === 'all'
      const fromDate = input.from
        ? new Date(`${input.from}T00:00:00.000Z`)
        : null
      const toDate = input.to ? new Date(`${input.to}T23:59:59.999Z`) : null

      const profile = includeLegacyTotals
        ? await db.query.user.findFirst({
            where: eq(user.id, actorUserId),
            columns: {
              totalRevenue: true,
              totalSalesCount: true,
              totalViews: true,
            },
          })
        : null

      const blockRows = includeLegacyTotals
        ? await db.query.blocks.findMany({
            where: eq(blocks.userId, actorUserId),
            columns: {
              id: true,
              title: true,
              type: true,
              clicks: true,
              isEnabled: true,
            },
            orderBy: [desc(blocks.clicks)],
          })
        : []

      const txnRows = includeRevenue
        ? await db.query.transactions.findMany({
            where: and(
              eq(transactions.creatorId, actorUserId),
              eq(transactions.type, TRANSACTION_TYPE.SALE),
              ...(fromDate ? [gte(transactions.createdAt, fromDate)] : []),
              ...(toDate ? [lte(transactions.createdAt, toDate)] : []),
            ),
            columns: {
              netAmount: true,
              type: true,
              createdAt: true,
            },
            orderBy: [asc(transactions.createdAt)],
          })
        : []

      const viewRows = includeActivity
        ? await db.query.profileViews.findMany({
            where: and(
              eq(profileViews.userId, actorUserId),
              ...(fromDate ? [gte(profileViews.createdAt, fromDate)] : []),
              ...(toDate ? [lte(profileViews.createdAt, toDate)] : []),
            ),
            columns: { id: true, createdAt: true },
          })
        : []

      const clickRows = includeActivity
        ? await db.query.blockClicks.findMany({
            where: and(
              eq(blockClicks.userId, actorUserId),
              ...(fromDate ? [gte(blockClicks.createdAt, fromDate)] : []),
              ...(toDate ? [lte(blockClicks.createdAt, toDate)] : []),
            ),
            columns: { id: true, createdAt: true },
          })
        : []

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
        chart: Array.from(byDay.values()).sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
        blocks: blockRows,
      }
    }),

  // Get per-product analytics
  getProductAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const actorUserId = ctx.session.user.id
    const productRows = await db.query.products.findMany({
      where: and(
        eq(products.userId, actorUserId),
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
          eq(transactions.creatorId, actorUserId),
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

const adminRouter = {
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, ctx.session.user.id),
      columns: { username: true },
    })

    return {
      username: currentUser?.username ?? null,
    }
  }),

  getContext: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, ctx.session.user.id),
      columns: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
      },
    })

    const currentUsername = currentUser?.username
    if (!currentUsername) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    return {
      userId: currentUser.id,
      username: currentUsername,
      name: currentUser.name,
      email: currentUser.email,
      image: currentUser.image ?? null,
    }
  }),
} satisfies TRPCRouterRecord

// ─── Main Router ─────────────────────────────────────────────────────────────

export const trpcRouter = createTRPCRouter({
  user: userRouter,
  onboarding: onboardingRouter,
  block: blockRouter,
  product: productRouter,
  socialLink: socialLinkRouter,
  storage: storageRouter,
  order: orderRouter,
  balance: balanceRouter,
  payout: payoutRouter,
  analytics: analyticsRouter,
  admin: adminRouter,
})
export type TRPCRouter = typeof trpcRouter
