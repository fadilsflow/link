import {
  BarChart3,
  ChevronDown,
  CircleHelp,
  Copy,
  ExternalLink,
  Grid,
  Home,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingBag,
  User as UserIcon,
  Wallet,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import Credits from '../Credits'
import { Button } from '../ui/button'
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '../ui/menu'
import { toastManager } from '@/components/ui/toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { adminAuthQueryKey, useAdminAuthContext } from '@/lib/admin-auth'
import { BASE_URL } from '@/lib/constans'

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
      title: 'Profile',
      url: '/admin/editor/profiles',
      icon: UserIcon,
    },
    {
      title: 'Appearance',
      url: '/admin/editor/appearance',
      icon: Grid,
    },
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
    {
      title: 'Balance',
      url: '/admin/balance',
      icon: Wallet,
    },
    {
      title: 'Analytics',
      url: '/admin/analytics',
      icon: BarChart3,
    },
  ],
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

  const { data: adminAuth } = useAdminAuthContext()
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
      variant="sidebar"
      className="border-muted"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex gap-3 items-center mt-3">
            <Menu>
              <MenuTrigger render={<SidebarMenuButton size="default" />}>
                <Avatar className="h-6 w-6 border">
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
              </MenuTrigger>
              <MenuPopup className={'w-40'}>
                <MenuItem render={<Link to={'/'} rel="noopener noreferrer" />}>
                  <UserIcon className="h-3 w-3" />
                  Account
                </MenuItem>
                <MenuItem
                  render={
                    <Link to={'/'} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <CircleHelp className="h-3 w-3" />
                  Help
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  onClick={async () => {
                    await authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          queryClient.removeQueries({
                            queryKey: adminAuthQueryKey(),
                          })
                          router.invalidate()
                          router.navigate({ to: '/login' })
                        },
                      },
                    })
                  }}
                  className="text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </MenuItem>
              </MenuPopup>
            </Menu>

            <SidebarMenuButton render={<Button size="icon" variant="ghost" />}>
              <Search />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
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
                    className="text-foreground"
                  >
                    <item.icon className=" h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {username ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={
                  <Link
                    to={'/$username'}
                    params={{ username }}
                    search={{ tab: 'profile' }}
                  />
                }
                className="text-foreground"
              >
                <ExternalLink />
                View Public page
              </SidebarMenuButton>
              <SidebarMenuButton
                onClick={handleCopyLink}
                className="text-foreground"
              >
                <Copy />
                Copy Public page link
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
          <SidebarMenuItem>
            <Credits />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
