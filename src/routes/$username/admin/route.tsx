import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import React from 'react'
import { z } from 'zod'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { MobileAdminNav } from '@/components/dashboard/mobile-admin-nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getAdminAccessForUsername } from '@/lib/auth-server'
import { useApplyRootTheme, useDashboardThemePreference } from '@/lib/theme'

const getAdminRouteAccess = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ username: z.string() }))
  .handler(async ({ data }) => {
    return await getAdminAccessForUsername(data.username)
  })

export const Route = createFileRoute('/$username/admin')({
  ssr: false,
  loaderDeps: ({ params }) => ({ username: params.username }),
  loader: async ({ deps }) => {
    const access = await getAdminRouteAccess({
      data: { username: deps.username },
    })

    if (!access.ok) {
      if (access.reason === 'WRONG_OWNER' && access.expectedUsername) {
        throw redirect({
          to: '/$username/admin',
          params: { username: access.expectedUsername },
        })
      }

      throw redirect({ to: '/' })
    }

    return access
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
