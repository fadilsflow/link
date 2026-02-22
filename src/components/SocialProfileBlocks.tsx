import { Globe } from 'lucide-react'
import type { CSSProperties } from 'react'

import { Facebook } from '@/components/icon/facebook'
import { GitHub } from '@/components/icon/github'
import { Gmail } from '@/components/icon/gmail'
import { Instagram } from '@/components/icon/instagram'
import { LinkedIn } from '@/components/icon/linkedin'
import { WhatsApp } from '@/components/icon/whatsapp'
import { XformerlyTwitter } from '@/components/icon/x'
import { YouTube } from '@/components/icon/youtube'
import { getReadableTextTokensForBackground } from '@/lib/appearance'
import {
  getSocialBlockButtonClasses,
  getSocialBlockIconClasses,
  getSocialBlocksWrapperClasses,
} from '@/lib/social-block-styles'
import { cn } from '@/lib/utils'

export type PublicSocialLink = {
  id: string
  platform?: string | null
  url: string
}

function getSocialUrl(link: PublicSocialLink): string {
  if (link.platform === 'email') {
    return link.url.startsWith('mailto:') ? link.url : `mailto:${link.url}`
  }
  return link.url
}

function getSocialIcon(
  platform?: string | null,
) {
  switch (platform) {
    case 'instagram':
      return <Instagram className={getSocialBlockIconClasses()} />
    case 'youtube':
      return <YouTube className={getSocialBlockIconClasses()} />
    case 'email':
      return <Gmail className={getSocialBlockIconClasses()} />
    case 'whatsapp':
      return <WhatsApp className={getSocialBlockIconClasses()} />
    case 'twitter':
      return <XformerlyTwitter className={getSocialBlockIconClasses()} />
    case 'linkedin':
      return <LinkedIn className={getSocialBlockIconClasses()} />
    case 'github':
      return <GitHub className={getSocialBlockIconClasses()} />
    case 'facebook':
      return <Facebook className={getSocialBlockIconClasses()} />
    default:
      return <Globe className={getSocialBlockIconClasses()} />
  }
}

interface SocialProfileBlocksProps {
  links: Array<PublicSocialLink>
  iconBackgroundColor?: string
  className?: string
}

export function SocialProfileBlocks({
  links,
  iconBackgroundColor,
  className,
}: SocialProfileBlocksProps) {
  const iconTokens = getReadableTextTokensForBackground(iconBackgroundColor)
  const iconWrapperStyle = iconBackgroundColor
    ? ({
        backgroundColor: iconBackgroundColor,
        '--foreground': iconTokens.foreground,
        '--muted-foreground': iconTokens.mutedForeground,
      } as CSSProperties)
    : undefined

  return (
    <div className={cn(getSocialBlocksWrapperClasses(), className)}>
      {links.map((link) => (
        <a
          key={link.id}
          href={getSocialUrl(link)}
          target={link.platform === 'email' ? undefined : '_blank'}
          rel={link.platform === 'email' ? undefined : 'noopener noreferrer'}
          className={getSocialBlockButtonClasses()}
          style={iconWrapperStyle}
          aria-label={link.platform || 'website'}
        >
          {getSocialIcon(link.platform)}
        </a>
      ))}
    </div>
  )
}
