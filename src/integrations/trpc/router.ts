import { z } from 'zod'
import { eq, asc, desc } from 'drizzle-orm'
import { db } from '@/db'
import { user, links } from '@/db/schema'

import { createTRPCRouter, publicProcedure } from './init'

import type { TRPCRouterRecord } from '@trpc/server'

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

const linkRouter = {
  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string().default('New Link'),
        url: z.string().default(''),
      }),
    )
    .mutation(async ({ input }) => {
      // Get max order
      const userLinks = await db.query.links.findMany({
        where: eq(links.userId, input.userId),
        orderBy: [desc(links.order)],
      })
      const maxOrder = userLinks[0]?.order ?? 0

      const [newLink] = await db
        .insert(links)
        .values({
          id: crypto.randomUUID(),
          userId: input.userId,
          title: input.title,
          url: input.url,
          order: maxOrder + 1,
          isEnabled: true,
        })
        .returning()
      return newLink
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        url: z.string().optional(),
        isEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updatedLink] = await db
        .update(links)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.url !== undefined ? { url: input.url } : {}),
          ...(input.isEnabled !== undefined
            ? { isEnabled: input.isEnabled }
            : {}),
        })
        .where(eq(links.id, input.id))
        .returning()
      return updatedLink
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(links).where(eq(links.id, input.id))
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
      // Use transaction for bulk update if possible, or parallel/sequential updates
      // Neondb/drizzle batching:
      await db.transaction(async (tx) => {
        for (const item of input.items) {
          await tx
            .update(links)
            .set({ order: item.order })
            .where(eq(links.id, item.id))
        }
      })
      return { success: true }
    }),
} satisfies TRPCRouterRecord

export const trpcRouter = createTRPCRouter({
  user: userRouter,
  link: linkRouter,
})
export type TRPCRouter = typeof trpcRouter
