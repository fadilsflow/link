import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
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
        'group relative flex items-stretch bg-white border border-zinc-100 rounded-[28px] transition-[background-color,border-color,box-shadow,opacity] duration-300 overflow-hidden shadow-sm hover:shadow-md hover:border-zinc-200',
        isDragging && 'shadow-2xl ring-2 ring-zinc-900/5',
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center px-4 cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-900 transition-colors touch-none"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 pl-2 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
                block.type === 'text'
                  ? 'bg-zinc-100 text-zinc-500'
                  : 'bg-emerald-50 text-emerald-600',
              )}
            >
              {block.type === 'text' ? 'Text Content' : 'Link Content'}
            </div>
          </div>
        </div>

        <div className="bg-zinc-50/50 rounded-2xl p-2 border border-zinc-50/50">
          {block.type === 'text' ? (
            <TextBlock
              block={block as any}
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
      </div>

      {/* Subtle Status Line */}
      <div
        className={cn(
          'w-1 transition-colors',
          status === 'saving'
            ? 'bg-amber-400'
            : status === 'unsaved'
              ? 'bg-zinc-200'
              : 'bg-zinc-50',
        )}
      />
    </div>
  )
}
