import { Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Globe,
  Link as LinkIcon,
  Instagram,
  Github,
  Youtube,
  Facebook,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Gmail } from '@/components/icon/gmail'
import { LinkedIn } from '@/components/icon/linkedin'
import { XformerlyTwitter } from '@/components/icon/x'
import { WhatsApp } from '@/components/icon/whatsapp'
import { SiteHeaderWrapper } from './site-header-wrapper'
import { useEffect, useState } from 'react'
import UserButton from './user-button'

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
      className={cn(
        'w-full overflow-visible',
        isFullPageBg
          ? 'rounded-2xl border-none bg-white/95 shadow-2xl backdrop-blur-md'
          : 'rounded-2xl border-none',
      )}
    >
      <CardContent className="relative rounded-2xl bg-white px-6 pb-8 pt-0 lg:px-8">
        {/* Avatar - Overlapping top */}
        <div className="-mt-12 mb-4 flex justify-start">
          <Avatar className="h-24 w-24 border-4 border-white shadow-md ring-4 ring-white/50 bg-black">
            <AvatarImage src={user.image || '/avatar-placeholder.png'} />
            <AvatarFallback className="bg-black text-2xl font-bold text-white">
              {user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight">
              {user.name}
            </h1>
            {user.title && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {user.title}
              </p>
            )}
          </div>

          {user.bio && (
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              {user.bio}
            </p>
          )}
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
  socialLinks: any[]
  isFullPageBg: boolean
}) {
  if (!socialLinks || socialLinks.length === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
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
            className={cn(
              'h-12 w-12 rounded-full border-none shadow-sm transition-all hover:scale-105 active:scale-95',
              isFullPageBg
                ? 'bg-white/90 text-slate-700 backdrop-blur-sm hover:bg-white'
                : 'bg-white text-slate-700 hover:bg-gray-50',
            )}
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
          'mx-auto flex h-17 items-center justify-between gap-2 px-2 transition-all duration-300 sm:gap-4 md:max-w-[680px]',
          show ? '' : 'border-transparent',
        )}
        data-header-container
      >
        <Link
          to="/"
          className={cn(
            'flex items-center transition-opacity duration-300',
            show ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
        >
          <Avatar>
            <AvatarImage src={avatarUrl || '/avatar-placeholder.png'} />
            <AvatarFallback>{username}</AvatarFallback>
          </Avatar>
          <span className="ml-2 font-medium">{username}</span>
        </Link>
        <UserButton />
      </div>
    </SiteHeaderWrapper>
  )
}
