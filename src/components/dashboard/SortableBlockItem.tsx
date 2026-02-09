import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { LinkBlock } from './blocks/LinkBlock'
import { TextBlock } from './blocks/TextBlock'
import { ImageBlock } from './blocks/ImageBlock'
import { VideoBlock } from './blocks/VideoBlock'
import { ProductBlock } from './blocks/ProductBlock'
import { StatusBadge } from './StatusBadge'
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
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex items-center w-full group"
    >
      <div
        className={cn(
          'flex-1 flex rounded-xl border overflow-hidden transition-all duration-300 bg-white shadow-sm hover:shadow-md',
          block.syncStatus === 'error' ? 'border-red-500' : 'border-border',
          block.type === 'text' ? 'bg-yellow-50/10' : 'bg-green-50/10',
        )}
      >
        <Card className="border-0 rounded-none w-full bg-transparent">
          <CardContent className="flex items-center p-4 sm:p-6">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center pr-4 cursor-grab touch-none"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
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

      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 pointer-events-none">
        <StatusBadge status={block.syncStatus} />
      </div>
    </div>
  )
}
