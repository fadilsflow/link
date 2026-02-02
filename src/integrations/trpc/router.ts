import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { user } from '@/db/schema'

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

      // Update user with new username
      const [updatedUser] = await db
        .update(user)
        .set({ username: input.username })
        .where(eq(user.id, input.userId))
        .returning()

      return updatedUser
    }),
} satisfies TRPCRouterRecord

export const trpcRouter = createTRPCRouter({
  user: userRouter,
})
export type TRPCRouter = typeof trpcRouter
