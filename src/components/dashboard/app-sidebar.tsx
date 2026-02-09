import {
  ArrowDown,
  ArrowRightLeft,
  BarChart3,
  ChevronDown,
  CircleHelp,
  Copy,
  ExternalLink,
  Grid,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingBag,
  User as UserIcon,
} from 'lucide-react'

import {
  Link,
  useParams,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
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
import { BASE_URL } from '@/lib/constans'
import Credits from '../Credits'
import { Button } from '../ui/button'
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '../ui/menu'

const data = {
  navBottom: [
    {
      icon: Settings,
      title: 'Settings',
      url: '/$username/admin/settings',
    },
  ],
  navMain: [
    {
      title: 'Profile',
      url: '/$username/admin/editor/profiles',
      icon: UserIcon,
    },
    {
      title: 'Appearance',
      url: '/$username/admin/editor/appearance',
      icon: Grid,
    },
    {
      title: 'Products',
      url: '/$username/admin/products',
      icon: Package,
    },
    {
      title: 'Orders',
      url: '/$username/admin/orders',
      icon: ShoppingBag,
    },
    {
      title: 'Analytics',
      url: '/$username/admin/analytics',
      icon: BarChart3,
    },
  ],
}
const isAdminpage = (path: string, currentPath: string) => {
  if (path === '/$username/admin') {
    return currentPath.endsWith('/admin') || currentPath.endsWith('/admin/')
  }
  return currentPath.includes(path.replace('/$username', ''))
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { username } = useParams({ strict: false })
  const location = useRouterState({ select: (s) => s.location })

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${BASE_URL}/${username}`)
    toastManager.add({
      title: 'Copied!',
      description: 'Link copied to clipboard',
    })
  }
  return (
    <Sidebar {...props} collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex gap-3 items-center mt-3">
            <Menu>
              <MenuTrigger render={<SidebarMenuButton size="default" />}>
                <Avatar className="h-7 w-7 border">
                  <AvatarImage src={session?.user.image || ''} />
                  <AvatarFallback>
                    {session?.user.name?.slice(0, 2).toUpperCase() || 'US'}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 text-left">
                  <h3 className="truncate text-sm text-foreground">
                    {username || session?.user.name}
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
                          router.invalidate()
                          router.navigate({ to: '/' })
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
              const isActive = isAdminpage(item.url, location.pathname)
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    size={'default'}
                    variant={'default'}
                    render={
                      <Link
                        to={item.url as any}
                        params={{ username } as any}
                        activeOptions={{
                          exact: item.url === '/$username/admin',
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
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to={'/$username'} params={{ username } as any} />}
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
          {data.navBottom.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                size={'default'}
                render={
                  <Link to={item.url as any} params={{ username } as any} />
                }
                isActive={
                  location.pathname ===
                  item.url.replace('/$username', `/${username}`)
                }
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
