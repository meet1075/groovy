import { useState, useCallback } from 'react'
import { useTodos, useCategories } from './hooks/useTodos'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import FilterBar from './components/FilterBar'

type Status   = 'all' | 'active' | 'completed'
type Priority = 'all' | 'low' | 'medium' | 'high'

interface Toast { id: number; msg: string; type: 'success' | 'error' }

let toastId = 0

export default function App() {
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState<Status>('all')
  const [priority, setPriority] = useState<Priority>('all')
  const [category, setCategory] = useState('all')
  const [toasts, setToasts]     = useState<Toast[]>([])

  const todosQuery = useTodos()
  const catsQuery  = useCategories()

  const todos      = todosQuery.data ?? []
  const categories = catsQuery.data  ?? []
  const catNames   = [...new Set(todos.map(t => t.category).filter(Boolean))]

  const total = todos.length
  const done  = todos.filter(t => t.completed).length

  const addToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-[#f0f2ff] font-[Inter,system-ui,-apple-system,sans-serif] overflow-x-hidden">

      {/* Animated background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] -top-24 -left-24 rounded-full bg-violet-500
                        opacity-[0.12] blur-[80px] animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute w-[400px] h-[400px] -bottom-20 -right-20 rounded-full bg-cyan-400
                        opacity-[0.12] blur-[80px] animate-[float_20s_ease-in-out_infinite_-7s]" />
        <div className="absolute w-[300px] h-[300px] top-1/2 left-1/2 rounded-full bg-emerald-500
                        opacity-[0.08] blur-[80px] animate-[float_20s_ease-in-out_infinite_-14s]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4
                          border-b border-white/8 bg-[#0d0f1a]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-violet-500 to-cyan-400
                          flex items-center justify-center text-lg
                          shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            ✦
          </div>
          <h1 className="text-xl font-extrabold text-gradient">Groovy Todo</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-lg font-bold text-violet-400 leading-none">{total}</div>
            <div className="text-[0.6rem] font-semibold text-[#4b5280] uppercase tracking-widest mt-0.5">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-400 leading-none">{done}</div>
            <div className="text-[0.6rem] font-semibold text-[#4b5280] uppercase tracking-widest mt-0.5">Done</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400 leading-none">{total - done}</div>
            <div className="text-[0.6rem] font-semibold text-[#4b5280] uppercase tracking-widest mt-0.5">Active</div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-1 max-w-[860px] mx-auto px-5 pt-7 pb-16 w-full">
        {todosQuery.isError && (
          <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/8 px-4 py-3
                          text-sm text-rose-400 text-center">
            ⚠ Could not connect to backend — make sure the server is running on port 3001
          </div>
        )}

        <TodoForm categories={categories} onToast={addToast} />

        <FilterBar
          search={search}       setSearch={setSearch}
          status={status}       setStatus={setStatus}
          priority={priority}   setPriority={setPriority}
          category={category}   setCategory={setCategory}
          categories={catNames}
          todos={todos}
        />

        {todosQuery.isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[72px] rounded-2xl border border-white/6
                                      bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : (
          <TodoList
            todos={todos}
            categories={categories}
            search={search}
            status={status}
            priority={priority}
            category={category}
            onToast={addToast}
          />
        )}
      </main>

      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-xl border bg-[#1e2140] px-4 py-2.5
                        text-sm text-[#f0f2ff] shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                        animate-[toast-in_0.2s_ease]
                        ${t.type === 'error'
                          ? 'border-rose-500/30 border-l-4 border-l-rose-500'
                          : 'border-white/10 border-l-4 border-l-emerald-500'}`}
          >
            {t.msg}
          </div>
        ))}
      </div>

      {/* Keyframe animations injected as style tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%       { transform: translate(40px,-40px) scale(1.05); }
          66%       { transform: translate(-30px,30px) scale(0.95); }
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .text-gradient {
          background: linear-gradient(90deg, #f0f2ff, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .z-1 { z-index: 1; }
        select option { background: #1e2140; }
      `}</style>
    </div>
  )
}
