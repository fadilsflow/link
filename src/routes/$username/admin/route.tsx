import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import React from 'react'
import { z } from 'zod'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { MobileAdminNav } from '@/components/dashboard/mobile-admin-nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { adminAuthQueryOptions } from '@/lib/admin-auth'
import { useApplyRootTheme, useDashboardThemePreference } from '@/lib/theme'

const getAdminRouteAccess = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ username: z.string() }))
  .handler(async ({ data }) => {
    return await getAdminAccessForUsername(data.username)
  })

export const Route = createFileRoute('/$username/admin')({
  loaderDeps: ({ params }) => ({ username: params.username }),
  loader: async ({ context, deps }) => {
    try {
      const auth = await context.queryClient.ensureQueryData(
        adminAuthQueryOptions(deps.username),
      )
      return auth
    } catch {
      throw redirect({ to: '/' })
    }
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  shouldReload: false,
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
