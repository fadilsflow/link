import * as React from 'react'
import { ArrowUpRight, Link2Icon } from 'lucide-react'

import type { AppearanceBackgroundType } from '@/lib/appearance'
import { getReadableTextTokensForBackground } from '@/lib/appearance'
import { getBlockTypeConfigOrDefault } from '@/lib/block-type-config'
import { getBlockSkeletonClasses } from '@/lib/block-styles'
import { cn } from '@/lib/utils'

export interface PublicProfileBlock {
  id: string
  title: string
  url?: string | null
  type?: string | null
  content?: string | null
}

interface PublicProfileBlocksProps {
  areBlocksReady: boolean
  blocks: Array<PublicProfileBlock>
  cardBase: string
  cardBaseWithHover: string
  radiusClass: string
  actionRadiusClass: string
  isInteractive?: boolean
  cardStyle?: React.CSSProperties
  iconBackgroundColor?: string
  backgroundType?: AppearanceBackgroundType | null
  backgroundGradientTop?: string | null
  backgroundGradientBottom?: string | null
  onOpenBlockUrl: (block: PublicProfileBlock) => void
  onTrackClick: (blockId: string) => void
  renderVideoBlock: (block: PublicProfileBlock) => React.ReactNode
  renderProductBlock: (block: PublicProfileBlock) => React.ReactNode
}

function getTelegramUrl(username?: string | null): string | null {
  const trimmed = username?.trim() || ''
  if (!trimmed) return null
  return `https://t.me/${trimmed.replace(/^@+/, '')}`
}

export function PublicProfileBlocks({
  areBlocksReady,
  blocks,
  cardBase,
  cardBaseWithHover,
  radiusClass,
  actionRadiusClass,
  isInteractive = true,
  cardStyle,
  iconBackgroundColor,
  backgroundType,
  backgroundGradientTop,
  backgroundGradientBottom,
  onOpenBlockUrl,
  onTrackClick,
  renderVideoBlock,
  renderProductBlock,
}: PublicProfileBlocksProps) {
  // Calculate icon wrapper style based on background type
  let iconWrapperStyle: React.CSSProperties | undefined

  if (
    backgroundType === 'gradient' &&
    backgroundGradientTop &&
    backgroundGradientBottom
  ) {
    // Use gradient background
    iconWrapperStyle = {
      background: `linear-gradient(to bottom, ${backgroundGradientTop}, ${backgroundGradientBottom})`,
    }
  } else if (backgroundType === 'flat' && iconBackgroundColor) {
    // Use flat color
    const iconTokens = getReadableTextTokensForBackground(iconBackgroundColor)
    iconWrapperStyle = {
      backgroundColor: iconBackgroundColor,
      '--foreground': iconTokens.foreground,
      '--muted-foreground': iconTokens.mutedForeground,
    } as React.CSSProperties
  } else if (backgroundType === 'avatar-blur' || backgroundType === 'image') {
    // For avatar-blur or image, use a subtle semi-transparent background
    iconWrapperStyle = {
      backgroundColor: 'rgba(0, 0, 0, 0)',
    }
  } else if (iconBackgroundColor) {
    // Default: use flat color with readable text tokens
    const iconTokens = getReadableTextTokensForBackground(iconBackgroundColor)
    iconWrapperStyle = {
      backgroundColor: iconBackgroundColor,
      '--foreground': iconTokens.foreground,
      '--muted-foreground': iconTokens.mutedForeground,
    } as React.CSSProperties
  }

  const sharedIconWrapClass = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full  ${actionRadiusClass}`
  const sharedRowClass =
    'grid grid-cols-[2.5rem_1fr_2rem] items-center gap-3 p-2'

  const renderActionBlock = (params: {
    key: string
    title: string
    icon: React.ReactNode
    onClick: () => void
    arrowClassName?: string
  }) => (
    <div
      key={params.key}
      className={cn(
        'w-full overflow-hidden',
        isInteractive ? 'group cursor-pointer transition-all' : 'cursor-default',
        isInteractive ? cardBaseWithHover : cardBase,
        actionRadiusClass,
      )}
      style={cardStyle}
      onClick={isInteractive ? params.onClick : undefined}
    >
      <div className={sharedRowClass}>
        <div className={sharedIconWrapClass} style={iconWrapperStyle}>
          {params.icon}
        </div>
        <span className="text-center text-md font-semibold text-foreground">{params.title}</span>
        <ArrowUpRight
          className={cn(
            'h-5 w-5 text-muted-foreground',
            isInteractive && params.arrowClassName,
          )}
        />
      </div>
    </div>
  )

  if (!areBlocksReady) {
    return blocks.map((block) => (
      <div key={block.id} className={getBlockSkeletonClasses(block.type)} />
    ))
  }

  return blocks.map((block) => {
    if (block.type === 'text') {
      return (
        <div
          key={block.id}
          className={cn('text-left w-full',)}
        >
          <h2 className="text-md font-bold text-foreground">
            {block.title}
          </h2>
          {block.content && (
            <p className="text-sm  text-foreground">{block.content}</p>
          )}
        </div>
      )
    }

    if (block.type === 'image') {
      return (
        <div
          key={block.id}
          className={cn(
            'w-full overflow-hidden',
            cardBaseWithHover,
            radiusClass,
            block.url && isInteractive && 'cursor-pointer',
          )}
          style={cardStyle}
          onClick={block.url && isInteractive ? () => onOpenBlockUrl(block) : undefined}
        >
          {block.content && (
            <div className="relative w-full overflow-hidden bg-muted">
              <img
                loading="lazy"
                decoding="async"
                width={1200}
                height={900}
                src={block.content}
                alt="Image block"
                className={cn(
                  'h-auto w-full',
                  block.url && isInteractive && 'cursor-pointer',
                )}
              />
            </div>
          )}
        </div>
      )
    }

    if (block.type === 'video') {
      return renderVideoBlock(block)
    }

    if (block.type === 'product') {
      return renderProductBlock(block)
    }

    if (block.type === 'telegram') {
      const telegramUrl = getTelegramUrl(block.content)
      if (!telegramUrl) return null

      const IconComponent = getBlockTypeConfigOrDefault('telegram').icon

      return renderActionBlock({
        key: block.id,
        title: block.title || 'Telegram',
        icon: <IconComponent className="h-5 w-5 text-foreground" />,
        onClick: () => {
          onTrackClick(block.id)
          window.open(telegramUrl, '_blank', 'noopener,noreferrer')
        },
      })
    }

    if (block.type === 'discord' && !block.url) {
      return null
    }

    const iconType = block.type === 'discord' ? 'discord' : 'link'
    const IconComponent = getBlockTypeConfigOrDefault(iconType).icon

    return renderActionBlock({
      key: block.id,
      title: block.title || (block.type === 'discord' ? 'Discord' : 'Link'),
      icon:
        block.type === 'discord' ? (
          <IconComponent className="h-5 w-5 text-foreground" />
        ) : (
          <Link2Icon className="h-5 w-5 -rotate-45 text-foreground" />
        ),
      onClick: () => onOpenBlockUrl(block),
    })
  })
}

