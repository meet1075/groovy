import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import TodoItem from './TodoItem'
import { useReorderTodos } from '../hooks/useTodos'
import { type Todo, type Category } from '../api/todos'

interface Props {
  todos: Todo[]
  categories: Category[]
  search: string
  status: 'all' | 'active' | 'completed'
  priority: 'all' | 'low' | 'medium' | 'high'
  category: string
  onToast: (msg: string, type?: 'success' | 'error') => void
}

export default function TodoList({ todos, categories, search, status, priority, category, onToast }: Props) {
  const qc = useQueryClient()
  const reorder = useReorderTodos()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const filtered = useMemo(() => {
    return todos.filter(t => {
      if (status === 'active'    && t.completed) return false
      if (status === 'completed' && !t.completed) return false
      if (priority !== 'all'    && t.priority !== priority) return false
      if (category !== 'all'    && t.category !== category) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
          !t.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [todos, status, priority, category, search])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = filtered.findIndex(t => t.id === active.id)
    const newIdx = filtered.findIndex(t => t.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = arrayMove(filtered, oldIdx, newIdx)
    // Merge reordered filtered items back into the full list preserving unfiltered items
    const filteredIds = new Set(filtered.map(t => t.id))
    const rest = todos.filter(t => !filteredIds.has(t.id))
    const merged = [...reordered, ...rest]
    qc.setQueryData(['todos'], merged)
    reorder.mutate(merged.map(t => t.id))
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4 opacity-40">
          {todos.length === 0 ? '✨' : '🔍'}
        </div>
        <p className="text-base font-semibold text-[#8b93b8] mb-1">
          {todos.length === 0 ? 'No tasks yet' : 'No results'}
        </p>
        <p className="text-sm text-[#4b5280]">
          {todos.length === 0
            ? 'Add your first task above to get started'
            : 'Try adjusting your filters'}
        </p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={filtered.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {filtered.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              categories={categories}
              onToast={onToast}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
