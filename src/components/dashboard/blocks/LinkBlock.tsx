import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface LinkBlockProps {
  block: {
    id: string
    title: string
    url: string
    errors?: { title?: string; url?: string }
  }
  handleUpdate: (id: string, field: string, value: any) => void
}

export function LinkBlock({ block, handleUpdate }: LinkBlockProps) {
  const errors = block.errors || {}

  return (
    <div className="grid gap-3">
      <div className="space-y-1">
        <Input
          key={`title-${block.id}`}
          defaultValue={block.title}
          placeholder="Link Title"
          className={cn(
            'h-9 bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium',
            errors.title &&
              'border border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/30',
          )}
          onChange={(e) => handleUpdate(block.id, 'title', e.target.value)}
        />
        {errors.title && (
          <p className="text-[10px] text-destructive font-medium px-1">
            {errors.title}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Input
          key={`url-${block.id}`}
          defaultValue={block.url}
          placeholder="url (e.g. https://github.com)"
          className={cn(
            'h-9 bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-xs text-muted-foreground',
            errors.url &&
              'border border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/30',
          )}
          onChange={(e) => handleUpdate(block.id, 'url', e.target.value)}
        />
        {errors.url && (
          <p className="text-[10px] text-destructive font-medium px-1">
            {errors.url}
          </p>
        )}
      </div>
    </div>
  )
}
