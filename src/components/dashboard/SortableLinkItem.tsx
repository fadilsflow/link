import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'

interface LinkItemProps {
  link: {
    id: string
    title: string
    url: string
    isEnabled: boolean
    syncStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
    errors?: { title?: string; url?: string }
  }
  handleLinkUpdate?: (id: string, field: string, value: any) => void
  handleDeleteLink?: (id: string) => void
  isOverlay?: boolean
}

export function SortableLinkItem({
  link,
  handleLinkUpdate,
  handleDeleteLink,
}: LinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const status = link.syncStatus || 'saved'
  const errors = link.errors || {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-stretch bg-background border border-border/60 rounded-2xl transition-all duration-200 overflow-hidden',
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
              Link Block
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/30 border border-border/20">
              <span className="text-[10px] font-medium text-muted-foreground">
                Enabled
              </span>
              <input
                type="checkbox"
                checked={link.isEnabled}
                className="w-3.5 h-3.5 rounded-sm border-muted-foreground/30 accent-zinc-900 cursor-pointer"
                onChange={(e) =>
                  handleLinkUpdate?.(link.id, 'isEnabled', e.target.checked)
                }
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
              onClick={() => handleDeleteLink?.(link.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="space-y-1">
            <Input
              key={`title-${link.id}`}
              defaultValue={link.title}
              placeholder="Link Title"
              className={cn(
                'h-9 bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium',
                errors.title &&
                  'border border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/30',
              )}
              onChange={(e) =>
                handleLinkUpdate?.(link.id, 'title', e.target.value)
              }
            />
            {errors.title && (
              <p className="text-[10px] text-destructive font-medium px-1">
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Input
              key={`url-${link.id}`}
              defaultValue={link.url}
              placeholder="url (e.g. https://github.com)"
              className={cn(
                'h-9 bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-xs text-muted-foreground',
                errors.url &&
                  'border border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/30',
              )}
              onChange={(e) =>
                handleLinkUpdate?.(link.id, 'url', e.target.value)
              }
            />
            {errors.url && (
              <p className="text-[10px] text-destructive font-medium px-1">
                {errors.url}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Status Badge */}
      <StatusBadge
        status={status}
        className="w-24 border-l border-border/30 h-auto"
      />
    </div>
  )
}
