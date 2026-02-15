import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import React from 'react'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { MobileAdminNav } from '@/components/dashboard/mobile-admin-nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { checkOnboardingStatus } from '@/lib/onboarding-server'
import { useApplyRootTheme, useDashboardThemePreference } from '@/lib/theme'

export const Route = createFileRoute('/$username/admin')({
  beforeLoad: async ({ params }) => {
    const status = await checkOnboardingStatus()

    if (!status.isLoggedIn || !status.user.username) {
      throw redirect({ to: '/' })
    }

    if (status.user.username !== params.username) {
      throw redirect({
        to: '/$username/admin',
        params: { username: status.user.username },
      })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const [dashboardTheme] = useDashboardThemePreference()
  useApplyRootTheme('dashboard', undefined, dashboardTheme)

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '220px',
          '--sidebar-width-icon': '64px',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="pb-20 md:pb-0 @container/main">
        <Outlet />
      </SidebarInset>
      <MobileAdminNav />
    </SidebarProvider>
  )
}
