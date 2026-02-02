import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { user } from '@/db/schema'
import { z } from 'zod'

export const getPublicProfile = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: username }) => {
    const dbUser = await db.query.user.findFirst({
      where: eq(user.username, username),
      with: {
        links: {
          where: (links, { eq }) => eq(links.isEnabled, true),
          orderBy: (links, { asc }) => [asc(links.order)],
        },
      },
    })

    if (!dbUser) {
      return null
    }

    return {
      user: dbUser,
      links: dbUser.links,
    }
  })

export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    // We can get the session from the context/auth-server, but since this is called
    // from the admin route which already gatekeeps, we can just expect the caller
    // to arguably be secure, BUT relies on server-side session check is better.
    // However, for optimization in this specific flow, we might just pass the user ID
    // or rely on `getServerSession` again.
    // Given the previous optimization in onboarding-server, let's just use getServerSession here too.
    const { getServerSession } = await import('@/lib/auth-server')
    const session = await getServerSession()

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      with: {
        links: {
          orderBy: (links, { asc }) => [asc(links.order)],
        },
      },
    })

    if (!dbUser) {
      throw new Error('User not found')
    }

    return {
      user: dbUser,
      links: dbUser.links,
    }
  },
)
