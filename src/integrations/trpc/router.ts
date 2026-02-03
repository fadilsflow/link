import { z } from 'zod'
import { asc, desc, eq } from 'drizzle-orm'
import { createTRPCRouter, publicProcedure } from './init'
import type { TRPCRouterRecord } from '@trpc/server'
import { db } from '@/db'
import { blocks, user } from '@/db/schema'

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
        },
      })
      if (!userProfile) return null
      return {
        user: userProfile,
        blocks: userProfile.blocks,
      }
    }),
  updateProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        title: z.string().optional(),
        bio: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updatedUser] = await db
        .update(user)
        .set({
          ...(input.name ? { name: input.name } : {}),
          ...(input.title ? { title: input.title } : {}),
          ...(input.bio ? { bio: input.bio } : {}),
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

export const trpcRouter = createTRPCRouter({
  user: userRouter,
  block: blockRouter,
})
export type TRPCRouter = typeof trpcRouter
