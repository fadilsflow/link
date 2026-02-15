import { createFileRoute, redirect } from '@tanstack/react-router'
import { OnboardingDialog } from '@/components/onboarding-modal'
import { checkOnboardingStatus } from '@/lib/onboarding-server'
import { authClient } from '@/lib/auth-client'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
  beforeLoad: async () => {
    const status = await checkOnboardingStatus()

    // If not logged in, redirect to home
    if (!status.isLoggedIn) {
      throw redirect({ to: '/' })
    }

    // If already has username, redirect to admin
    if (status.hasUsername && status.user.username) {
      throw redirect({
        to: '/admin/editor/profiles',
      })
    }
  },
})

function OnboardingPage() {
  const navigate = Route.useNavigate()

  const handleUsernameSubmit = async (username: string) => {
    const { data: session } = await authClient.getSession()

    if (!session?.user.id) {
      throw new Error('User tidak ditemukan')
    }

    await trpcClient.user.setUsername.mutate({
      userId: session.user.id,
      username,
    })

    // Redirect to admin
    navigate({
      to: '/admin/editor/profiles',
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <OnboardingDialog open={true} onUsernameSubmit={handleUsernameSubmit} />
    </div>
  )
}
