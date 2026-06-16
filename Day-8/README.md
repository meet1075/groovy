# Day 8 — Multi-Provider Chatbot with Streaming, Retry & Token Tracking

Upgraded from Day 7 with three new capabilities: **streaming responses**, **automatic retry with exponential backoff**, and **token usage tracking**.

---

## What's New from Day 7

| Feature | Behavior |
|---|---|
| **Streaming** | Responses print token-by-token in real time — no waiting for the full response |
| **Retry with backoff** | Auto-retries on 429/5xx errors (1s → 2s → 4s → 8s → 16s, max 5 attempts) |
| **Token tracking** | Prints input/output/total tokens after each response |

---

## What's Inside

```
Day-8/
├── .env             ← API keys (never committed)
├── .env.example     ← Template — copy to .env and fill in keys
├── package.json     ← Node.js config (type: module)
├── chatbot.js       ← Interactive multi-turn chatbot with streaming
└── node_modules/
```

---

## Prerequisites

- **Node.js** v18+
- API keys for providers you want to use:

| Provider | Get Key |
|---|---|
| Groq | [console.groq.com](https://console.groq.com) |
| Google Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Cohere | [dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys) |

---

## Environment Setup

```bash
cp .env.example .env
# Fill in your API keys
npm install
```

---

## Usage

```bash
node chatbot.js --provider groq
node chatbot.js --provider gemini
node chatbot.js --provider cohere
```

Type `exit` or press `Ctrl+C` to quit.

---

## How It Works

### Streaming

Each provider streams responses differently:

| Provider | Format | How It Works |
|---|---|---|
| **Groq** | OpenAI-compatible SSE | `data: {JSON}` lines, `data: [DONE]` sentinel |
| **Gemini** | SSE via `?alt=sse` | `data: {JSON}` lines from `streamGenerateContent` |
| **Cohere** | Newline-delimited JSON | Each line is a JSON object with `event_type` field |

All three print tokens to stdout as they arrive — the response visibly "types out" in the terminal.

### Retry with Exponential Backoff

The `withRetry(fn, maxRetries=5)` helper wraps every API call:

- **Retries on:** HTTP 429 (rate limit), 5xx (server error)
- **Does NOT retry on:** 400 (bad request), 401 (auth error) — fails immediately
- **Backoff:** 1s → 2s → 4s → 8s → 16s (capped)
- **Max attempts:** 5

### Token Usage Tracking

After each response, a summary is printed:

```
──────────────────────────────────────────────────
Provider: groq | Input: 47 tokens | Output: 260 tokens | Total: 307 tokens
──────────────────────────────────────────────────
```

Token extraction per provider:

| Provider | Source |
|---|---|
| Groq | `chunk.usage` in final SSE chunk |
| Gemini | `chunk.usageMetadata` |
| Cohere | `event.response.meta.billed_units` in `stream-end` event |

---

## Code Structure

```
chatbot.js
├── withRetry(fn, maxRetries)    ← Shared retry helper
├── callGroq(messages)           ← Groq streaming
├── callGemini(messages)         ← Gemini streaming
├── callCohere(messages)         ← Cohere streaming
├── printTokenSummary(result)    ← Token display
└── Chat loop                    ← readline input → provider → display
```

Each provider function returns a normalized result:

```js
{
  provider: "groq",
  fullText: "The response text...",
  inputTokens: 47,
  outputTokens: 260,
  totalTokens: 307,
  responseTimeMs: 1234
}
```

---

## Provider Details

| Provider | Endpoint | Auth | Model |
|---|---|---|---|
| **Groq** | `api.groq.com/openai/v1/chat/completions` | `Authorization: Bearer` | `llama-3.3-70b-versatile` |
| **Gemini** | `generativelanguage.googleapis.com/v1beta/...` | `?key=` query param | `gemini-2.5-flash` |
| **Cohere** | `api.cohere.com/v1/chat` | `Authorization: Bearer` | `command-a-03-2025` |
