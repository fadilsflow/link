import { createFileRoute, redirect } from '@tanstack/react-router'
import { Header } from '@/components/Header'
import { HeroSection } from '@/components/HeroSection'
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
      <main className="flex-1 min-h-screen">
        <HeroSection />
      </main>
    </>
  )
}
