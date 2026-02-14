import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Image,
  LinkIcon,
  Package,
  PlaySquare,
  Text,
} from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { LinkBlock } from './blocks/LinkBlock'
import { TextBlock } from './blocks/TextBlock'
import { ImageBlock } from './blocks/ImageBlock'
import { VideoBlock } from './blocks/VideoBlock'
import { ProductBlock } from './blocks/ProductBlock'
// import { StatusBadge } from './StatusBadge'
import { cn } from '@/lib/utils'

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
    isEnabled: boolean
    syncStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
    errors?: { title?: string; url?: string; content?: string }
  }
  products?: Array<ProductOption>
  handleBlockUpdate?: (id: string, field: string, value: any) => void
  handleDeleteBlock?: (id: string) => void
  isOverlay?: boolean
}

export function SortableBlockItem({
  block,
  products,
  handleBlockUpdate,
  handleDeleteBlock,
}: BlockItemProps) {
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
  const icon =
    block.type === 'text' ? (
      <Text className="text-blue-500" />
    ) : block.type === 'image' ? (
      <Image className="text-green-500" />
    ) : block.type === 'video' ? (
      <PlaySquare className="text-red-500" />
    ) : block.type === 'product' ? (
      <Package className="bg-yellow-500" />
    ) : block.type === 'link' ? (
      <LinkIcon />
    ) : null

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
          block.type == 'text'
            ? 'bg-blue-50/80 dark:bg-blue-500/20'
            : block.type == 'image'
              ? 'bg-green-50 dark:bg-green-500/20'
            : block.type == 'video'
                ? 'bg-red-50 dark:bg-red-500/20'
                : block.type == 'product'
                  ? 'bg-yellow-50 dark:bg-yellow-500/20'
                  : 'bg-gray-50 dark:bg-gray-500/20',
        )}
      >
        <CardContent className="flex items-center gap-4 sm:p-6">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center cursor-grab touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>

          <div
            className={cn(
              'rounded-sm h-5 w-5 flex items-center justify-center border border-background ring ring-primary/20',
              block.type == 'text'
                ? 'bg-blue-50 dark:bg-blue-500/20'
                : block.type == 'image'
                  ? 'bg-green-50 dark:bg-green-500/20'
                  : block.type == 'video'
                    ? 'bg-red-50 dark:bg-red-500/20'
                    : block.type == 'product'
                      ? 'bg-yellow-50 dark:bg-yellow-500/20'
                      : 'bg-gray-50 dark:bg-gray-500/20',
            )}
          >
            {icon}
          </div>

          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {block.type === 'text' ? (
              <TextBlock
                block={block as any}
                handleUpdate={handleBlockUpdate as any}
                handleDelete={handleDeleteBlock as any}
              />
            ) : block.type === 'image' ? (
              <ImageBlock
                block={block as any}
                handleUpdate={handleBlockUpdate as any}
                handleDelete={handleDeleteBlock as any}
              />
            ) : block.type === 'video' ? (
              <VideoBlock
                block={block as any}
                handleUpdate={handleBlockUpdate as any}
                handleDelete={handleDeleteBlock as any}
              />
            ) : block.type === 'product' ? (
              <ProductBlock
                block={block as any}
                products={products || []}
                handleUpdate={handleBlockUpdate as any}
                handleDelete={handleDeleteBlock as any}
              />
            ) : (
              <LinkBlock
                block={block as any}
                handleUpdate={handleBlockUpdate as any}
                handleDelete={handleDeleteBlock as any}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
