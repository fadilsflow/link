import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router'
import React from 'react'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { MobileAdminNav } from '@/components/dashboard/mobile-admin-nav'
import { Spinner } from '@/components/ui/spinner'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  // Redirect only after loading selesai
  React.useEffect(() => {
    if (!isPending && !session?.user) {
      router.navigate({ to: '/login' })
    }
  }, [isPending, session, router])

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
        {isPending ? (
          <div className="flex h-full min-h-[60vh] items-center justify-center">
            <Spinner className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : (
          <Outlet />
        )}
      </SidebarInset>

      <MobileAdminNav />
    </SidebarProvider>
  )
}