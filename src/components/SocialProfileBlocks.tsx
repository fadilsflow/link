import type { CSSProperties } from 'react'
import { Globe } from 'lucide-react'

import { Facebook } from '@/components/icon/facebook'
import { GitHub } from '@/components/icon/github'
import { Gmail } from '@/components/icon/gmail'
import { Instagram } from '@/components/icon/instagram'
import { LinkedIn } from '@/components/icon/linkedin'
import { WhatsApp } from '@/components/icon/whatsapp'
import { XformerlyTwitter } from '@/components/icon/x'
import { YouTube } from '@/components/icon/youtube'
import type { BlockRadius, BlockStyle } from '@/lib/block-styles'
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

function getSocialIcon(platform?: string | null) {
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
      return (
        <XformerlyTwitter
          className={cn(getSocialBlockIconClasses(), 'invert dark:invert-0')}
        />
      )
    case 'linkedin':
      return <LinkedIn className={getSocialBlockIconClasses()} />
    case 'github':
      return (
        <GitHub className={cn(getSocialBlockIconClasses(), 'invert dark:invert-0')} />
      )
    case 'facebook':
      return <Facebook className={getSocialBlockIconClasses()} />
    default:
      return <Globe className={getSocialBlockIconClasses()} />
  }
}

interface SocialProfileBlocksProps {
  links: Array<PublicSocialLink>
  blockStyle: BlockStyle
  blockRadius: BlockRadius
  cardStyle?: CSSProperties
  className?: string
}

export function SocialProfileBlocks({
  links,
  blockStyle,
  blockRadius,
  cardStyle,
  className,
}: SocialProfileBlocksProps) {
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
          {getSocialIcon(link.platform)}
        </a>
      ))}
    </div>
  )
}
