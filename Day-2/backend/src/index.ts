import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import todosRouter from './routes/todos.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api', todosRouter)

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// Init DB then start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  Backend running at http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Failed to init database:', err)
  process.exit(1)
})
