import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useUpdateTodo, useDeleteTodo } from '../hooks/useTodos'
import { type Todo, type Category } from '../api/todos'
import EditModal from './EditModal'

const PRIORITY_STYLES: Record<string, { bar: string; tag: string; text: string }> = {
  low:    { bar: 'bg-emerald-500',  tag: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', text: '🟢 Low' },
  medium: { bar: 'bg-amber-400',    tag: 'bg-amber-400/10 text-amber-400 border-amber-400/20',       text: '🟡 Medium' },
  high:   { bar: 'bg-rose-500',     tag: 'bg-rose-500/10 text-rose-400 border-rose-500/20',           text: '🔴 High' },
}

function isOverdue(due: string | null) {
  if (!due) return false
  return new Date(due) < new Date(new Date().toDateString())
}

interface Props {
  todo: Todo
  categories: Category[]
  onToast: (msg: string, type?: 'success' | 'error') => void
}

export default function TodoItem({ todo, categories, onToast }: Props) {
  const [editing, setEditing] = useState(false)
  const update = useUpdateTodo()
  const remove = useDeleteTodo()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const p = PRIORITY_STYLES[todo.priority] ?? PRIORITY_STYLES.medium

  function toggleComplete() {
    update.mutate({ id: todo.id, completed: !todo.completed })
  }

  function handleDelete() {
    remove.mutate(todo.id)
    onToast('🗑 Task deleted')
  }

  const overdue = isOverdue(todo.due_date)

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative flex items-start gap-3 rounded-2xl border border-white/8
                    bg-white/[0.03] backdrop-blur-sm px-4 py-3.5
                    hover:bg-white/[0.06] hover:border-white/12 hover:-translate-y-px
                    hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]
                    transition-all duration-200 overflow-hidden
                    ${todo.completed ? 'opacity-50' : ''}`}
      >
        {/* Priority bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${p.bar} rounded-l-2xl`} />

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-[#4b5280] opacity-0 group-hover:opacity-100
                     transition-opacity duration-200 hover:text-[#8b93b8] touch-none"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>

        {/* Checkbox */}
        <button
          onClick={toggleComplete}
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center
                      transition-all duration-200
                      ${todo.completed
                        ? 'bg-violet-500 border-violet-500'
                        : 'border-white/20 hover:border-violet-500/60'}`}
        >
          {todo.completed && <span className="text-white text-[10px] font-bold">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug break-words
                         ${todo.completed ? 'line-through text-[#4b5280]' : 'text-[#f0f2ff]'}`}>
            {todo.title}
          </p>
          {todo.description && (
            <p className="text-xs text-[#8b93b8] mt-0.5 leading-relaxed">{todo.description}</p>
          )}

          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`text-[0.65rem] font-medium px-2 py-0.5 rounded-full border ${p.tag}`}>
              {p.text}
            </span>

            <span className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full border
                             bg-violet-500/10 text-violet-400 border-violet-500/20 capitalize">
              {todo.category}
            </span>

            {todo.due_date && (
              <span className={`text-[0.65rem] font-medium px-2 py-0.5 rounded-full border
                                ${overdue
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                {overdue ? '⚠ ' : '📅 '}
                {new Date(todo.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
          <button
            id={`edit-todo-${todo.id}`}
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-[#8b93b8] hover:bg-white/8 hover:text-[#f0f2ff]
                       transition-all duration-150 text-sm"
            aria-label="Edit task"
          >
            ✏️
          </button>
          <button
            id={`delete-todo-${todo.id}`}
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-[#8b93b8] hover:bg-rose-500/12 hover:text-rose-400
                       transition-all duration-150 text-sm"
            aria-label="Delete task"
          >
            🗑
          </button>
        </div>
      </div>

      {editing && (
        <EditModal
          todo={todo}
          categories={categories}
          onClose={() => setEditing(false)}
          onToast={onToast}
        />
      )}
    </>
  )
}
