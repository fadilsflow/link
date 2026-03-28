import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import React from 'react'
import { LogoStudioSidebar } from '@/components/kreasi-logo'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'
import { authClient } from '@/lib/auth-client'
import { useSuperAdminAuthContext } from '@/lib/super-admin-auth'

const tabs = [
  { value: '/superadmin', label: 'Dashboard' },
  { value: '/superadmin/payouts', label: 'Payouts' },
  { value: '/superadmin/settings', label: 'Settings' },
] as const

export const Route = createFileRoute('/superadmin')({
  component: SuperAdminLayout,
})

function SuperAdminLayout() {
  const router = useRouter()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session, isPending } = authClient.useSession()
  const {
    data: superAdmin,
    isPending: isSuperAdminPending,
    isError: isSuperAdminError,
  } = useSuperAdminAuthContext(Boolean(session?.user))

  const activeTab =
    tabs.find((t) => t.value !== '/superadmin' && location.pathname.startsWith(t.value))?.value ??
    '/superadmin'

  React.useEffect(() => {
    if (!isPending && !session?.user) {
      router.navigate({ to: '/login' })
    }
  }, [isPending, session, router])

  React.useEffect(() => {
    if (
      !isSuperAdminPending &&
      session?.user &&
      (isSuperAdminError || !superAdmin?.isAdmin)
    ) {
      router.navigate({ to: '/' })
    }
  }, [isSuperAdminError, isSuperAdminPending, router, session, superAdmin])

  if (isPending || isSuperAdminPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 pt-6">
          <LogoStudioSidebar text="ADMIN." />
          <Tabs
            value={activeTab}
            onValueChange={(value) => navigate({ to: value as string })}
          >
            <TabsList variant="underline">
              {tabs.map((tab) => (
                <TabsTab key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTab>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
