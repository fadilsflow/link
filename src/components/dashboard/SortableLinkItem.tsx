import { useEffect, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Trash2,
  CheckCircle2,
  XCircle,
  CircleEllipsis,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface LinkItemProps {
  link: {
    id: string
    title: string
    url: string
    isEnabled: boolean
    syncStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
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
  const [showStatus, setShowStatus] = useState(true)

  useEffect(() => {
    if (link.syncStatus === 'saved') {
      const timer = setTimeout(() => setShowStatus(false), 2000)
      return () => clearTimeout(timer)
    }
    setShowStatus(true)
  }, [link.syncStatus])

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
          <Input
            key={`title-${link.id}`}
            defaultValue={link.title}
            placeholder="Link Title"
            className="h-9 bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium"
            onBlur={(e) => handleLinkUpdate?.(link.id, 'title', e.target.value)}
          />

          <Input
            key={`url-${link.id}`}
            defaultValue={link.url}
            placeholder="url (e.g. https://github.com)"
            className="h-9 bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-xs text-muted-foreground"
            onBlur={(e) => handleLinkUpdate?.(link.id, 'url', e.target.value)}
          />
        </div>
      </div>

      {/* Right Status Badge */}
      <div
        className={cn(
          'w-24 flex flex-col items-center justify-center gap-1.5 border-l border-border/30 transition-all duration-300',
          status === 'saved' && showStatus && 'bg-emerald-50/30 opacity-100',
          status === 'saved' &&
            !showStatus &&
            'bg-transparent opacity-0 w-0 border-none',
          status === 'saving' && 'bg-zinc-50/50 opacity-100 w-24',
          (status === 'unsaved' || status === 'error') &&
            'bg-amber-50/30 opacity-100 w-24',
        )}
      >
        {status === 'saved' && showStatus && (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in fade-in zoom-in duration-300" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
              Saved
            </span>
          </>
        )}
        {status === 'saving' && (
          <>
            <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
              Saving
            </span>
          </>
        )}
        {(status === 'unsaved' || status === 'error') && (
          <>
            <XCircle className="h-5 w-5 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">
              Unsaved
            </span>
          </>
        )}
      </div>
    </div>
  )
}
