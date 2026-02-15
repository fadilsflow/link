import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
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
  url:
    | '/admin'
    | '/admin/editor/profiles'
    | '/admin/editor/appearance'
    | '/admin/products'
    | '/admin/orders'
    | '/admin/balance'
    | '/admin/analytics'
    | '/admin/settings'
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navItems: Array<AdminNavItem> = [
  { title: 'Home', url: '/admin', icon: Home },
  { title: 'Profile', url: '/admin/editor/profiles', icon: User },
  { title: 'Appearance', url: '/admin/editor/appearance', icon: Grid },
  { title: 'Products', url: '/admin/products', icon: Package },
  { title: 'Orders', url: '/admin/orders', icon: ShoppingBag },
  { title: 'Balance', url: '/admin/balance', icon: Wallet },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
]

const quickNav: Array<AdminNavItem> = [
  navItems[0],
  navItems[3],
  navItems[4],
  navItems[6],
]

function isActivePath(path: string, currentPath: string) {
  if (path === '/admin') {
    return currentPath === '/admin' || currentPath === '/admin/'
  }

  return currentPath.startsWith(path)
}

export function MobileAdminNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 md:hidden">
      <nav className="mx-auto grid h-16 max-w-2xl grid-cols-5 px-2">
        {quickNav.map((item) => {
          const active = isActivePath(item.url, pathname)
          return (
            <Link
              key={item.title}
              to={item.url}
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
