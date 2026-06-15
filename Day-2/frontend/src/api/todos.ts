export interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  category: string
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  color: string
}

const BASE = '/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// --- Todos ---
export const api = {
  todos: {
    list: ()                           => req<Todo[]>('/todos'),
    create: (body: Partial<Todo>)      => req<Todo>('/todos', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Todo>) =>
      req<Todo>(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string)               => req<void>(`/todos/${id}`, { method: 'DELETE' }),
    reorder: (orderedIds: string[])    => req<void>('/todos/reorder', { method: 'POST', body: JSON.stringify({ orderedIds }) }),
  },
  categories: {
    list: ()                           => req<Category[]>('/categories'),
    create: (body: Partial<Category>)  => req<Category>('/categories', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id: string)               => req<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
}
