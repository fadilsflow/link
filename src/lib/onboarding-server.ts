import { createServerFn } from '@tanstack/react-start'
import { getServerSession } from './auth-server'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { user } from '@/db/schema'

export const checkOnboardingStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getServerSession()

    if (!session?.user) {
      return { isLoggedIn: false, hasUsername: false }
    }

    const dbUser = await db.query.user.findFirst({
      where: eq(user.email, session.user.email),
    })

    return {
      isLoggedIn: true,
      hasUsername: !!dbUser?.username,
      user: dbUser,
    }
  },
)
