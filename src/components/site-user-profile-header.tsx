import { Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Facebook,
  Github,
  Globe,
  Instagram,
  Link as LinkIcon,
  ShoppingCart,
  Youtube,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { SiteHeaderWrapper } from './site-header-wrapper'
import UserButton from './user-button'
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

// Platform icon mapping
export const PLATFORM_ICONS: Record<
  string,
  { icon: any; color?: string; className?: string }
> = {
  twitter: { icon: XformerlyTwitter, className: 'invert' },
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
  if (config) {
    const Icon = config.icon
    return (
      <Icon
        className={cn('h-5 w-5', config.className)}
        style={config.color ? { color: config.color } : undefined}
      />
    )
  }
  return <Globe className="h-5 w-5" />
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
}: {
  isBanner: boolean
  backgroundStyles: any
}) {
  if (!isBanner) return null

  return (
    <div
      className="relative h-[180px] w-full bg-cover bg-center"
      style={backgroundStyles}
    >
      <div className="absolute inset-0 bg-black/10"></div>
    </div>
  )
}

export function ProfileCard({
  user,
  isFullPageBg,
  id,
}: {
  user: any
  isFullPageBg: boolean
  id?: string
}) {
  return (
    <Card
      id={id}
      className='w-full overflow-visible'
    >
      <CardContent className="relative">
        {/* Avatar - Overlapping top */}

        <div className="flex justify-between">
          <div className="space-y-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight">
                {user.name}
              </h1>
              {user.title && <p className="mt-1 text-">{user.title}</p>}
            </div>

            {user.bio && (
              <p className="max-w-md text-sm leading-relaxed ">{user.bio}</p>
            )}
          </div>
          <Avatar className="mb-2 h-15 w-15 md:h-24 md:w-24 border-2 ring-2 ring-white/50 bg-black">
            <AvatarImage src={user.image || '/avatar-placeholder.png'} />
            <AvatarFallback className="bg-black text-2xl font-bold text-white">
              {user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
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
  isFullPageBg,
}: {
  socialLinks: Array<any>
  isFullPageBg: boolean
}) {
  if (!socialLinks || socialLinks.length === 0) return null

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
          >
            {getSocialIcon(link.platform)}
          </Button>
        </a>
      ))
      }
    </div >
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
      const profileCard = document.getElementById('profile-card-section')
      if (profileCard) {
        const rect = profileCard.getBoundingClientRect()
        // Show header content when profile card hits the header area
        if (rect.top < 40) {
          setShow(true)
        } else {
          setShow(false)
        }
      } else {
        // Fallback based on scrollY if element not updated/found
        if (window.scrollY > 150) {
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
          className={cn(
            'mx-auto flex h-17 items-center justify-between gap-2 px-2 transition-all duration-300 sm:gap-4 md:max-w-170',
            show ? '' : 'border-transparent',
          )}
          data-header-container
        >
          <Link
            to="/"
            className={cn(
              'flex items -center transition-opacity duration-300',
              show ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <Avatar className=" h-8 w-8 rounded-md border-2 ring-2 ring-white/50 bg-black">
              <AvatarImage src={avatarUrl || '/avatar-placeholder.png'} />
              <AvatarFallback>{username}</AvatarFallback>
            </Avatar>
            <span className="ml-2 font-medium">{username}</span>
          </Link>
          {/* <UserButton /> */}
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
      </SiteHeaderWrapper>
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
