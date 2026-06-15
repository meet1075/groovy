import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Todo } from '../api/todos'

const TODOS_KEY = ['todos']
const CATS_KEY  = ['categories']

export function useTodos() {
  return useQuery({ queryKey: TODOS_KEY, queryFn: api.todos.list })
}

export function useCategories() {
  return useQuery({ queryKey: CATS_KEY, queryFn: api.categories.list })
}

export function useCreateTodo(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.todos.create,
    onMutate: async (newTodo) => {
      await qc.cancelQueries({ queryKey: TODOS_KEY })
      const prev = qc.getQueryData<Todo[]>(TODOS_KEY) ?? []
      const optimistic: Todo = {
        id: `opt-${Date.now()}`,
        title: newTodo.title ?? '',
        description: newTodo.description ?? '',
        completed: false,
        priority: newTodo.priority ?? 'medium',
        category: newTodo.category ?? 'general',
        due_date: newTodo.due_date ?? null,
        position: prev.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      qc.setQueryData<Todo[]>(TODOS_KEY, [...prev, optimistic])
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(TODOS_KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
    onSuccess,
  })
}

export function useUpdateTodo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Todo> & { id: string }) =>
      api.todos.update(id, patch),
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: TODOS_KEY })
      const prev = qc.getQueryData<Todo[]>(TODOS_KEY) ?? []
      qc.setQueryData<Todo[]>(
        TODOS_KEY,
        prev.map(t => (t.id === id ? { ...t, ...patch } : t))
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(TODOS_KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}

export function useDeleteTodo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.todos.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: TODOS_KEY })
      const prev = qc.getQueryData<Todo[]>(TODOS_KEY) ?? []
      qc.setQueryData<Todo[]>(TODOS_KEY, prev.filter(t => t.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(TODOS_KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}

export function useReorderTodos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => api.todos.reorder(orderedIds),
    onSettled: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}
