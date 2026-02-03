import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LinkBlock } from './blocks/LinkBlock'
import { TextBlock } from './blocks/TextBlock'

interface BlockItemProps {
  block: {
    id: string
    title: string
    url: string
    type?: string
    content?: string
    isEnabled: boolean
    syncStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
    errors?: { title?: string; url?: string }
  }
  handleBlockUpdate?: (id: string, field: string, value: any) => void
  handleDeleteBlock?: (id: string) => void
  isOverlay?: boolean
}

export function SortableBlockItem({
  block,
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
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const status = block.syncStatus || 'saved'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-stretch bg-background border border-border/60 rounded-2xl transition-colors duration-200 overflow-hidden',
        isDragging && 'shadow-2xl ring-2 ring-primary/20',
        status === 'saved' && 'border-emerald-100/50',
        status === 'unsaved' && 'border-amber-100/50',
      )}
    >
      {/* Left Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center px-2 cursor-grab active:cursor-grabbing hover:bg-muted/50 border-r border-border/30 text-muted-foreground transition-colors touch-none"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 pr-3 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {block.type === 'text' ? 'Text Block' : 'Link Block'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/30 border border-border/20">
              <span className="text-[10px] font-medium text-muted-foreground">
                Enabled
              </span>
              <input
                type="checkbox"
                checked={block.isEnabled}
                className="w-3.5 h-3.5 rounded-sm border-muted-foreground/30 accent-zinc-900 cursor-pointer"
                onChange={(e) =>
                  handleBlockUpdate?.(block.id, 'isEnabled', e.target.checked)
                }
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
              onClick={() => handleDeleteBlock?.(block.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {block.type === 'text' ? (
          <TextBlock
            block={block as any}
            handleUpdate={handleBlockUpdate as any}
          />
        ) : (
          <LinkBlock
            block={block as any}
            handleUpdate={handleBlockUpdate as any}
          />
        )}
      </div>

      {/* Right Status Badge */}
      <StatusBadge
        status={status}
        className="w-24 border-l border-border/30 h-auto"
      />
    </div>
  )
}
