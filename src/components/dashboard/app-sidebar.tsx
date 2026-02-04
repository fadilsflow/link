import {
  BarChart3,
  CircleHelp,
  ArrowRightLeft,
  User as UserIcon,
  Grid,
  Settings,
  Package,
  Copy,
  ExternalLink,
} from 'lucide-react'

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
import { Link, useParams, useRouterState } from '@tanstack/react-router'
import Credits from '../Credits'
import { BASE_URL } from '@/lib/constans'
import { toastManager } from '../ui/toast'

const data = {
  navBottom: [
    {
      icon: Settings,
      title: 'Settings',
      url: '/$username/admin/settings',
    },
    {
      icon: CircleHelp,
      title: 'Help',
      url: '/$username/admin/help',
    },
  ],
  navMain: [
    {
      title: 'Profile',
      url: '/$username/admin',
      icon: UserIcon,
    },
    {
      title: 'Appearance',
      url: '/$username/admin/appearance',
      icon: Grid,
    },
    {
      title: 'Products',
      url: '/$username/admin/products',
      icon: Package,
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
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="default" className="mt-3">
              <Avatar className="h-7 w-7 border border-white ring-1 ring-zinc-100 shadow-sm">
                <AvatarImage src={session?.user.image || ''} />
                <AvatarFallback className="bg-zinc-900 text-white text-[9px] font-bold">
                  {session?.user.name?.slice(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-xs font-bold text-foreground truncate">
                  {username || session?.user.name}
                </h3>
                <p className="text-[9px] font-medium text-zinc-400">Personal</p>
              </div>
              <ArrowRightLeft className="h-3 w-3 text-zinc-400" />
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
                    className="data-[active=true]:bg-zinc-200/80 text-foreground"
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
                className="data-[active=true]:bg-zinc-200/80 text-foreground"
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
