import type { SVGProps } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link2Icon, Package2, TypeIcon, ImageIcon } from 'lucide-react'
import { Discord } from '@/components/icon/discord'
import { Telegram } from '@/components/icon/telegram'
import { YouTube } from '@/components/icon/youtube'

export type BlockType =
  | 'link'
  | 'text'
  | 'image'
  | 'video'
  | 'product'
  | 'discord'
  | 'telegram'

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.ReactNode

export interface BlockTypeConfig {
  type: BlockType
  icon: LucideIcon | IconComponent
  iconBgColor?: string
  title: string
  description: string
  iconColor: string
  bgColor: string
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
    bgColor: 'bg-yellow-100/20',
    description: 'Add any links of your website, campaign or content.',
  },
  {
    type: 'product',
    icon: Package2,
    iconColor: 'text-indigo-500 fill-white',
    iconBgColor: 'bg-indigo-500',
    bgColor: 'bg-indigo-100/20',
    title: 'Product',
    description: 'Feature one product from your existing catalog',
  },
  {
    type: 'text',
    icon: TypeIcon,
    title: 'Title & Description',
    iconColor: 'text-white',
    iconBgColor: 'bg-sky-500',
    bgColor: 'bg-sky-100/20',
    description: 'Organize your links with a title and description',
  },
  {
    type: 'image',
    icon: ImageIcon,
    title: 'Image',
    iconColor: 'text-lime-500 fill-white',
    iconBgColor: 'bg-lime-500',
    bgColor: 'bg-lime-100/20',
    description: 'Upload and display custom image.',
  },
  {
    type: 'video',
    icon: YouTube,
    iconColor: '',
    bgColor: 'bg-rose-100/20',
    title: 'Youtube',
    description: 'Share your channel and showcase videos.',
  },
  {
    type: 'discord',
    icon: Discord,
    iconColor: '',
    bgColor: 'bg-violet-100/20',
    title: 'Discord',
    description: 'Share your Discord community invite.',
  },
  {
    type: 'telegram',
    icon: Telegram,
    iconColor: '',
    bgColor: 'bg-sky-100/20',
    title: 'Telegram',
    description: 'Share your Telegram username.',
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
