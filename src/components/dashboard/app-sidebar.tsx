import {
  ChevronDown,
  Search,
  ExternalLink,
  Copy
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { adminAuthQueryKey, useAdminAuthContext } from '@/lib/admin-auth'
import { adminNavigationItems } from '@/lib/admin-navigation'
import { cn } from '@/lib/utils'
import DashboardSearchCommand from '../dashboard-search-command'
import { LogoStudioSidebar } from '../kreasi-logo'
import { Kbd, KbdGroup } from '../ui/kbd'
import { Popover, PopoverPopup, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'

const data = {
  navBottom: adminNavigationItems.filter((item) => item.section === 'other'),
  navMain: adminNavigationItems.filter((item) => item.section === 'main'),
  navMonetize: adminNavigationItems.filter((item) => item.section === 'monetize'),
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

  return (
    <Sidebar
      {...props}
      collapsible="offcanvas"
      variant="inset"
      className="border-muted"
    >

      {isPending ? (null) : (
        <>
          <SidebarHeader className=' px-4'>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem className='ml-1' >
                    <LogoStudioSidebar text='Studio' />
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarHeader>

          <SidebarContent className='px-4' >

            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <DashboardSearchCommand >
                      <SidebarMenuButton variant={'outline'} className='flex justify-between'>
                        <Search />
                        <span> Search...</span>
                        <KbdGroup  >
                          <Kbd>⌘</Kbd>
                          <Kbd>J</Kbd>
                        </KbdGroup>
                      </SidebarMenuButton>
                    </DashboardSearchCommand>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
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
                            isActive ? 'bg-background! shadow-sm' : ''
                          )}
                        >
                          <item.icon className={cn('h-4 w-4 mr-1', 'text-foreground', isActive ? 'text-primary' : '')} />
                          <span> {item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
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
                            isActive ? 'bg-background! shadow-sm' : ''
                          )}
                        >
                          <item.icon className={cn('h-4 w-4 mr-1', 'text-foreground', isActive ? 'text-primary' : '')} />
                          <span> {item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
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
                    </SidebarMenuItem>
                  ) : null}
                </SidebarMenu>
              </SidebarGroupContent>
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
