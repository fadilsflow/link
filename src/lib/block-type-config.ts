import type { SVGProps } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link2Icon, Package2, TypeIcon, ImageIcon } from 'lucide-react'
import { Discord } from '@/components/icon/discord'
import { Instagram } from '@/components/icon/instagram'
import { TelegramColor } from '@/components/icon/telegram'
import { Threads } from '@/components/icon/threads'
import { TikTokColor } from '@/components/icon/tiktok'
import { XformerlyTwitter } from '@/components/icon/x'
import { YouTubeColor } from '@/components/icon/youtube'

export type BlockType =
  | 'link'
  | 'text'
  | 'image'
  | 'video'
  | 'product'
  | 'discord'
  | 'telegram'
  | 'threads'
  | 'instagram'
  | 'tiktok'
  | 'twitter'

export const SOCIAL_BLOCK_TYPES = [
  'discord',
  'telegram',
  'threads',
  'instagram',
  'tiktok',
  'twitter',
] as const

export type SocialBlockType = (typeof SOCIAL_BLOCK_TYPES)[number]

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.ReactNode

export interface BlockTypeConfig {
  type: BlockType
  icon: LucideIcon | IconComponent
  iconBgColor?: string
  title: string
  description: string
  iconColor: string
}

export interface SocialBlockStyle {
  iconBackgroundColor: string
  iconClassName: string
}

const SOCIAL_BLOCK_STYLE_MAP: Record<SocialBlockType, SocialBlockStyle> = {
  discord: {
    iconBackgroundColor: '#5865F2',
    iconClassName: 'text-white',
  },
  telegram: {
    iconBackgroundColor: '#2AABEE',
    iconClassName: 'text-white',
  },
  threads: {
    iconBackgroundColor: '#000000',
    iconClassName: 'text-white',
  },
  instagram: {
    iconBackgroundColor: '#000000',
    iconClassName: 'text-white',
  },
  tiktok: {
    iconBackgroundColor: '#000000',
    iconClassName: 'text-white',
  },
  twitter: {
    iconBackgroundColor: '#000000',
    iconClassName: 'text-white',
  },
}

/**
 * Configuration for available block types.
 * Add new block types here to extend the selector and block items.
 */
export const BLOCK_TYPE_CONFIG: BlockTypeConfig[] = [
  {
    type: 'link',
    icon: Link2Icon,
    title: 'Custom Link',
    iconColor: 'text-white -rotate-45',
    iconBgColor: 'bg-yellow-500',
    description: 'Add any links of your website, campaign or content.',
  },
  {
    type: 'product',
    icon: Package2,
    iconColor: 'text-indigo-500 fill-white',
    iconBgColor: 'bg-indigo-500',
    title: 'Product',
    description: 'Feature one product from your existing catalog',
  },
  {
    type: 'text',
    icon: TypeIcon,
    title: 'Title & Description',
    iconColor: 'text-white',
    iconBgColor: 'bg-sky-500',
    description: 'Organize your links with a title and description',
  },
  {
    type: 'image',
    icon: ImageIcon,
    title: 'Image',
    iconColor: 'text-lime-500 fill-white',
    iconBgColor: 'bg-lime-500',
    description: 'Upload and display custom image.',
  },
  {
    type: 'video',
    icon: YouTubeColor,
    iconColor: '',
    title: 'Youtube',
    description: 'Share your channel and showcase videos.',
  },
  {
    type: 'discord',
    icon: Discord,
    iconColor: 'text-white',
    iconBgColor: 'bg-[#5865F2]',
    title: 'Discord',
    description: 'Share your Discord community invite.',
  },
  {
    type: 'telegram',
    icon: TelegramColor,
    iconColor: 'text-white',
    iconBgColor: 'bg-[#2AABEE]',
    title: 'Telegram',
    description: 'Share your Telegram username.',
  },
  {
    type: 'threads',
    icon: Threads,
    iconColor: 'text-white',
    iconBgColor: 'bg-zinc-900',
    title: 'Threads',
    description: 'Share your Threads profile.',
  },
  {
    type: 'instagram',
    icon: Instagram,
    iconColor: 'text-white',
    iconBgColor: 'bg-[#E1306C]',
    title: 'Instagram',
    description: 'Share your Instagram username.',
  },
  {
    type: 'tiktok',
    icon: TikTokColor,
    iconColor: 'text-white',
    iconBgColor: 'bg-black',
    title: 'TikTok',
    description: 'Share your TikTok profile.',
  },
  {
    type: 'twitter',
    icon: XformerlyTwitter,
    iconColor: 'text-white',
    iconBgColor: 'bg-black',
    title: 'X / Twitter',
    description: 'Share your X (Twitter) profile.',
  },
]

/**
 * Get block type configuration by type.
 */
export function getBlockTypeConfig(
  type: BlockType,
): BlockTypeConfig | undefined {
  return BLOCK_TYPE_CONFIG.find((config) => config.type === type)
}

/**
 * Get block type configuration by type with fallback to link config.
 */
export function getBlockTypeConfigOrDefault(
  type: string | undefined,
): BlockTypeConfig {
  return (
    BLOCK_TYPE_CONFIG.find((config) => config.type === type) ??
    BLOCK_TYPE_CONFIG.find((config) => config.type === 'link')!
  )
}

export function isSocialBlockType(
  type: string | null | undefined,
): type is SocialBlockType {
  return SOCIAL_BLOCK_TYPES.includes(type as SocialBlockType)
}

export function getSocialBlockStyle(type: SocialBlockType): SocialBlockStyle {
  return SOCIAL_BLOCK_STYLE_MAP[type]
}

export function getSocialBlockUrl(
  type: SocialBlockType,
  value?: string | null,
): string | null {
  const trimmed = value?.trim() || ''
  if (!trimmed) return null
  const username = trimmed.replace(/^@+/, '')

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  const baseUrlMap: Record<SocialBlockType, string> = {
    discord: 'https://discord.gg/',
    telegram: 'https://t.me/',
    threads: 'https://threads.net/@',
    instagram: 'https://instagram.com/',
    tiktok: 'https://www.tiktok.com/@',
    twitter: 'https://x.com/',
  }

  return `${baseUrlMap[type]}${username}`
}
