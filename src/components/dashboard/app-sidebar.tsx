import {
  Activity,
  BarChart3,
  Compass,
  Folder,
  Gift,
  Globe,
  LayoutGrid,
  Link2,
  Search,
  Tag,
  Users,
  FileText,
  ChevronRight,
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
import { Button } from '@/components/ui/button'
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
import { Link, useParams } from '@tanstack/react-router'
import Credits from '../Credits'

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
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()
  const { username } = useParams({ strict: false })

  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="default" className='mt-3'>
              <Avatar className="h-7 w-7 border border-white ring-1 ring-zinc-100 shadow-sm">
                <AvatarImage src={session?.user.image || ''} />
                <AvatarFallback className="bg-zinc-900 text-white text-[9px] font-bold">
                  {session?.user.name?.slice(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-xs font-bold text-zinc-900 truncate">
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
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  size={'default'}
                  render={<Link to={item.url} />}
                  isActive={false}
                  className="data-[status=active]:bg-zinc-200/80 data-[status=active]:text-zinc-900"
                >
                  <item.icon className=" h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <ExternalLink />
              View Public page
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Copy />
              Copy Public page link
            </SidebarMenuButton>
            {data.navBottom.map((item) => (
              <SidebarMenuButton
                key={item.title}
                size={'default'}
                render={<Link to={item.url} />}
                isActive={false}
                className="data-[status=active]:bg-zinc-200/80 data-[status=active]:text-zinc-900"
              >
                <item.icon className=" h-4 w-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            ))}
          </SidebarMenuItem>
          <Credits />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
