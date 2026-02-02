import { createFileRoute } from '@tanstack/react-router'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'

const initialItems = [
  { id: '1', name: 'Andi' },
  { id: '2', name: 'Budi' },
  { id: '3', name: 'Citra' },
  { id: '4', name: 'Dewi' },
]
export const Route = createFileRoute('/test-dnd')({
  component: RouteComponent,
})

function RouteComponent() {
  const [items, setItems] = useState(initialItems)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  return (
    <div className="max-w-sm mx-auto mt-10">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return

          setItems((items) => {
            const oldIndex = items.findIndex((i) => i.id === active.id)
            const newIndex = items.findIndex((i) => i.id === over.id)
            return arrayMove(items, oldIndex, newIndex)
          })
        }}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id} name={item.name} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableItem({ id, name }: { id: string; name: string }) {
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 rounded border bg-white cursor-grab active:cursor-grabbing"
    >
      {name}
    </div>
  )
}
