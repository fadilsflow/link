import { Header } from '@/components/Header'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { checkOnboardingStatus } from '@/lib/onboarding-server'

export const Route = createFileRoute('/')({
  component: App,
  beforeLoad: async ({ location }) => {
    // If user is at home and logged in, check if they have username
    if (location.pathname === '/') {
      const status = await checkOnboardingStatus()

      // If user is logged in but doesn't have username, redirect to onboarding
      if (status.isLoggedIn && !status.hasUsername) {
        throw redirect({ to: '/onboarding' })
      }
    } 
  },
})

function App() {
  return (
    <>
      <Header />
      <div className="flex flex-col items-center justify-center h-screen bg-muted">
        <h1 className="text-4xl font-bold">
          The Trusted Gateway to Organizations and Creators
        </h1>
      </div>
    </>
  )
}
