import { createClient } from '@libsql/client'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../../data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const DB_PATH = path.join(dataDir, 'todos.db')

export const db = createClient({ url: `file:${DB_PATH}` })

// ---- Schema Migrations ----
export async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS todos (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      completed   INTEGER NOT NULL DEFAULT 0,
      priority    TEXT NOT NULL DEFAULT 'medium',
      category    TEXT NOT NULL DEFAULT 'general',
      due_date    TEXT,
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id    TEXT PRIMARY KEY,
      name  TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1'
    );

    INSERT OR IGNORE INTO categories (id, name, color) VALUES
      ('cat-personal', 'Personal', '#8b5cf6'),
      ('cat-work',     'Work',     '#06b6d4'),
      ('cat-health',   'Health',   '#10b981'),
      ('cat-general',  'General',  '#6366f1');
  `)
}

// ---- Types ----
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

function rowToTodo(row: Record<string, unknown>): Todo {
  return { ...row, completed: row.completed === 1 } as Todo
}

// ---- Todos ----
export async function getAllTodos(): Promise<Todo[]> {
  const result = await db.execute('SELECT * FROM todos ORDER BY position ASC, created_at DESC')
  return result.rows.map(r => rowToTodo(r as Record<string, unknown>))
}

export async function getTodoById(id: string): Promise<Todo | undefined> {
  const result = await db.execute({ sql: 'SELECT * FROM todos WHERE id = ?', args: [id] })
  if (!result.rows[0]) return undefined
  return rowToTodo(result.rows[0] as Record<string, unknown>)
}

export async function createTodo(todo: Omit<Todo, 'created_at' | 'updated_at'>): Promise<Todo> {
  const maxResult = await db.execute('SELECT COALESCE(MAX(position), -1) as m FROM todos')
  const maxPos = Number(maxResult.rows[0].m ?? -1)
  await db.execute({
    sql: `INSERT INTO todos (id, title, description, completed, priority, category, due_date, position)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      todo.id, todo.title, todo.description,
      todo.completed ? 1 : 0,
      todo.priority, todo.category,
      todo.due_date ?? null,
      maxPos + 1,
    ],
  })
  return (await getTodoById(todo.id))!
}

export async function updateTodo(
  id: string,
  patch: Partial<Omit<Todo, 'id' | 'created_at' | 'updated_at'>>
): Promise<Todo | undefined> {
  const existing = await getTodoById(id)
  if (!existing) return undefined
  const merged = { ...existing, ...patch }
  await db.execute({
    sql: `UPDATE todos SET
            title=?, description=?, completed=?, priority=?,
            category=?, due_date=?, position=?,
            updated_at=datetime('now')
          WHERE id=?`,
    args: [
      merged.title, merged.description,
      merged.completed ? 1 : 0,
      merged.priority, merged.category,
      merged.due_date ?? null,
      merged.position,
      id,
    ],
  })
  return getTodoById(id)
}

export async function deleteTodo(id: string): Promise<boolean> {
  const result = await db.execute({ sql: 'DELETE FROM todos WHERE id = ?', args: [id] })
  return (result.rowsAffected ?? 0) > 0
}

export async function reorderTodos(orderedIds: string[]): Promise<void> {
  const stmts = orderedIds.map((id, pos) => ({
    sql: 'UPDATE todos SET position=? WHERE id=?',
    args: [pos, id] as [number, string],
  }))
  await db.batch(stmts)
}

// ---- Categories ----
export async function getAllCategories(): Promise<Category[]> {
  const result = await db.execute('SELECT * FROM categories ORDER BY name ASC')
  return result.rows as unknown as Category[]
}

export async function createCategory(cat: Category): Promise<Category> {
  await db.execute({
    sql: 'INSERT INTO categories (id, name, color) VALUES (?, ?, ?)',
    args: [cat.id, cat.name, cat.color],
  })
  return cat
}

export async function deleteCategory(id: string): Promise<boolean> {
  const result = await db.execute({ sql: 'DELETE FROM categories WHERE id=?', args: [id] })
  return (result.rowsAffected ?? 0) > 0
}
