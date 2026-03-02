import { createFileRoute, redirect } from '@tanstack/react-router'
import { Header } from '@/components/site-header'
import HeroSection from '@/components/hero-section'
import { checkOnboardingStatus } from '@/lib/onboarding-server'
import { SiteFooter } from '@/components/site-footer'
import FeatureSection from '@/components/feature-section'
import CTASection from '@/components/cta-section'

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
      <div className="max-w-screen overflow-x-hidden">
        <div className="relative isolate flex min-h-svh flex-col">
          <HeroSection />
          <FeatureSection />
          <CTASection />
          <SiteFooter />
        </div>
      </div>
    </>
  )
}
