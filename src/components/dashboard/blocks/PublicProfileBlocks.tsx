import * as React from 'react'
import { ArrowUpRight, Link2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
  cardStyle?: React.CSSProperties
  iconBackgroundColor?: string
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
  cardStyle,
  iconBackgroundColor,
  onOpenBlockUrl,
  onTrackClick,
  renderVideoBlock,
  renderProductBlock,
}: PublicProfileBlocksProps) {
  const iconTokens = getReadableTextTokensForBackground(iconBackgroundColor)
  const iconWrapperStyle = iconBackgroundColor
    ? ({
      backgroundColor: iconBackgroundColor,
      '--foreground': iconTokens.foreground,
      '--muted-foreground': iconTokens.mutedForeground,
    } as React.CSSProperties)
    : undefined
  const sharedIconWrapClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/80 '
  const sharedRowClass =
    'grid grid-cols-[2.5rem_1fr_1.25rem] items-center gap-3 p-4'

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
        'group w-full cursor-pointer overflow-hidden transition-all',
        cardBaseWithHover,
        radiusClass,
      )}
      style={cardStyle}
      onClick={params.onClick}
    >
      <div className={sharedRowClass}>
        <div className={sharedIconWrapClass} style={iconWrapperStyle}>
          {params.icon}
        </div>
        <span className="text-center text-sm font-semibold text-foreground" >{params.title}</span>
        <ArrowUpRight
          className={cn('h-5 w-5 text-muted-foreground', params.arrowClassName)}
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
          className={cn('w-full min-h-16 space-y-1 p-4 text-center', cardBase, radiusClass)}
          style={cardStyle}
        >
          <h2 className="text-2xl font-bold text-foreground">
            {block.title}
          </h2>
          {block.content && (
            <p className="text-sm text-foreground">{block.content}</p>
          )}
        </div>
      )
    }

    if (block.type === 'image') {
      return (
        <div
          key={block.id}
          className={cn('w-full overflow-hidden', cardBase, radiusClass)}
          style={cardStyle}
        >
          {block.content && (
            <div className="relative w-full overflow-hidden bg-muted aspect-4/3">
              <img
                loading="lazy"
                decoding="async"
                width={1200}
                height={900}
                src={block.content}
                alt="Image block"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          )}
          {block.url && (
            <div className="px-3 pb-3">
              <Button className="w-full" onClick={() => onOpenBlockUrl(block)}>
                Open link
              </Button>
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
        arrowClassName:
          'transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5',
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
