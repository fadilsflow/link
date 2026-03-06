import {
  ChevronDown,
  Copy,
  Home,
  Package,
  Paintbrush,
  Search,
  Settings,
  ShoppingBag,
  User as UserIcon,
  Wallet,
  ExternalLink,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import Credits from '../Credits'
import { toastManager } from '@/components/ui/toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { adminAuthQueryKey, useAdminAuthContext } from '@/lib/admin-auth'
import { BASE_URL } from '@/lib/constans'
import { cn } from '@/lib/utils'
import DashboardSearchCommand from '../dashboard-search-command'
import { LogoStudioSidebar } from '../kreasi-logo'
import { Kbd, KbdGroup } from '../ui/kbd'
import { Popover, PopoverPopup, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'

const data = {
  navBottom: [
    {
      icon: Settings,
      title: 'Settings',
      url: '/admin/settings',
    },
  ],
  navMain: [
    {
      title: 'Home',
      url: '/admin',
      icon: Home,
    },
    {
      title: 'Kreasi Page',
      url: '/admin/editor/profiles',
      icon: UserIcon,
    },
    {
      title: 'Appearance',
      url: '/admin/editor/appearance',
      icon: Paintbrush,
    },
    {
      title: 'Balance',
      url: '/admin/balance',
      icon: Wallet,
    },

  ],
  navMonetize: [
    {
      title: 'Products',
      url: '/admin/products',
      icon: Package,
    },
    {
      title: 'Orders',
      url: '/admin/orders',
      icon: ShoppingBag,
    },
  ]
}

const isAdminPage = (path: string, currentPath: string) => {
  if (path === '/admin') {
    return currentPath === '/admin' || currentPath === '/admin/'
  }
  return currentPath.startsWith(path)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const location = useRouterState({ select: (s) => s.location })

  const { data: adminAuth, isPending } = useAdminAuthContext()
  const username = adminAuth?.username ?? ''

  const handleCopyLink = async () => {
    if (!username) return
    await navigator.clipboard.writeText(`${BASE_URL}/${username}`)
    toastManager.add({
      title: 'Copied!',
      description: 'Link copied to clipboard',
    })
  }

  return (
    <Sidebar
      {...props}
      collapsible="icon"
      variant="inset"
      className="border-muted"
    >

      {isPending ? (null) : (
        <>
          <SidebarHeader className='p-4'>
            <SidebarMenu>
              <SidebarMenuItem className='ml-4'>
                <LogoStudioSidebar text='Kreasi' />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className='p-4' >

            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DashboardSearchCommand >
                    <SidebarMenuButton variant={'outline'} className='justify-between'>
                      <Search className='size-3' /> Search...
                      <KbdGroup  >
                        <Kbd>⌘</Kbd>
                        <Kbd>J</Kbd>
                      </KbdGroup>
                    </SidebarMenuButton>
                  </DashboardSearchCommand>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {data.navMain.map((item) => {
                    const isActive = isAdminPage(item.url, location.pathname)
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          size={'default'}
                          variant={'default'}
                          render={
                            <Link
                              to={item.url as any}
                              activeOptions={{
                                exact: item.url === '/admin',
                              }}
                            />
                          }
                          isActive={isActive}
                          className={cn(
                            'text-foreground',
                            isActive ? 'bg-white! shadow-sm' : ''
                          )}
                        >
                          <item.icon className={cn('h-4 w-4 mr-1', 'text-foreground', isActive ? 'text-primary' : '')} />
                          <span> {item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>
                Monetize
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {data.navMonetize.map((item) => {
                    const isActive = isAdminPage(item.url, location.pathname)
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          size={'default'}
                          variant={'default'}
                          render={
                            <Link
                              to={item.url as any}
                              activeOptions={{
                                exact: item.url === '/admin',
                              }}
                            />
                          }
                          isActive={isActive}
                          className={cn(
                            'text-foreground',
                            isActive ? 'bg-white! shadow-sm' : ''
                          )}
                        >
                          <item.icon className={cn('h-4 w-4 mr-1', 'text-foreground', isActive ? 'text-primary' : '')} />
                          <span> {item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>
                Settings
              </SidebarGroupLabel>
              <SidebarMenu>
                {username ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={
                        <Link
                          to={'/$username'}
                          params={{ username }}
                        />
                      }
                      className="text-foreground"
                    >
                      <ExternalLink />
                      View page
                    </SidebarMenuButton>
                    <SidebarMenuButton
                      onClick={handleCopyLink}
                      className="text-foreground"
                    >
                      <Copy />
                      Copy page link
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                {data.navBottom.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      size={'default'}
                      render={<Link to={item.url as any} />}
                      isActive={location.pathname === item.url}
                      className="text-foreground"
                    >
                      <item.icon className=" h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem >
                  <Credits />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className='p-4'>
            <SidebarMenuItem className="flex gap-3 items-center">
              <Popover>
                <PopoverTrigger render={<SidebarMenuButton size="default" />}>
                  <Avatar className="h-6 w-6 border-2 border-background ring ring-border">
                    <AvatarImage src={adminAuth?.image || ''} />
                    <AvatarFallback>
                      {adminAuth?.name?.slice(0, 2).toUpperCase() || 'US'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="truncate text-sm text-foreground">
                      {username || adminAuth?.name}
                    </h3>
                  </div>

                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                </PopoverTrigger>
                <PopoverPopup align="end" sideOffset={10} className="w-56">
                  <div className="flex items-center gap-3">
                    <Avatar className="border-2 border-background ring ring-border">
                      <AvatarImage src={adminAuth?.image || ''} />
                      <AvatarFallback>
                        {adminAuth?.name?.slice(0, 2).toUpperCase() || 'US'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium text-sm">{username || adminAuth?.name}</h4>
                      <div className="truncate text-muted-foreground text-xs">
                        {adminAuth?.email}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={'outline'}
                    className="mt-3 w-full"
                    size='sm'
                    onClick={async () => {
                      await authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            queryClient.removeQueries({
                              queryKey: adminAuthQueryKey(),
                            })
                            router.invalidate()
                            router.navigate({ to: '/' })
                          },
                        },
                      })
                    }}

                  >
                    Log out
                  </Button>
                </PopoverPopup>
              </Popover>
            </SidebarMenuItem>
          </SidebarFooter>
        </>
      )
      }
    </Sidebar >

  )
}
