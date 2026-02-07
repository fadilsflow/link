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
      console.log('User is not logged in')
      throw redirect({ to: '/' })
    }

    // If already has username, redirect to admin
    if (status.hasUsername && status.user?.username) {
      console.log('User already has username, redirecting to admin')
      throw redirect({
        to: '/$username/admin/editor/profiles',
        params: { username: status.user.username },
      })
    }
  },
})

function OnboardingPage() {
  const navigate = Route.useNavigate()

  const handleUsernameSubmit = async (username: string) => {
    const { data: session } = await authClient.getSession()

    if (!session?.user?.id) {
      throw new Error('User tidak ditemukan')
    }

    try {
      await trpcClient.user.updateUsername.mutate({
        userId: session.user.id,
        username,
      })

      // Refresh session to get updated user data
      const { data: updatedSession } = await authClient.getSession()
      const newUsername = (updatedSession?.user as any)?.username || username

      // Redirect to admin
      navigate({
        to: '/$username/admin/editor/profiles',
        params: { username: newUsername },
      })
    } catch (error) {
      throw error
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <OnboardingDialog open={true} onUsernameSubmit={handleUsernameSubmit} />
    </div>
  )
}
