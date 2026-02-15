import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router'
import React from 'react'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { MobileAdminNav } from '@/components/dashboard/mobile-admin-nav'
import { Spinner } from '@/components/ui/spinner'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { useApplyRootTheme, useDashboardThemePreference } from '@/lib/theme'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [dashboardTheme] = useDashboardThemePreference()
  useApplyRootTheme('dashboard', undefined, dashboardTheme)

  React.useEffect(() => {
    if (!isPending && !session?.user) {
      router.navigate({ to: '/' })
    }
  }, [isPending, router, session?.user])

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
