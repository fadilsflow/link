import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChartNoAxesColumn, GripVertical, MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { cn } from '@/lib/utils'
import { getBlockTypeConfigOrDefault } from '@/lib/block-type-config'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface ProductOption {
  id: string
  title: string
}

interface BlockItemProps {
  block: {
    id: string
    title: string
    url: string
    type?: string
    content?: string
    clicks?: number
    isEnabled: boolean
    syncStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
    errors?: { title?: string; url?: string; content?: string }
  }
  products?: Array<ProductOption>
  handleEditBlock?: (id: string) => void
  handleToggleEnabled?: (id: string, isEnabled: boolean) => void
  isOverlay?: boolean
}

export function SortableBlockItem({
  block,
  products,
  handleEditBlock,
  handleToggleEnabled,
}: BlockItemProps) {
  const [enabled, setEnabled] = useState(block.isEnabled)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    // opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const blockConfig = getBlockTypeConfigOrDefault(block.type)
  const IconComponent = blockConfig.icon
  const productTitle =
    block.type === 'product'
      ? products?.find((p) => p.id === block.content)?.title
      : undefined

  const contentSummary: string =
    block.type === 'link'
      ? block.url || 'No URL'
      : block.type === 'text'
        ? block.content || 'No description'
        : block.type === 'image'
          ? block.content
            ? 'Image selected'
            : 'No image selected'
          : block.type === 'video'
            ? block.content || 'No video URL'
            : block.type === 'product'
              ? productTitle || 'No product selected'
              : block.type === 'discord'
                ? block.url || 'No invite URL'
                : block.type === 'telegram'
                  ? block.content
                    ? `@${block.content}`
                    : 'No username'
                  : block.type === 'threads'
                    ? block.content
                      ? `@${block.content}`
                      : 'No username'
                    : block.type === 'instagram'
                      ? block.content
                        ? `@${block.content}`
                        : 'No username'
                      : block.type === 'tiktok'
                        ? block.content
                          ? `@${block.content}`
                          : 'No username'
                        : block.type === 'twitter'
                          ? block.content
                            ? `@${block.content}`
                            : 'No username'
                          : ''

  useEffect(() => {
    setEnabled(block.isEnabled)
  }, [block.isEnabled])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleSwitchChange = (nextEnabled: boolean) => {
    setEnabled(nextEnabled)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      handleToggleEnabled?.(block.id, nextEnabled)
      debounceRef.current = null
    }, 300)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex items-center w-full group"
    >
      <Card
        className={cn(
          'w-full shadow-none',
          block.syncStatus === 'error' ? 'border-red-500' : 'border-border',
          // blockConfig.bgColor,
        )}
      >
        <CardContent className="flex items-center gap-4 p-4 sm:p-5">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center cursor-grab touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>

          <div
            className={`p-1 border-2 ${blockConfig.iconBgColor || 'bg-muted'} border-white ring-1 ring-border rounded-md flex items-center justify-center`}
          >
            <IconComponent className={cn(blockConfig.iconColor, 'h-4 w-4')} />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-semibold">
              {block.title || blockConfig.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {contentSummary}
            </p>
            <div className="flex gap-1 items-center">
              <ChartNoAxesColumn className="w-[12px] h-[12px]" />
              <p className="text-[12px] text-foreground">{block.clicks ?? 0}</p>
            </div>
          </div>

          <Switch checked={enabled} onCheckedChange={handleSwitchChange} />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEditBlock?.(block.id)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
