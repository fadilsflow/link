import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableBlockItem } from './SortableBlockItem'

interface Block {
  id: string
  title: string
  url: string
  type?: string
  content?: string
  isEnabled: boolean
  syncStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
  errors?: { title?: string; url?: string }
}

interface BlockListProps {
  blocks: Block[]
  onUpdate: (id: string, field: string, value: any) => void
  onDelete: (id: string) => void
  onReorder: (newBlocks: Block[]) => void
  onDragStart?: () => void
  onDragCancel?: () => void
}

export function BlockList({
  blocks,
  onUpdate,
  onDelete,
  onReorder,
  onDragStart,
  onDragCancel,
}: BlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = () => {
    onDragStart?.()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      onDragCancel?.()
      return
    }

    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)

    onReorder(arrayMove(blocks, oldIndex, newIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={onDragCancel}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {blocks.map((block) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              handleBlockUpdate={onUpdate}
              handleDeleteBlock={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
