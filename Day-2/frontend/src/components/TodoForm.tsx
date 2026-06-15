import { useState, type FormEvent } from 'react'
import { useCreateTodo } from '../hooks/useTodos'
import { type Category } from '../api/todos'

interface Props {
  categories: Category[]
  onToast: (msg: string, type?: 'success' | 'error') => void
}

export default function TodoForm({ categories, onToast }: Props) {
  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [category, setCategory] = useState('general')
  const [dueDate, setDueDate]   = useState('')
  const [expanded, setExpanded] = useState(false)

  const create = useCreateTodo(() => {
    setTitle(''); setDesc(''); setDueDate(''); setExpanded(false)
    onToast('✓ Task added', 'success')
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    create.mutate({ title, description: desc, priority, category, due_date: dueDate || null })
  }

  const inputCls = `w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2
    text-sm text-[#f0f2ff] placeholder-[#4b5280] outline-none
    focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10
    transition-all duration-200`

  const labelCls = `text-[0.68rem] font-semibold uppercase tracking-widest text-[#4b5280]`

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-md p-5
                 focus-within:border-violet-500/40 focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]
                 transition-all duration-200 mb-5"
    >
      {/* Main row */}
      <div className="flex gap-3">
        <input
          id="todo-title-input"
          type="text"
          placeholder="Add a new task…"
          value={title}
          onChange={e => { setTitle(e.target.value); setExpanded(true) }}
          onFocus={() => setExpanded(true)}
          className={`${inputCls} flex-1`}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!title.trim() || create.isPending}
          id="add-todo-btn"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700
                     px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(139,92,246,0.4)]
                     hover:shadow-[0_6px_20px_rgba(139,92,246,0.55)] hover:-translate-y-px
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
                     transition-all duration-200 whitespace-nowrap"
        >
          <span>+ Add</span>
        </button>
      </div>

      {/* Expanded extras */}
      {expanded && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3 flex flex-col gap-1">
            <label className={labelCls}>Description</label>
            <textarea
              placeholder="Optional details…"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

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
              onChange={e => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      )}
    </form>
  )
}
