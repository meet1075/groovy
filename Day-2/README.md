# ✦ Groovy Todo

A production-quality, full-stack **TODO application** built with **React 19 + Vite 6** on the frontend and **Express 5 + Node 26** on the backend, styled entirely with **Tailwind CSS v4**.

---

## Table of Contents

- [Prompts](#prompts)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Frontend Architecture](#frontend-architecture)
- [Database Schema](#database-schema)
- [Common Issues & Fixes](#common-issues--fixes)
- [Scripts Reference](#scripts-reference)

---

## Prompts

The following prompts were used to define and build this project:

### Prompt 1

> Build a full-stack TODO application using React (latest version, with Vite) for the frontend and Node.js + Express for the backend, with a database (use SQLite or MongoDB — pick whichever is faster to set up locally without extra config).
>
> **Core CRUD**
> Create, read, update, and delete tasks. Each task has: title, description (optional), priority, category, due date (optional), completion status, and a position/order field.
>
> **Priority levels**
> Low (green), Medium (amber), High (red) — show as a color-coded left border or accent bar on each task card.
>
> **Categories**
> Personal, Work, Health, General, plus support for custom user-defined categories.
>
> **Due dates**
> Optional due date field. If a task is incomplete and the due date has passed, highlight the card/date in red as "overdue."
>
> **Search & filter**
> A search bar for free-text keyword matching (title/description), plus filter dropdowns for status (all/active/done), priority, and category. Filters should combine (AND logic).
>
> **Drag-to-reorder**
> Allow drag-and-drop reordering of tasks (use @dnd-kit or react-beautiful-dnd/dnd-kit successor). Persist the new order to the backend/database so it survives a page refresh.
>
> **Optimistic updates**
> All create/update/delete/reorder actions should update the UI immediately, then sync with the server in the background. Roll back the UI change and show an error toast if the server request fails.
>
> **Progress bar**
> An animated gradient progress bar showing percentage of completed tasks vs total, updating live as tasks are toggled.
>
> **Header stats**
> Display live counters for Total, Done, and Active tasks in the header.
>
> **Toast notifications**
> Show success toasts for create/update/delete/reorder actions, and error toasts on failure (use react-hot-toast or similar).
>
> **Skeleton loading**
> Show pulse-animation skeleton cards while initial data is loading from the backend.
>
> **UI design — dark glassmorphism**
> Dark theme with frosted-glass cards (backdrop blur, subtle borders), animated gradient blob shapes in the background for ambient motion, and color-coded sidebars/accents per priority. Keep it polished but not overdone — focus on one or two signature visual touches rather than excessive effects.
>
> **Tech requirements**
> - Frontend: React + Vite, functional components with hooks
> - Backend: Node.js + Express, REST API endpoints for all CRUD + reorder operations
> - Database: SQLite (via better-sqlite3 or Prisma) for simple local setup
> - Provide clear setup instructions (install steps, how to run frontend and backend)
> - Structure the project with separate `/client` and `/server` folders
>
> Build it incrementally: first scaffold the backend API and database schema, then build the frontend UI feature by feature, and finally wire up optimistic updates and polish the visual design.

### Prompt 2

> Create a detailed README file containing all instructions.

---

## Features

| Feature | Description |
|---|---|
| ✅ **CRUD Tasks** | Create, read, update, and delete todos |
| 🎯 **Priority Levels** | Low (green) / Medium (amber) / High (red) with colour-coded bars |
| 🗂 **Categories** | Assign tasks to Personal, Work, Health, General (or custom) |
| 📅 **Due Dates** | Optional due dates with overdue highlighting in red |
| 🔍 **Search & Filter** | Filter by status, priority, category, or free-text keyword |
| ↕ **Drag-to-Reorder** | Drag tasks to reorder them; position persisted to the database |
| ⚡ **Optimistic Updates** | UI updates instantly without waiting for the server |
| 📊 **Progress Bar** | Animated gradient bar showing % of tasks completed |
| 📈 **Header Stats** | Live Total / Done / Active task counters |
| 🔔 **Toast Notifications** | Success/error feedback on every action |
| 💀 **Skeleton Loading** | Pulse placeholder cards while data loads |
| 🌙 **Dark Glassmorphism UI** | Animated gradient blobs, backdrop blur, priority sidebars |

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` | 19 | UI framework |
| `react-dom` | 19 | DOM renderer |
| `vite` | 6 | Dev server & bundler |
| `@vitejs/plugin-react` | 4 | React fast-refresh |
| `tailwindcss` | 4 | Utility-first CSS |
| `@tailwindcss/vite` | 4 | Tailwind v4 Vite plugin |
| `@tanstack/react-query` | 5 | Server state + optimistic mutations |
| `@dnd-kit/core` | 6 | Drag-and-drop primitives |
| `@dnd-kit/sortable` | 8 | Sortable list context |
| `@dnd-kit/utilities` | 3 | CSS transform helpers |
| `typescript` | 5.7 | Static typing |

### Backend
| Package | Version | Purpose |
|---|---|---|
| `express` | 5 | HTTP server & routing |
| `@libsql/client` | 0.14 | Pure-JS SQLite driver (Node 26 compatible) |
| `uuid` | 11 | ID generation |
| `cors` | 2 | Cross-origin headers |
| `tsx` | 4 | TypeScript dev runner (no build step) |
| `typescript` | 5.7 | Static typing |

---

## Project Structure

```
groovy-todo/
│
├── package.json                  # Root workspace — runs both servers concurrently
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts              # Express entry point, DB init, error handler
│       ├── db.ts                 # SQLite schema, migrations, typed CRUD helpers
│       └── routes/
│           └── todos.ts          # REST endpoints for todos & categories
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts            # Tailwind v4 plugin + /api proxy → :3001
│   ├── index.html                # Root HTML, Google Fonts (Inter)
│   └── src/
│       ├── index.css             # @import "tailwindcss" + @theme design tokens
│       ├── main.tsx              # ReactDOM root + TanStack QueryClientProvider
│       ├── App.tsx               # Root layout, header, stats, toasts, blobs
│       ├── api/
│       │   └── todos.ts          # Typed fetch client (Todo & Category API calls)
│       ├── hooks/
│       │   └── useTodos.ts       # TanStack Query hooks with optimistic updates
│       └── components/
│           ├── TodoForm.tsx      # Expandable add-task form
│           ├── TodoItem.tsx      # Drag-sortable task card
│           ├── TodoList.tsx      # DnD-kit context + client-side filtering
│           ├── FilterBar.tsx     # Progress bar + search + filter chips
│           └── EditModal.tsx     # Edit task overlay
│
└── data/
    └── todos.db                  # SQLite database file (auto-created on first run)
```

---

## Prerequisites

Make sure the following are installed on your machine:

| Tool | Minimum Version | Check |
|---|---|---|
| **Node.js** | 20+ (tested on 26) | `node --version` |
| **npm** | 10+ | `npm --version` |

---

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd groovy-todo
```

### 2. Install all dependencies

Run this single command from the project root — it installs packages for the root, backend, and frontend in sequence:

```bash
npm install && npm install --prefix backend && npm install --prefix frontend
```

> **If you see an `esbuild` post-install warning**, approve it with:
> ```bash
> cd frontend && npm approve-scripts esbuild
> ```

---

## Running the App

### Development (recommended)

Start both the backend and frontend servers concurrently with one command from the project root:

```bash
npm run dev
```

| Service | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3001 |
| **Health check** | http://localhost:3001/api/health |

The frontend Vite dev server proxies all `/api/*` requests to the backend, so you never have to deal with CORS in development.

### Run separately (optional)

**Backend only:**
```bash
npm run dev --prefix backend
```

**Frontend only:**
```bash
npm run dev --prefix frontend
```

---

## Environment Variables

The app works out of the box with zero configuration. These environment variables are available if you need to override the defaults:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend HTTP server port |

Set them inline or in a `.env` file in the `backend/` directory:

```bash
# backend/.env  (optional)
PORT=4000
```

---

## API Reference

Base URL: `http://localhost:3001/api`

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Returns `{ status: "ok", timestamp }` |

### Todos

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/todos` | — | List all todos (ordered by position) |
| `POST` | `/todos` | `{ title, description?, priority?, category?, due_date? }` | Create a todo |
| `GET` | `/todos/:id` | — | Get a single todo |
| `PATCH` | `/todos/:id` | Any subset of todo fields | Update a todo |
| `DELETE` | `/todos/:id` | — | Delete a todo (204 No Content) |
| `POST` | `/todos/reorder` | `{ orderedIds: string[] }` | Persist drag-and-drop order |

**Todo object shape:**
```jsonc
{
  "id":          "uuid",
  "title":       "Buy groceries",
  "description": "",
  "completed":   false,
  "priority":    "medium",   // "low" | "medium" | "high"
  "category":    "personal",
  "due_date":    "2026-06-20",  // ISO date string, or null
  "position":    0,
  "created_at":  "2026-06-15T06:00:00.000Z",
  "updated_at":  "2026-06-15T06:00:00.000Z"
}
```

### Categories

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/categories` | — | List all categories |
| `POST` | `/categories` | `{ name, color? }` | Create a category |
| `DELETE` | `/categories/:id` | — | Delete a category (204 No Content) |

**Category object shape:**
```jsonc
{
  "id":    "uuid",
  "name":  "Work",
  "color": "#06b6d4"
}
```

---

## Frontend Architecture

### State Management

All server state is managed by **TanStack Query** (`@tanstack/react-query`):

- `useTodos()` — fetches and caches the todo list
- `useCategories()` — fetches and caches categories
- `useCreateTodo()` — optimistic insert (adds a placeholder before the server responds)
- `useUpdateTodo()` — optimistic patch (updates cache immediately, rolls back on error)
- `useDeleteTodo()` — optimistic remove
- `useReorderTodos()` — fires-and-forgets the position update

### Data Flow

```
User action
    │
    ▼
Mutation hook (optimistic cache update)
    │
    ├─── UI updates immediately (no spinner)
    │
    ▼
fetch() → /api/... → Express router → @libsql/client → SQLite
    │
    ▼
onSettled: invalidate query → re-fetch to confirm server state
```

### Drag and Drop

`@dnd-kit` is used with the `SortableContext` in `TodoList.tsx`. On drag end:

1. The filtered visible list is reordered with `arrayMove`
2. The result is merged back into the full (unfiltered) todo list
3. The merged list is written to the TanStack Query cache optimistically
4. `POST /api/todos/reorder` is fired to persist positions

---

## Database Schema

The SQLite database is stored at `data/todos.db` and is auto-created on first run.

```sql
CREATE TABLE todos (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  completed   INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true
  priority    TEXT NOT NULL DEFAULT 'medium',
  category    TEXT NOT NULL DEFAULT 'general',
  due_date    TEXT,                         -- ISO date string or NULL
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE categories (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1'
);

-- Seeded default categories
INSERT OR IGNORE INTO categories (id, name, color) VALUES
  ('cat-personal', 'Personal', '#8b5cf6'),
  ('cat-work',     'Work',     '#06b6d4'),
  ('cat-health',   'Health',   '#10b981'),
  ('cat-general',  'General',  '#6366f1');
```

---

## Common Issues & Fixes

### `vite: command not found` when running `npm run dev`
The local Vite binary must be used. The frontend `package.json` already points to `./node_modules/.bin/vite`. If you see this error, the frontend packages weren't installed — run:
```bash
npm install --prefix frontend
cd frontend && npm approve-scripts esbuild
```

### `better-sqlite3` build failure on Node 26
This project uses `@libsql/client` (pure JS) instead of `better-sqlite3` (native C++) specifically to avoid native compilation errors on Node 26+.

### TypeScript error: `Cannot find module '@dnd-kit/core'`
This is typically a **stale IDE language server cache**, not a real build error. Verify with:
```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```
If that passes with no errors, restart your editor's TS server:
- **VS Code:** `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

The `.vscode/settings.json` in this repo points `typescript.tsdk` to the local TypeScript install to prevent this.

### TypeScript error: `string | string[]` not assignable to `string` (Express v5)
Express v5 types widen `req.params` values to `string | string[]`. All route handlers in this project already cast with `req.params.id as string` to resolve this.

### Port already in use
```bash
# Kill whatever is on port 3001
lsof -ti:3001 | xargs kill -9

# Kill whatever is on port 5173
lsof -ti:5173 | xargs kill -9
```

---

## Scripts Reference

| Command | Directory | Description |
|---|---|---|
| `npm run dev` | root | Start both servers concurrently |
| `npm run install:all` | root | Install deps for root + backend + frontend |
| `npm run build` | root | Build frontend production bundle |
| `npm run dev` | `backend/` | Start backend with `tsx watch` (hot reload) |
| `npm run build` | `backend/` | Compile TypeScript to `backend/dist/` |
| `npm run start` | `backend/` | Run compiled backend (production) |
| `npm run dev` | `frontend/` | Start Vite dev server |
| `npm run build` | `frontend/` | Build frontend to `frontend/dist/` |
| `npm run preview` | `frontend/` | Preview production frontend build |
