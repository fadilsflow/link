import {
  DndContext,
  closestCenter,
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
import { SortableLinkItem } from './SortableLinkItem'

interface Link {
  id: string
  title: string
  url: string
  isEnabled: boolean
  syncStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
  errors?: { title?: string; url?: string }
}

interface LinkListProps {
  links: Link[]
  onUpdate: (id: string, field: string, value: any) => void
  onDelete: (id: string) => void
  onReorder: (newLinks: Link[]) => void
}

export function LinkList({
  links,
  onUpdate,
  onDelete,
  onReorder,
}: LinkListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = links.findIndex((l) => l.id === active.id)
    const newIndex = links.findIndex((l) => l.id === over.id)

    onReorder(arrayMove(links, oldIndex, newIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
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
