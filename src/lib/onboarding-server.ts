import { createServerFn } from '@tanstack/react-start'
import { getServerAuthContext } from './auth-server'

export const checkOnboardingStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const authContext = await getServerAuthContext()

    if (!authContext.isAuthenticated) {
      return { isLoggedIn: false, hasUsername: false }
    }

    return {
      isLoggedIn: true,
      hasUsername: !!authContext.user.username,
      user: authContext.user,
    }
  },
)
