import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { checkOnboardingStatus } from '@/lib/onboarding-server'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/auth/callback')({
  beforeLoad: async () => {
    // 1. FAST PATH: Check on server before rendering anything
    const status = await checkOnboardingStatus()

    if (status.isLoggedIn) {
      if (status.isOnboardingComplete) {
        throw redirect({
          to: '/admin/editor/profiles',
        })
      } else {
        throw redirect({
          to: '/onboarding',
          search: { page: status.nextPage },
        })
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

      if (status.isLoggedIn) {
        if (status.isOnboardingComplete) {
          navigate({
            to: '/admin/editor/profiles',
          })
        } else {
          navigate({
            to: '/onboarding',
            search: { page: status.nextPage },
          })
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
      </div>
    </div>
  )
}
