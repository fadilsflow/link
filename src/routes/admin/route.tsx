import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import React from 'react'
import type { AdminAuthContextData } from '@/lib/admin-auth'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { MobileAdminNav } from '@/components/dashboard/mobile-admin-nav'
import { Spinner } from '@/components/ui/spinner'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { adminAuthQueryKey } from '@/lib/admin-auth'
import { authClient } from '@/lib/auth-client'
import { getServerAuthContext } from '@/lib/auth-server'
import { useApplyRootTheme, useDashboardThemePreference } from '@/lib/theme'

const getAdminRouteAccess = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await getServerAuthContext()
  })

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    const access = await getAdminRouteAccess()

    if (!access.isAuthenticated || !access.user.username) {
      throw redirect({ to: '/' })
    }

    const authData: AdminAuthContextData = {
      userId: access.user.id,
      username: access.user.username,
      name: access.user.name,
      email: access.user.email,
      image: access.user.image ?? null,
    }

    context.queryClient.setQueryData(adminAuthQueryKey(), authData)

    return authData
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { data: session, isPending } = authClient.useSession()
  const [dashboardTheme] = useDashboardThemePreference()
  useApplyRootTheme('dashboard', undefined, dashboardTheme)

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

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
