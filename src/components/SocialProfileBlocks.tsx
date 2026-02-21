import { Globe } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { BlockRadius, BlockStyle } from '@/lib/block-styles'

import { Facebook } from '@/components/icon/facebook'
import { GitHub } from '@/components/icon/github'
import { Gmail } from '@/components/icon/gmail'
import { Instagram } from '@/components/icon/instagram'
import { LinkedIn } from '@/components/icon/linkedin'
import { WhatsApp } from '@/components/icon/whatsapp'
import { XformerlyTwitter } from '@/components/icon/x'
import { YouTube } from '@/components/icon/youtube'
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
  iconStyle?: CSSProperties,
) {
  switch (platform) {
    case 'instagram':
      return <Instagram className={getSocialBlockIconClasses()} style={iconStyle} />
    case 'youtube':
      return <YouTube className={getSocialBlockIconClasses()} style={iconStyle} />
    case 'email':
      return <Gmail className={getSocialBlockIconClasses()} style={iconStyle} />
    case 'whatsapp':
      return <WhatsApp className={getSocialBlockIconClasses()} style={iconStyle} />
    case 'twitter':
      return (
        <XformerlyTwitter
          className={cn(
            getSocialBlockIconClasses(),
            iconStyle ? '' : 'invert dark:invert-0',
          )}
          style={iconStyle}
        />
      )
    case 'linkedin':
      return <LinkedIn className={getSocialBlockIconClasses()} style={iconStyle} />
    case 'github':
      return (
        <GitHub
          className={cn(
            getSocialBlockIconClasses(),
            iconStyle ? '' : 'invert dark:invert-0',
          )}
          style={iconStyle}
        />
      )
    case 'facebook':
      return <Facebook className={getSocialBlockIconClasses()} style={iconStyle} />
    default:
      return <Globe className={getSocialBlockIconClasses()} style={iconStyle} />
  }
}

interface SocialProfileBlocksProps {
  links: Array<PublicSocialLink>
  blockStyle: BlockStyle
  blockRadius: BlockRadius
  cardStyle?: CSSProperties
  iconColor?: string
  className?: string
}

export function SocialProfileBlocks({
  links,
  blockStyle,
  blockRadius,
  cardStyle,
  iconColor,
  className,
}: SocialProfileBlocksProps) {
  const iconStyle = iconColor ? ({ color: iconColor } as CSSProperties) : undefined

  return (
    <div className={cn(getSocialBlocksWrapperClasses(), className)}>
      {links.map((link) => (
        <a
          key={link.id}
          href={getSocialUrl(link)}
          target={link.platform === 'email' ? undefined : '_blank'}
          rel={link.platform === 'email' ? undefined : 'noopener noreferrer'}
          className={getSocialBlockButtonClasses(blockStyle, blockRadius)}
          style={cardStyle}
          aria-label={link.platform || 'website'}
        >
          {getSocialIcon(link.platform, iconStyle)}
        </a>
      ))}
    </div>
  )
}
