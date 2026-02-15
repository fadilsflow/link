import * as React from 'react'
import { Link, useParams, useRouterState } from '@tanstack/react-router'
import {
  BarChart3,
  Grid,
  Home,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  User,
  Wallet,
} from 'lucide-react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type AdminNavItem = {
  title: string
  url: '/$username/admin' | '/$username/admin/editor/profiles' | '/$username/admin/editor/appearance' | '/$username/admin/products' | '/$username/admin/orders' | '/$username/admin/balance' | '/$username/admin/analytics' | '/$username/admin/settings'
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navItems: Array<AdminNavItem> = [
  { title: 'Home', url: '/$username/admin', icon: Home },
  { title: 'Profile', url: '/$username/admin/editor/profiles', icon: User },
  { title: 'Appearance', url: '/$username/admin/editor/appearance', icon: Grid },
  { title: 'Products', url: '/$username/admin/products', icon: Package },
  { title: 'Orders', url: '/$username/admin/orders', icon: ShoppingBag },
  { title: 'Balance', url: '/$username/admin/balance', icon: Wallet },
  { title: 'Analytics', url: '/$username/admin/analytics', icon: BarChart3 },
  { title: 'Settings', url: '/$username/admin/settings', icon: Settings },
]

const quickNav: Array<AdminNavItem> = [
  navItems[0],
  navItems[3],
  navItems[4],
  navItems[6],
]

function isActivePath(path: string, currentPath: string) {
  if (path === '/$username/admin') {
    return currentPath.endsWith('/admin') || currentPath.endsWith('/admin/')
  }

  return currentPath.includes(path.replace('/$username', ''))
}

export function MobileAdminNav() {
  const { username } = useParams({ strict: false })
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const params = { username: username ?? '' }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 md:hidden">
      <nav className="mx-auto grid h-16 max-w-2xl grid-cols-5 px-2">
        {quickNav.map((item) => {
          const active = isActivePath(item.url, pathname)
          return (
            <Link
              key={item.title}
              to={item.url}
              params={params}
              preload="intent"
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground transition-colors',
                active && 'text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          )
        })}

        <Sheet>
          <SheetTrigger className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-[11px] text-muted-foreground">
            <Menu className="h-4 w-4" />
            <span>More</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Admin navigation</SheetTitle>
            </SheetHeader>
            <div className="mt-4 grid grid-cols-2 gap-2 pb-4">
              {navItems.map((item) => {
                const active = isActivePath(item.url, pathname)
                return (
                  <SheetClose
                    key={item.title}
                    render={
                      <Link
                        to={item.url}
                        params={params}
                        preload="intent"
                        className={cn(
                          'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                          active && 'border-primary text-primary bg-primary/5',
                        )}
                      />
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SheetClose>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}
