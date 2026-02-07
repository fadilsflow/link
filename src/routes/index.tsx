import { createFileRoute, redirect } from '@tanstack/react-router'
import { Header } from '@/components/site-header'
import HeroSection from '@/components/hero-section'
import { checkOnboardingStatus } from '@/lib/onboarding-server'
import { SiteFooter } from '@/components/site-footer'

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
      <div className="relative isolate flex min-h-svh flex-col overflow-clip [--header-height:4rem]">
        <div
          aria-hidden="true"
          className="before:-left-3 after:-right-3 container pointer-events-none absolute inset-0 z-45 before:absolute before:inset-y-0 before:w-px before:bg-border/64 after:absolute after:inset-y-0 after:w-px after:bg-border/64"
        />
        <div
          aria-hidden="true"
          className="before:-left-[11.5px] before:-ml-1 after:-right-[11.5px] after:-mr-1 container pointer-events-none fixed inset-0 z-45 before:absolute before:top-[calc(var(--header-height)-4.5px)] before:z-1 before:size-2 before:rounded-[2px] before:border before:border-border before:bg-popover before:bg-clip-padding before:shadow-xs after:absolute after:top-[calc(var(--header-height)-4.5px)] after:z-1 after:size-2 after:rounded-[2px] after:border after:border-border after:bg-background after:bg-clip-padding after:shadow-xs dark:after:bg-clip-border dark:before:bg-clip-border"
        />
        <Header />
        <main className="container mb-16 w-full flex-1 lg:mb-20 mx-auto">
          <HeroSection />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
