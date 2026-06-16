# Vector Q&A

A full-stack PDF question-answering application powered by vector embeddings and semantic search.

## Tech Stack

**Backend:** Node.js, Express, Prisma ORM, PostgreSQL (Neon), Pinecone, Gemini (embeddings), Groq (LLM)  
**Frontend:** React 19, Tailwind CSS, Vite

## How It Works

1. **Upload** a PDF
2. **Extract** text → split into ~1500-char chunks with 200-char overlap
3. **Embed** each chunk using Gemini `gemini-embedding-001` (3072 dimensions)
4. **Store** vectors in Pinecone (serverless, cosine similarity) + metadata in PostgreSQL
5. **Ask** a question → embed query → retrieve top-3 chunks from Pinecone
6. **Answer** with Groq (`llama-3.3-70b-versatile`) using retrieved chunks as context
7. **Cite** page numbers using `p. X` format

## Architecture

```
┌─────────┐     ┌──────────┐     ┌─────────┐
│  React  │────▶│  Express │────▶│ Pinecone│ (vector search)
│  (Vite) │     │  :3001   │     └─────────┘
└─────────┘     └────┬─────┘
                     │        ┌─────────┐
                     ├───────▶│ Gemini  │ (embeddings)
                     │        └─────────┘
                     │        ┌─────────┐
                     ├───────▶│  Groq   │ (answer generation)
                     │        └─────────┘
                     │        ┌─────────┐
                     └───────▶│ Neon DB │ (metadata + chat history)
                              └─────────┘
```

## Setup

### Server

```bash
cd server
cp .env.example .env   # Add your API keys
npm install
npx prisma db push
npm run dev             # http://localhost:3001
```

### Client

```bash
cd client
npm install
npm run dev             # http://localhost:5174
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon with `?sslmode=require`) |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GROQ_API_KEY` | Groq API key |
| `PINECONE_API_KEY` | Pinecone API key |

## Features

- Semantic search via Pinecone vector DB
- Page-level citations
- Chat history stored in PostgreSQL
- Cost telemetry per query
- Collapsible sidebar with document list
- Drag & drop PDF upload
- Dark mode reading-tool aesthetic
