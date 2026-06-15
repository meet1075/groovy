import { type Todo } from '../api/todos'

type Status   = 'all' | 'active' | 'completed'
type Priority = 'all' | 'low' | 'medium' | 'high'

interface Props {
  search: string
  setSearch: (v: string) => void
  status: Status
  setStatus: (v: Status) => void
  priority: Priority
  setPriority: (v: Priority) => void
  category: string
  setCategory: (v: string) => void
  categories: string[]
  todos: Todo[]
}

export default function FilterBar({
  search, setSearch,
  status, setStatus,
  priority, setPriority,
  category, setCategory,
  categories,
  todos,
}: Props) {
  const total     = todos.length
  const done      = todos.filter(t => t.completed).length
  const pct       = total === 0 ? 0 : Math.round((done / total) * 100)

  const chipCls = (active: boolean) =>
    `text-xs font-medium px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer
     ${active
       ? 'bg-violet-500 border-violet-500 text-white'
       : 'border-white/10 text-[#8b93b8] hover:border-violet-500/50 hover:text-violet-400 bg-transparent'
     }`

  return (
    <div className="mb-5 flex flex-col gap-3">
      {/* Progress */}
      {total > 0 && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-[#8b93b8] font-medium">{done}/{total} completed</span>
            <span className="text-xs font-bold text-violet-400">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400
                         transition-[width] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5280] text-sm pointer-events-none">🔍</span>
        <input
          id="search-input"
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2
                     text-sm text-[#f0f2ff] placeholder-[#4b5280] outline-none
                     focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10
                     transition-all duration-200"
        />
      </div>

      {/* Chips row */}
      <div className="flex flex-wrap gap-2">
        {/* Status */}
        {(['all', 'active', 'completed'] as Status[]).map(s => (
          <button key={s} id={`filter-status-${s}`} onClick={() => setStatus(s)} className={chipCls(status === s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        <span className="self-center text-white/15">|</span>

        {/* Priority */}
        {(['all', 'low', 'medium', 'high'] as Priority[]).map(p => (
          <button key={p} id={`filter-priority-${p}`} onClick={() => setPriority(p)} className={chipCls(priority === p)}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}

        {categories.length > 0 && (
          <>
            <span className="self-center text-white/15">|</span>
            <button id="filter-cat-all" onClick={() => setCategory('all')} className={chipCls(category === 'all')}>
              All categories
            </button>
            {categories.map(cat => (
              <button key={cat} id={`filter-cat-${cat}`} onClick={() => setCategory(cat)} className={chipCls(category === cat)}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
