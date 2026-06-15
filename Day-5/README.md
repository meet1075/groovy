# Student Management System

A full-stack student management application built with **React + Vite** on the frontend and **Express + Prisma + PostgreSQL (Neon)** on the backend.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Validation Rules](#validation-rules)
- [Seeding the Database](#seeding-the-database)

---

## Project Overview

This app allows you to:
- View all students in a paginated, searchable table
- Filter students by **status** (active / inactive / graduated) and **course**
- Add, edit, and delete students with full form validation
- See live stats (total, active, graduated, inactive) on the dashboard
- Get toast notifications on every CRUD operation

---

## Tech Stack

### Frontend (`/client`)
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI library |
| Vite | 5.4 | Dev server & bundler |
| React Router DOM | 6.27 | Client-side routing |
| Axios | 1.7 | HTTP client for API calls |
| Vanilla CSS | — | Styling (no CSS framework) |

### Backend (`/server`)
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.21 | HTTP server & routing |
| Prisma | 6.3 | ORM & database client |
| PostgreSQL (Neon) | — | Hosted database |
| express-validator | 7.2 | Request body validation |
| dotenv | 16.4 | Environment variable loading |
| nodemon | 3.1 | Auto-restart in development |
| cors | 2.8 | Cross-origin request handling |

---

## Project Structure

```
Day-5/
├── client/                        # React frontend
│   ├── index.html                 # HTML entry point
│   ├── vite.config.js             # Vite config + dev proxy
│   ├── package.json
│   └── src/
│       ├── main.jsx               # React DOM render root
│       ├── App.jsx                # Root layout, routing, toast state
│       ├── index.css              # Global styles & CSS variables
│       ├── services/
│       │   └── api.js             # Axios instance + all API functions
│       ├── hooks/
│       │   └── useStudents.js     # Custom hook: fetch, filter, paginate
│       ├── pages/
│       │   ├── Dashboard.jsx      # Main listing page
│       │   └── AddEditStudent.jsx # Add / Edit form page
│       └── components/
│           ├── Sidebar.jsx        # Navigation sidebar
│           ├── TopBar.jsx         # Page header bar
│           ├── StatCards.jsx      # Dashboard stat summary cards
│           ├── SearchFilterBar.jsx # Search input + status/course filters
│           ├── StudentTable.jsx   # Student data table with actions
│           ├── Pagination.jsx     # Page navigation controls
│           ├── ConfirmDeleteModal.jsx # Delete confirmation dialog
│           ├── Toast.jsx          # Notification toasts
│           ├── SkeletonTable.jsx  # Loading skeleton for table
│           └── EmptyState.jsx     # Empty state when no results
│
└── server/                        # Express backend
    ├── server.js                  # Entry point: Express app setup
    ├── package.json
    ├── .env                       # Environment variables (not committed)
    ├── config/
    │   └── db.js                  # Prisma client singleton
    ├── routes/
    │   └── studentRoutes.js       # Route definitions for /api/students
    ├── controllers/
    │   └── studentController.js   # CRUD logic for all student operations
    ├── middleware/
    │   ├── validateStudent.js     # express-validator rules for student fields
    │   └── errorHandler.js        # Global error handler middleware
    └── prisma/
        ├── schema.prisma          # Database schema / Student model
        └── seed.js                # Script to populate sample student data
```

---

## Prerequisites

Make sure the following are installed on your machine:

- **Node.js** v18 or higher — [Download](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- A **PostgreSQL** database (this project uses [Neon](https://neon.tech) — a free serverless Postgres host)

Check versions:
```bash
node -v
npm -v
```

---

## Environment Setup

The server requires a `.env` file inside the `server/` folder.

### `server/.env`
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
PORT=5000
```

- `DATABASE_URL` — Your full PostgreSQL connection string. Get this from your Neon dashboard (or any Postgres host).
- `PORT` — The port the Express server listens on. Defaults to `5000` if not set.

> **Never commit your `.env` file.** It is already listed in the root `.gitignore`.

To get a free Neon database:
1. Go to [neon.tech](https://neon.tech) → Sign up → Create a project
2. Copy the connection string from the **Dashboard → Connection Details**
3. Paste it as `DATABASE_URL` in your `.env`

---

## Database Setup

Run the following commands **from inside the `server/` directory**:

### Step 1 — Install dependencies
```bash
cd server
npm install
```

### Step 2 — Push schema to database
This creates the `students` table in your PostgreSQL database based on `prisma/schema.prisma`:
```bash
npm run db:push
```

### Step 3 — Generate Prisma client
```bash
npm run db:generate
```

### Step 4 — (Optional) Seed sample data
Populates the database with 12 sample students:
```bash
npm run db:seed
```

---

## Running the App

You need to run **both** the server and client in separate terminals.

### Terminal 1 — Start the Backend

```bash
cd server
npm run dev
```

Expected output:
```
Server running on port 5000
```

The API is now available at: `http://localhost:5000`

### Terminal 2 — Start the Frontend

```bash
cd client
npm install     # only needed first time
npm run dev
```

Expected output:
```
  VITE v5.x  ready in Xms
  ➜  Local:   http://localhost:3000/
```

Open your browser at: **http://localhost:3000**

> The Vite dev server proxies all `/api` requests to `http://localhost:5000`, so you don't need to change any URLs.

---

## API Reference

**Base URL:** `http://localhost:5000/api`

### Health Check

```
GET /api/health
```
Response:
```json
{ "success": true, "message": "Server is running" }
```

---

### Students Endpoints

#### GET `/api/students` — Get all students (paginated)

Supports optional query parameters for filtering and pagination:

| Query Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Case-insensitive search on first name, last name, or email |
| `status` | string | — | Filter by `active`, `inactive`, or `graduated` |
| `course` | string | — | Case-insensitive filter by course name |
| `page` | number | `1` | Page number |
| `limit` | number | `9` | Records per page |

**Example:**
```bash
curl "http://localhost:5000/api/students?search=aarav&status=active&page=1&limit=9"
```

**Response:**
```json
{
  "success": true,
  "data": [ { "id": 1, "firstName": "Aarav", ... } ],
  "message": "Students fetched successfully",
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 9,
    "totalPages": 2
  }
}
```

---

#### GET `/api/students/:id` — Get student by ID

```bash
curl http://localhost:5000/api/students/1
```

**Response (200):**
```json
{
  "success": true,
  "data": { "id": 1, "firstName": "Aarav", "lastName": "Sharma", ... },
  "message": "Student fetched successfully"
}
```

**Response (404):**
```json
{ "success": false, "data": null, "message": "Student not found" }
```

---

#### POST `/api/students` — Create a new student

```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543200",
    "date_of_birth": "2002-06-15",
    "gender": "Male",
    "course": "B.Tech CSE",
    "enrollment_year": 2023,
    "status": "active"
  }'
```

**Response (201):**
```json
{
  "success": true,
  "data": { "id": 13, "firstName": "John", ... },
  "message": "Student created successfully"
}
```

**Response (409) — Email already exists:**
```json
{ "success": false, "data": null, "message": "A student with this email already exists" }
```

---

#### PUT `/api/students/:id` — Update a student

Same request body as POST. All fields are re-validated.

```bash
curl -X PUT http://localhost:5000/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{ "first_name": "Aarav", "last_name": "Sharma", "email": "aarav@new.com", "course": "B.Tech CSE", "enrollment_year": 2023, "status": "graduated" }'
```

**Response (200):**
```json
{ "success": true, "data": { "id": 1, ... }, "message": "Student updated successfully" }
```

---

#### DELETE `/api/students/:id` — Delete a student

```bash
curl -X DELETE http://localhost:5000/api/students/1
```

**Response (200):**
```json
{ "success": true, "data": { "id": 1, ... }, "message": "Student deleted successfully" }
```

---

## Frontend Architecture

### Routing

Defined in `App.jsx` using React Router v6:

| Path | Component | Description |
|---|---|---|
| `/` | `Dashboard.jsx` | Lists all students with filters and pagination |
| `/add` | `AddEditStudent.jsx` | Form to create a new student |
| `/edit/:id` | `AddEditStudent.jsx` | Form pre-filled for editing a student |

### Data Flow

```
useStudents (hook)
    │
    ├── calls api.js (Axios) → server /api/students
    │
    ├── manages: students, pagination, filters, loading, error
    │
    └── returned to Dashboard.jsx → passed to child components
```

### Custom Hook: `useStudents`

Located at `src/hooks/useStudents.js`. Handles:
- Fetching paginated students with active filters
- Fetching all students separately (for stat cards)
- **Debounced search** — waits 500ms after typing before firing API call
- `setFilter(key, value)` — updates any filter and resets to page 1
- `setPage(page)` — updates pagination
- `refetch()` / `refetchAll()` — manually re-trigger API calls after mutations

### API Service: `src/services/api.js`

Axios instance with:
- `baseURL`: reads from `VITE_API_URL` env var, falls back to `/api` (proxied by Vite)
- `Content-Type: application/json` header set by default

Exported functions:
| Function | Method | Endpoint |
|---|---|---|
| `getStudents(params)` | GET | `/students` |
| `getStudentById(id)` | GET | `/students/:id` |
| `createStudent(data)` | POST | `/students` |
| `updateStudent(id, data)` | PUT | `/students/:id` |
| `deleteStudent(id)` | DELETE | `/students/:id` |

### Vite Proxy (dev only)

`vite.config.js` proxies all frontend `/api` calls to the backend:
```js
proxy: {
  '/api': { target: 'http://localhost:5000', changeOrigin: true }
}
```
This means in development, the frontend hits `/api/students` and Vite forwards it to `http://localhost:5000/api/students`. No CORS issues during development.

---

## Backend Architecture

### Entry Point: `server.js`

- Loads `.env` via `dotenv`
- Mounts `cors()` and `express.json()` middleware
- Mounts student routes at `/api/students`
- Mounts global error handler last
- Listens on `PORT` (default `5000`)

### Database: `config/db.js`

Exports a **singleton** Prisma client instance to prevent multiple connections during hot-reload in development.

### Routes: `routes/studentRoutes.js`

| Method | Path | Middleware | Controller |
|---|---|---|---|
| GET | `/` | — | `getAllStudents` |
| GET | `/:id` | — | `getStudentById` |
| POST | `/` | `validateStudent` | `createStudent` |
| PUT | `/:id` | `validateStudent` | `updateStudent` |
| DELETE | `/:id` | — | `deleteStudent` |

### Controller: `controllers/studentController.js`

Each function:
1. Reads params/body from `req`
2. Calls `prisma.student.*` method
3. Returns a consistent JSON shape: `{ success, data, message }`
4. Passes any error to `next(err)` for the global error handler

**`getAllStudents`** builds a Prisma `where` clause dynamically:
- `search` → `OR` across `firstName`, `lastName`, `email` (case-insensitive)
- `status` → exact match
- `course` → contains (case-insensitive)
- Uses `Promise.all` to fetch data and count in parallel

### Middleware

#### `validateStudent.js`
Uses `express-validator` chains to validate all student fields before the controller runs. Returns a `400` response with all validation error messages joined if any check fails.

#### `errorHandler.js`
Global error handler — catches any `next(err)` calls and returns a `500` JSON response.

---

## Validation Rules

Applied on both **POST** (create) and **PUT** (update):

| Field | Required | Rules |
|---|---|---|
| `first_name` | Yes | Non-empty, max 50 chars |
| `last_name` | Yes | Non-empty, max 50 chars |
| `email` | Yes | Valid email format, normalized, unique in DB |
| `phone` | No | Max 15 chars |
| `date_of_birth` | No | ISO 8601 date format (e.g. `2002-06-15`) |
| `gender` | No | Must be `Male`, `Female`, or `Other` |
| `course` | Yes | Non-empty, max 100 chars |
| `enrollment_year` | Yes | Integer between 2000 and 2030 |
| `status` | No | Must be `active`, `inactive`, or `graduated` |

---

## Seeding the Database

The seed file at `server/prisma/seed.js` inserts 12 sample students using `upsert` (safe to run multiple times — won't duplicate records).

```bash
cd server
npm run db:seed
```

Sample students cover a range of:
- **Courses:** B.Tech CSE, B.Tech ECE, B.Tech ME, B.Tech IT, BCA, B.Com, B.Sc Mathematics, B.Sc Physics
- **Statuses:** active, inactive, graduated
- **Enrollment years:** 2021 – 2024

---

## Database Schema

```prisma
model Student {
  id             Int       @id @default(autoincrement())
  firstName      String    @map("first_name")    @db.VarChar(50)
  lastName       String    @map("last_name")     @db.VarChar(50)
  email          String    @unique               @db.VarChar(100)
  phone          String?                         @db.VarChar(15)
  dateOfBirth    DateTime? @map("date_of_birth")
  gender         String?                         @db.VarChar(10)
  course         String                          @db.VarChar(100)
  enrollmentYear Int       @map("enrollment_year")
  status         String    @default("active")    @db.VarChar(20)
  createdAt      DateTime  @default(now())       @map("created_at")
  updatedAt      DateTime  @default(now())       @map("updated_at")

  @@map("students")
}
```

> Prisma maps camelCase field names (used in JS) to snake_case column names (used in the database) via `@map`.
