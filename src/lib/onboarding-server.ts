import { createServerFn } from '@tanstack/react-start'
import { getServerSession } from './auth-server'

export const checkOnboardingStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getServerSession()

    if (!session?.user) {
      return { isLoggedIn: false, hasUsername: false }
    }

    return {
      isLoggedIn: true,
      hasUsername: !!session.user.username,
      user: session.user,
    }
  },
)
