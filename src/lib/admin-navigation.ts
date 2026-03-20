import {
  ExternalLink,
  Home,
  Package,
  Paintbrush,
  Plus,
  Settings,
  ShoppingBag,
  User,
  Wallet,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

export type AdminRoutePath =
  | '/admin'
  | '/admin/balance'
  | '/admin/editor/appearance'
  | '/admin/editor/profiles'
  | '/admin/orders'
  | '/admin/products'
  | '/admin/products/new'
  | '/admin/settings'

export type AdminNavItem = {
  title: string
  url: AdminRoutePath
  icon: ComponentType<SVGProps<SVGSVGElement>>
  section: 'main' | 'monetize' | 'other'
  keywords?: Array<string>
}

export const adminNavigationItems: Array<AdminNavItem> = [
  {
    title: 'Home',
    url: '/admin',
    icon: Home,
    section: 'main',
    keywords: ['dashboard', 'overview', 'analytics summary'],
  },
  {
    title: 'Kreasi Page',
    url: '/admin/editor/profiles',
    icon: User,
    section: 'main',
    keywords: ['profile', 'bio', 'links', 'blocks', 'editor'],
  },
  {
    title: 'Appearance',
    url: '/admin/editor/appearance',
    icon: Paintbrush,
    section: 'main',
    keywords: ['theme', 'design', 'banner', 'style', 'customize'],
  },
  {
    title: 'Balance',
    url: '/admin/balance',
    icon: Wallet,
    section: 'main',
    keywords: ['earnings', 'payout', 'withdraw', 'finance', 'transactions'],
  },
  {
    title: 'Products',
    url: '/admin/products',
    icon: Package,
    section: 'monetize',
    keywords: ['offers', 'digital products', 'catalog'],
  },
  {
    title: 'Orders',
    url: '/admin/orders',
    icon: ShoppingBag,
    section: 'monetize',
    keywords: ['sales', 'customers', 'purchases'],
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: Settings,
    section: 'other',
    keywords: ['preferences', 'account', 'security'],
  },
]

export const adminCommandRouteItems: Array<AdminNavItem> = [
  ...adminNavigationItems,
  {
    title: 'New Product',
    url: '/admin/products/new',
    icon: Plus,
    section: 'monetize',
    keywords: ['create product', 'new listing', 'sell'],
  },
]

export const adminUtilityItems = {
  copyPageLink: {
    title: 'Copy page link',
    icon: ExternalLink,
    keywords: ['copy url', 'share page', 'public profile'],
  },
  openPublicPage: {
    title: 'Open public page',
    icon: ExternalLink,
    keywords: ['visit profile', 'open profile', 'public url'],
  },
} as const
