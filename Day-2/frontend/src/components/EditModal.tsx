import { useState, type FormEvent } from 'react'
import { useUpdateTodo } from '../hooks/useTodos'
import { type Todo, type Category } from '../api/todos'

interface Props {
  todo: Todo
  categories: Category[]
  onClose: () => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}

export default function EditModal({ todo, categories, onClose, onToast }: Props) {
  const [title, setTitle]       = useState(todo.title)
  const [desc, setDesc]         = useState(todo.description)
  const [priority, setPriority] = useState(todo.priority)
  const [category, setCategory] = useState(todo.category)
  const [dueDate, setDueDate]   = useState(todo.due_date ?? '')

  const update = useUpdateTodo()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || title.trim().length > 20) return
    update.mutate(
      { id: todo.id, title, description: desc, priority, category, due_date: dueDate || null },
      {
        onSuccess: () => { onToast('✓ Task updated', 'success'); onClose() },
        onError: () => onToast('Failed to update', 'error'),
      }
    )
  }

  const inputCls = `w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2
    text-sm text-[#f0f2ff] placeholder-[#4b5280] outline-none
    focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10
    transition-all duration-200`

  const labelCls = `text-[0.68rem] font-semibold uppercase tracking-widest text-[#4b5280]`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/70 backdrop-blur-md animate-[fade-in_0.15s_ease]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1d32]
                   shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6
                   animate-[slide-up_0.2s_ease]"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#f0f2ff]">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#4b5280] hover:text-[#f0f2ff] hover:bg-white/8
                       transition-all duration-150 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Title</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={e => { if (e.target.value.length <= 20) setTitle(e.target.value) }}
              maxLength={20}
              className={inputCls}
              autoFocus
            />
            <span className="text-xs text-[#4b5280]">{title.length}/20</span>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className={inputCls}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={inputCls}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name.toLowerCase()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Due date</label>
              <input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDueDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-sm font-semibold
                         text-[#8b93b8] hover:bg-white/5 hover:text-[#f0f2ff]
                         transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || title.trim().length > 20 || update.isPending}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700
                         text-sm font-semibold text-white shadow-[0_4px_15px_rgba(139,92,246,0.35)]
                         hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] hover:-translate-y-px
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200"
            >
              {update.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
