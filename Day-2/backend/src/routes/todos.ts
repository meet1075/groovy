import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  getAllTodos, getTodoById, createTodo, updateTodo, deleteTodo, reorderTodos,
  getAllCategories, createCategory, deleteCategory,
} from '../db.js'

const router = Router()

// ---- Todos ----

router.get('/todos', async (_req: Request, res: Response) => {
  res.json(await getAllTodos())
})

router.post('/todos', async (req: Request, res: Response) => {
  const { title, description = '', priority = 'medium', category = 'general', due_date = null } = req.body
  if (!title?.trim()) { res.status(400).json({ error: 'Title is required' }); return }
  const todo = await createTodo({
    id: uuidv4(), title: title.trim(), description,
    completed: false, priority, category, due_date, position: 0,
  })
  res.status(201).json(todo)
})

// NOTE: /todos/reorder must be declared before /todos/:id so Express does not
// treat the literal string "reorder" as a dynamic :id param.
router.post('/todos/reorder', async (req: Request, res: Response) => {
  const { orderedIds } = req.body
  if (!Array.isArray(orderedIds)) { res.status(400).json({ error: 'orderedIds must be an array' }); return }
  await reorderTodos(orderedIds)
  res.json({ ok: true })
})

router.get('/todos/:id', async (req: Request, res: Response) => {
  const todo = await getTodoById(req.params.id as string)
  if (!todo) { res.status(404).json({ error: 'Not found' }); return }
  res.json(todo)
})

router.patch('/todos/:id', async (req: Request, res: Response) => {
  const todo = await updateTodo(req.params.id as string, req.body)
  if (!todo) { res.status(404).json({ error: 'Not found' }); return }
  res.json(todo)
})

router.delete('/todos/:id', async (req: Request, res: Response) => {
  const ok = await deleteTodo(req.params.id as string)
  if (!ok) { res.status(404).json({ error: 'Not found' }); return }
  res.status(204).end()
})

// ---- Categories ----

router.get('/categories', async (_req: Request, res: Response) => {
  res.json(await getAllCategories())
})

router.post('/categories', async (req: Request, res: Response) => {
  const { name, color = '#6366f1' } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'Name required' }); return }
  const cat = await createCategory({ id: uuidv4(), name: name.trim(), color })
  res.status(201).json(cat)
})

router.delete('/categories/:id', async (req: Request, res: Response) => {
  const ok = await deleteCategory(req.params.id as string)
  if (!ok) { res.status(404).json({ error: 'Not found' }); return }
  res.status(204).end()
})

export default router
