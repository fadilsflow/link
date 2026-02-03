import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableLinkItem } from './SortableLinkItem'
import type { DragEndEvent } from '@dnd-kit/core'

interface Link {
  id: string
  title: string
  url: string
  isEnabled: boolean
  syncStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
  errors?: { title?: string; url?: string }
}

interface LinkListProps {
  links: Array<Link>
  onUpdate: (id: string, field: string, value: any) => void
  onDelete: (id: string) => void
  onReorder: (newLinks: Array<Link>) => void
  onDragStart?: () => void
  onDragCancel?: () => void
}

export function LinkList({
  links,
  onUpdate,
  onDelete,
  onReorder,
  onDragStart,
  onDragCancel,
}: LinkListProps) {
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

    const oldIndex = links.findIndex((l) => l.id === active.id)
    const newIndex = links.findIndex((l) => l.id === over.id)

    onReorder(arrayMove(links, oldIndex, newIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={onDragCancel}
    >
      <SortableContext
        items={links.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {links.map((link) => (
            <SortableLinkItem
              key={link.id}
              link={link}
              handleLinkUpdate={onUpdate}
              handleDeleteLink={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
