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
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from '@/components/ui/progress'
import { authClient } from '@/lib/auth-client'
import { Link, useParams } from '@tanstack/react-router'

const data = {
  navMini: [
    { icon: Compass, label: 'Explore' },
    { icon: LayoutGrid, label: 'Dashboards' },
  ],
  navMiniBottom: [
    { icon: Gift, label: "What's New" },
    { icon: CircleHelp, label: 'Help' },
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
    {
      title: 'Settings',
      url: '/$username/admin/settings',
      icon: Settings,
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
            <SidebarMenuButton size="default">
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
                  className="data-[status=active]:bg-zinc-100/80 data-[status=active]:text-zinc-900"
                >
                  <item.icon className="mr-2.5 h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-50 bg-zinc-50/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 hover:text-zinc-900 cursor-pointer group uppercase tracking-wider">
            <span className="flex items-center gap-1">
              Usage
              <ChevronRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>

          <div className="space-y-3.5 mt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] items-center">
                <span className="flex items-center gap-1 font-bold text-zinc-600">
                  <Activity className="h-3 w-3" /> Events
                </span>
                <span className="text-zinc-400 font-bold">34 of 1K</span>
              </div>
              <Progress value={3.4}>
                <ProgressTrack className="h-1 bg-zinc-100">
                  <ProgressIndicator className="bg-blue-500" />
                </ProgressTrack>
              </Progress>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] items-center">
                <span className="flex items-center gap-1 font-bold text-zinc-600">
                  <Link2 className="h-3 w-3" /> Links
                </span>
                <span className="text-zinc-400 font-bold">0 of 25</span>
              </div>
              <Progress value={0}>
                <ProgressTrack className="h-1 bg-zinc-100">
                  <ProgressIndicator className="bg-blue-500" />
                </ProgressTrack>
              </Progress>
            </div>
          </div>

          <p className="text-[9px] font-bold text-zinc-400/80">
            Resets Feb 4, 2026
          </p>

          <Button className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-9 text-[11px] font-bold rounded-lg mt-1 shadow-sm transition-all active:scale-[0.98]">
            Upgrade to Pro
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
