import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getServerAuthContext } from './auth-server'
import { db } from '@/db'
import { user } from '@/db/schema'
import { fchown } from 'node:fs'

export const ONBOARDING_PAGES = [
  'username',
  'role',
  'details',
  'finish',
] as const
export type OnboardingPage = (typeof ONBOARDING_PAGES)[number]

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export const checkOnboardingStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const authContext = await getServerAuthContext()

    if (!authContext.isAuthenticated) {
      return {
        isLoggedIn: false,
        hasUsername: false,
        isOnboardingComplete: false,
        nextPage: 'username' as OnboardingPage,
      }
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, authContext.user.id),
      columns: {
        id: true,
        username: true,
        title: true,
        name: true,
        bio: true,
        image: true,
      },
    })

    if (!existingUser) {
      return {
        isLoggedIn: true,
        hasUsername: false,
        isOnboardingComplete: false,
        nextPage: 'username' as OnboardingPage,
      }
    }

    const hasUsername = hasValue(existingUser.username)
    const hasRole = hasValue(existingUser.title)
    const hasDetails = hasValue(existingUser.name)
    const isOnboardingComplete = hasUsername && hasRole && hasDetails

    const nextPage: OnboardingPage = !hasUsername
      ? 'username'
      : !hasRole
        ? 'role'
        : !hasDetails
          ? 'details'
          : 'finish'

    return {
      isLoggedIn: true,
      hasUsername,
      isOnboardingComplete,
      nextPage,
      user: existingUser,
    }
  },
)
