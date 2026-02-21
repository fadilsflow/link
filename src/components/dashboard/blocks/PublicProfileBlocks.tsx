import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
  onOpenBlockUrl,
  onTrackClick,
  renderVideoBlock,
  renderProductBlock,
}: PublicProfileBlocksProps) {
  if (!areBlocksReady) {
    return blocks.map((block) => (
      <div key={block.id} className={getBlockSkeletonClasses(block.type)} />
    ))
  }

  return blocks.map((block) => {
    if (block.type === 'text') {
      return (
        <div key={block.id} className="w-full space-y-1 py-2 text-center min-h-16">
          <h2 className={cn('text-2xl font-bold', 'text-foreground')}>
            {block.title}
          </h2>
          {block.content && (
            <p className={cn('text-sm', 'text-foreground')}>{block.content}</p>
          )}
        </div>
      )
    }

    if (block.type === 'image') {
      return (
        <Card
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
        </Card>
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

      return (
        <Card
          key={block.id}
          className={cn(
            'group w-full cursor-pointer overflow-hidden transition-all min-h-20',
            cardBaseWithHover,
            radiusClass,
          )}
          style={cardStyle}
          onClick={() => {
            onTrackClick(block.id)
            window.open(telegramUrl, '_blank', 'noopener,noreferrer')
          }}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-muted/80">
                <IconComponent className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">{block.title || 'Telegram'}</span>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </Card>
      )
    }

    if (block.type === 'discord' && !block.url) {
      return null
    }

    const iconType = block.type === 'discord' ? 'discord' : 'link'
    const IconComponent = getBlockTypeConfigOrDefault(iconType).icon

    return (
      <Card
        key={block.id}
        className={cn(
          'group w-full cursor-pointer overflow-hidden transition-all min-h-20',
          cardBaseWithHover,
          radiusClass,
        )}
        style={cardStyle}
        onClick={() => onOpenBlockUrl(block)}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-muted/80">
              <IconComponent className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">
              {block.title || (block.type === 'discord' ? 'Discord' : 'Link')}
            </span>
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </Card>
    )
  })
}
