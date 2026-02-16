import { Link } from '@tanstack/react-router'
import {
  Facebook,
  Github,
  Globe,
  Instagram,
  ShoppingCart,
  Youtube,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { SiteHeaderWrapper } from './site-header-wrapper'
import UserButton from './user-button'
import type { CSSProperties, ComponentType } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Gmail } from '@/components/icon/gmail'
import { LinkedIn } from '@/components/icon/linkedin'
import { XformerlyTwitter } from '@/components/icon/x'
import { WhatsApp } from '@/components/icon/whatsapp'
import { CartDrawer } from '@/components/cart-drawer'
import { useCartStore } from '@/store/cart-store'

type SocialPlatformIcon = {
  icon: ComponentType<{ className?: string; style?: CSSProperties }>
  color?: string
  className?: string
}

// Platform icon mapping
export const PLATFORM_ICONS: Partial<Record<string, SocialPlatformIcon>> = {
  twitter: { icon: XformerlyTwitter, className: 'invert dark:invert-0' },
  linkedin: { icon: LinkedIn },
  email: { icon: Gmail },
  instagram: { icon: Instagram, color: '#E4405F' },
  github: { icon: Github },
  youtube: { icon: Youtube, color: '#FF0000' },
  facebook: { icon: Facebook, color: '#1877F2' },
  whatsapp: { icon: WhatsApp },
}

export function getSocialIcon(platform: string) {
  const config = PLATFORM_ICONS[platform]
  if (!config) return <Globe className="h-5 w-5" />

  const Icon = config.icon
  return (
    <Icon
      className={cn('h-5 w-5', config.className)}
      style={config.color ? { color: config.color } : undefined}
    />
  )
}

export function getSocialUrl(link: { platform: string; url: string }) {
  if (link.platform === 'email') {
    return link.url.startsWith('mailto:') ? link.url : `mailto:${link.url}`
  }
  return link.url
}

export function ProfileBanner({
  isBanner,
  backgroundStyles,
  bannerUrl,
  userName,
}: {
  isBanner: boolean
  backgroundStyles: any
  bannerUrl?: string | null
  userName?: string | null
}) {
  if (!isBanner || !bannerUrl) {
    return <div className="h-[50px] md:h-[180px] w-full" />
  }

  return (
    <div
      className="relative h-[50px] md:h-[180px] w-full overflow-hidden"
      style={backgroundStyles}
    >
      <img
        src={bannerUrl}
        alt={`${userName} banner`}
        width={1440}
        height={180}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 " />
    </div>
  )
}

export function ProfileCard({
  user,
  isFullPageBg: _isFullPageBg,
  id,
  className,
  style,
}: {
  user: any
  isFullPageBg: boolean
  id?: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <Card
      id={id}
      className={cn('w-full overflow-visible', className)}
      style={style}
    >
      <CardContent className="relative">
        {/* Avatar - Overlapping top */}

        <div className="flex justify-between">
          <div className="space-y-4">
            <Avatar className="rounded-lg mb-2 h-15 w-15 md:h-20 md:w-20 border-2 border-background ring ring-primary/10">
              <AvatarImage src={user.image || '/avatar-placeholder.png'} />
              <AvatarFallback className="bg-muted text-2xl font-bold text-foreground">
                {user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1
                id="profile-name"
                className="flex items-center gap-2 text-2xl font-bold"
              >
                {user.name}
              </h1>
              {user.title && (
                <p className="mt-1 text-md text-muted-foreground">
                  {user.title}
                </p>
              )}
            </div>

            {user.bio && (
              <p className="max-w-md text-md leading-relaxed ">{user.bio}</p>
            )}
          </div>
        </div>
      </CardContent>

      {/* Social Links inside the card if needed, or keeping structure same as index.tsx */}
      {/* In index.tsx, social links were OUTSIDE the CardContent but INSIDE the wrapper? No, loops after Card. */}
      {/* Wait, index.tsx line 273 is OUTSIDE the Card (line 270 close tag). */}
      {/* User asked to make profile card and banner components. */}
      {/* If I follow index.tsx strictly, Social Links are separate. */}
      {/* I will implement SocialLinks component separately or include in ProfileCard? */}
      {/* The generic term "Profile Card" usually implies the box with info. Social links are often separate or inside. */}
      {/* In index.tsx, they are separate divs. I should make a SocialLinks component too or just export it. */}
    </Card>
  )
}

export function SocialLinks({
  socialLinks,
  className,
  style,
}: {
  socialLinks: Array<any>
  className?: string
  style?: CSSProperties
  isFullPageBg?: boolean
}) {
  if (socialLinks.length === 0) return null

  return (
    <div className="flex w-full justify-end gap-3">
      {socialLinks.map((link: any) => (
        <a
          key={link.id}
          href={getSocialUrl(link)}
          target={link.platform === 'email' ? undefined : '_blank'}
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            size="icon"
            className={cn(className)}
            style={style}
          >
            {getSocialIcon(link.platform)}
          </Button>
        </a>
      ))}
    </div>
  )
}

export default function SiteUserProfileHeader({
  avatarUrl,
  username,
}: {
  avatarUrl?: string
  username?: string
}) {
  const [show, setShow] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const totalItems = useCartStore((state) => state.getTotalItems())

  useEffect(() => {
    const handleScroll = () => {
      const nameElement = document.getElementById('profile-name')
      if (nameElement) {
        const rect = nameElement.getBoundingClientRect()
        // Determine threshold based on device (desktop usually has larger header area or user preference)
        const isDesktop = window.innerWidth >= 768
        const threshold = isDesktop ? 120 : 100

        if (rect.top < threshold) {
          setShow(true)
        } else {
          setShow(false)
        }
      } else {
        // Fallback to profile card if name element not found
        const profileCard = document.getElementById('profile-card-section')
        if (profileCard) {
          const rect = profileCard.getBoundingClientRect()
          if (rect.top < 20) {
            setShow(true)
          } else {
            setShow(false)
          }
        } else if (window.scrollY > 200) {
          setShow(true)
        } else {
          setShow(false)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <SiteHeaderWrapper
        className={cn(
          'fixed left-0 right-0 top-0 z-50 max-w-screen overflow-x-hidden px-2 transition-all duration-300',
          show
            ? 'bg-background shadow-[0_0_16px_0_black]/8 dark:shadow-[0_0_16px_0_black]/80'
            : 'bg-transparent shadow-none',
        )}
      >
        <div
          className="mx-auto flex h-17 items-center justify-between gap-2 px-2 transition-all duration-300 sm:gap-4 max-w-[760px]"
          data-header-container
        >
          <Link
            to="/"
            className={cn(
              'flex items-center transition-opacity duration-300',
              show ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <Avatar className="rounded-lg h-8 w-8 border-2 border-background ring ring-primary/10">
              <AvatarImage src={avatarUrl || '/avatar-placeholder.png'} />
              <AvatarFallback>{username}</AvatarFallback>
            </Avatar>
            <span className="ml-2 font-medium">{username}</span>
          </Link>
          <div
            className={cn(
              'flex gap-4 items-center transition-opacity duration-300',
              // On mobile (hidden show), we hide it. On desktop, we always show it.
              !show
                ? 'max-md:opacity-0 max-md:pointer-events-none'
                : 'opacity-100',
            )}
          >
            <UserButton />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </SiteHeaderWrapper>
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
