# Ask My Notes

A full-stack web app where users upload a PDF, the app extracts text, and users can ask questions about the document with cited page numbers.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **LLM:** Groq API (llama-3.3-70b-versatile)
- **PDF Parsing:** pdf-parse

## Project Structure

```
Day-10/
├── server/
│   ├── config/db.js              # Prisma client
│   ├── controllers/
│   │   ├── documentController.js  # Upload, list, get document
│   │   └── queryController.js     # Ask questions, get history
│   ├── routes/
│   │   ├── documentRoutes.js      # Document endpoints
│   │   └── queryRoutes.js         # Query endpoints
│   ├── services/
│   │   ├── pdfService.js          # PDF text extraction
│   │   └── groqService.js         # Groq API + citation parsing
│   ├── middleware/
│   │   ├── upload.js              # Multer config
│   │   └── errorHandler.js        # Error handler
│   ├── prisma/schema.prisma       # Database schema
│   ├── server.js                  # Express entry point
│   └── .env                       # Environment variables
└── client/
    └── src/
        ├── components/
        │   ├── Sidebar.jsx            # Doc list, upload, new chat
        │   ├── UploadZone.jsx         # Drag-and-drop upload
        │   ├── QuestionInput.jsx      # Question text input
        │   ├── AnswerCard.jsx         # Answer with citations
        │   ├── ConversationHistory.jsx # Q&A list
        │   └── CostTelemetry.jsx      # Token/cost stats
        ├── pages/
        │   ├── Home.jsx               # Upload screen
        │   └── DocumentView.jsx       # Chat interface
        ├── hooks/
        │   ├── useDocument.js         # Document state
        │   └── useQueries.js          # Query state
        ├── services/api.js            # API client
        └── App.jsx
```

## Setup

### 1. Database

Create a `.env` file in `server/`:

```
DATABASE_URL="postgresql://neondb_owner:npg_xxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
GROQ_API_KEY=gsk_xxx
PORT=3001
```

Push the schema:

```bash
cd server
npm install
npx prisma db push
```

### 2. Backend

```bash
cd server
npm run dev
```

Server runs on http://localhost:3001

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Client runs on http://localhost:5174

## API Endpoints

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List all documents |
| POST | `/api/documents/upload` | Upload a PDF (multipart form) |
| GET | `/api/documents/:id` | Get document metadata |
| GET | `/api/documents/:id/pages/:pageNumber` | Get text for a page |

### Queries

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/:id/ask` | Ask a question about a document |
| GET | `/api/documents/:id/queries` | Get Q&A history for a document |

## Example API Calls

### Upload a PDF

```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -F "pdf=@document.pdf"
```

### Ask a Question

```bash
curl -X POST http://localhost:3001/api/documents/1/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?"}'
```

### Get Query History

```bash
curl http://localhost:3001/api/documents/1/queries
```

## Database Schema

### documents
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| filename | VARCHAR(255) | NOT NULL |
| uploaded_at | TIMESTAMP | DEFAULT NOW() |
| page_count | INTEGER | NOT NULL |
| total_chars | INTEGER | NOT NULL |

### document_pages
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| document_id | INTEGER | FK → documents(id) |
| page_number | INTEGER | NOT NULL |
| page_text | TEXT | NOT NULL |

### queries
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| document_id | INTEGER | FK → documents(id) |
| question | TEXT | NOT NULL |
| answer | TEXT | NOT NULL |
| cited_pages | INTEGER[] | Array of page numbers |
| input_tokens | INTEGER | NOT NULL |
| output_tokens | INTEGER | NOT NULL |
| estimated_cost_usd | NUMERIC(10,6) | NOT NULL |
| response_time_ms | INTEGER | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

## How It Works

1. User uploads a PDF → text is extracted per page and stored in PostgreSQL
2. User asks a question → all page texts are fetched from the DB
3. If the document fits within ~6000 tokens, full text is sent to Groq
4. If larger, keyword-based relevance scoring selects the top pages
5. Groq answers with page citations in `(p. X)` format
6. Citations are parsed and stored alongside the answer
7. Cost is calculated using Groq pricing ($0.59/1M input, $0.79/1M output)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GROQ_API_KEY` | Groq API key |
| `PORT` | Server port (default: 3001) |
