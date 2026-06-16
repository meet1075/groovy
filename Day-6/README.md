# Day 6 — Groq API: First Calls & CLI Chatbot

Getting started with the **Groq API** using cURL, Node.js SDK, Python SDK, and building a multi-turn CLI chatbot with conversation history.

---

## What's Inside

```
Day-6/
├── .env              ← API key (never committed)
├── package.json      ← Node.js project config (type: module)
├── groq_hello.js     ← First API call — Node.js SDK
├── groq_hello.py     ← First API call — Python SDK
├── chatbot.js        ← Multi-turn CLI chatbot — Node.js
└── .venv/            ← Python virtual environment
```

---

## Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- A **Groq API key** — get one free at [console.groq.com](https://console.groq.com)

---

## Environment Setup

Create a `.env` file inside `Day-6/`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> `.env` is gitignored — your key is never pushed to version control.

---

## Node.js Setup

```bash
npm install
```

Installs: `groq-sdk`, `dotenv`

---

## Python Setup

```bash
python -m venv .venv
.venv/bin/pip install groq python-dotenv
```

---

## Files

### 1. `groq_hello.js` — First API call (Node.js)

Sends a single message to Groq and prints the response. Equivalent of the cURL call below.

**Run:**
```bash
node groq_hello.js
```

**Output:**
```
Model  : llama-3.3-70b-versatile
Role   : assistant
Content: Hello! I can help you with ...
```

---

### 2. `groq_hello.py` — First API call (Python)

Same single-message call using the Python Groq SDK.

**Run:**
```bash
.venv/bin/python groq_hello.py
```

**Output:**
```
Model  : llama-3.3-70b-versatile
Role   : assistant
Content: Hello! I can help you with ...
```

---

### 3. `chatbot.js` — Multi-turn CLI Chatbot (Node.js)

A 51-line terminal chatbot that:
- Maintains full **conversation history** across all turns
- Sends the complete history to the API on every message (so the model remembers context)
- Has a **system prompt** that sets the assistant's behavior
- Exits cleanly on `exit` or `Ctrl+C`

**Run:**
```bash
node chatbot.js
```

**Example session:**
```
🤖 Groq Chatbot  (type "exit" to quit)

You: hi, my name is Meet
Assistant: Hello Meet! How can I help you today?

You: what is my name?
Assistant: Your name is Meet, as you just told me!

You: exit
Bye!
```

**How history works:**
```
Turn 1 → [system, user1, assistant1]
Turn 2 → [system, user1, assistant1, user2, assistant2]
Turn 3 → [system, user1, assistant1, user2, assistant2, user3, assistant3]
```
The full array is sent to the API every call — that's what gives the model memory.

---

## cURL Equivalent (for reference)

The same API call that both SDK files reproduce:

```bash
curl "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [
      { "role": "user", "content": "Say hello and tell me what you can help me with." }
    ]
  }'
```

---

## API & Model Details

| Field | Value |
|---|---|
| **API Base URL** | `https://api.groq.com/openai/v1` |
| **Endpoint** | `POST /chat/completions` |
| **Model used** | `llama-3.3-70b-versatile` |
| **Auth header** | `Authorization: Bearer <GROQ_API_KEY>` |

---

## Key Concepts Covered

| Concept | Where |
|---|---|
| API key in `.env` | All files |
| Single-turn API call | `groq_hello.js`, `groq_hello.py` |
| Multi-turn with history | `chatbot.js` |
| System prompt | `chatbot.js` line 13–16 |
| Node.js ES modules (`import`) | `package.json` → `"type": "module"` |
| Python venv | `.venv/` |
| `readline` for CLI input | `chatbot.js` |
