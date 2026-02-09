import { checkOnboardingStatus } from '@/lib/onboarding-server'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/auth/callback')({
  beforeLoad: async () => {
    // 1. FAST PATH: Check on server before rendering anything
    const status = await checkOnboardingStatus()

    if (status.isLoggedIn && status.user) {
      const username = status.user.username

      if (username) {
        throw redirect({
          to: '/$username/admin/editor/profiles',
          params: { username },
        })
      } else {
        throw redirect({ to: '/onboarding' })
      }
    }
  },
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    let isCancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    // 2. FALLBACK PATH: If server-side didn't redirect, try once more on the client
    // This handles rare timing issues where cookies might sync slightly after the initial request.
    const checkAgain = async () => {
      const status = await checkOnboardingStatus()
      if (isCancelled) return

      if (status.isLoggedIn && status.user) {
        const username = status.user.username
        if (username) {
          navigate({
            to: '/$username/admin/editor/profiles',
            params: { username },
          })
        } else {
          navigate({ to: '/onboarding' })
        }
      } else {
        // If still nothing after a brief wait, go home
        timeoutId = setTimeout(() => {
          if (!isCancelled) {
            navigate({ to: '/' })
          }
        }, 2000)
      }
    }

    checkAgain()

    return () => {
      isCancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [navigate])

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex flex-col items-center gap-2">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Verifying your session...
        </p>
      </div>
    </div>
  )
}
