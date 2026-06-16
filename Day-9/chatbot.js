// Day 9 — Multi-Provider Chatbot with CSV Logging, Streaming, Retry & Provider Switching
// Usage:
//   node chatbot.js --provider groq
//   node chatbot.js --provider gemini
//   node chatbot.js --provider cohere
//   PageUp/PageDown to switch providers during session

import dotenv from "dotenv";
import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, "usage_log.csv");

// ─── CSV Helpers ──────────────────────────────────────────────────────────────
const CSV_HEADERS = [
  "Date & Time",
  "Provider",
  "Model",
  "Input Tokens",
  "Output Tokens",
  "Total Tokens",
  "Response Time (ms)",
  "Estimated Cost (USD)",
  "Status",
  "Prompt (first 50 chars)",
].join(",") + "\n";

const PRICING = {
  groq:   { model: "llama-3.3-70b-versatile", input: 0.59, output: 0.79 },
  gemini: { model: "gemini-2.5-flash",         input: 0.30, output: 2.50 },
  cohere: { model: "command-a-03-2025",        input: 2.50, output: 10.00 },
};

function calcCost(provider, inputTokens, outputTokens) {
  const p = PRICING[provider];
  if (!p) return "0.000000";
  const cost = (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
  return cost.toFixed(6);
}

function escapeCsv(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true,
  });
}

function ensureCsvExists() {
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, CSV_HEADERS);
  }
}

function logToCsv({ provider, inputTokens, outputTokens, totalTokens, responseTimeMs, status, prompt }) {
  ensureCsvExists();
  const pricing = PRICING[provider] || {};
  const preview = (prompt || "").slice(0, 50);
  const row = [
    escapeCsv(formatDate(new Date().toISOString())),
    provider.charAt(0).toUpperCase() + provider.slice(1),
    pricing.model || "unknown",
    inputTokens || 0,
    outputTokens || 0,
    totalTokens || 0,
    responseTimeMs || 0,
    "$" + calcCost(provider, inputTokens || 0, outputTokens || 0),
    status === "success" ? "Success" : "Error",
    escapeCsv(preview),
  ].join(",");
  fs.appendFileSync(CSV_PATH, row + "\n");
}

// ─── Arg Parsing ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let currentProvider = args[args.indexOf("--provider") + 1] || "groq";
const VALID = ["groq", "gemini", "cohere"];

if (!VALID.includes(currentProvider)) {
  console.log(`Usage: node chatbot.js --provider <groq|gemini|cohere>`);
  process.exit(1);
}

// ─── Retry Helper ─────────────────────────────────────────────────────────────
async function withRetry(fn, maxRetries = 5) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.status || err.statusCode || 0;
      if (status === 400 || status === 401) throw err;
      const isRetryable = status === 429 || (status >= 500 && status < 600);
      if (!isRetryable) throw err;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
      console.log(`\n⚠️  Rate limited, retrying in ${delay / 1000}s... (attempt ${attempt}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ─── Conversation History ─────────────────────────────────────────────────────
const history = [
  { role: "system", content: "You are a helpful assistant. Keep responses concise." },
];

// ─── Streaming Provider Functions ─────────────────────────────────────────────

async function callGroq(messages) {
  const startTime = Date.now();
  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  await withRetry(async () => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, stream: true, stream_options: { include_usage: true } }),
    });
    if (!res.ok) { const e = new Error(`Groq error ${res.status}`); e.status = res.status; throw e; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") break;
        try {
          const chunk = JSON.parse(data);
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) { fullText += delta; process.stdout.write(delta); }
          if (chunk.usage) { inputTokens = chunk.usage.prompt_tokens || 0; outputTokens = chunk.usage.completion_tokens || 0; }
        } catch {}
      }
    }
  });

  return { provider: "groq", fullText, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, responseTimeMs: Date.now() - startTime };
}

async function callGemini(messages) {
  const startTime = Date.now();
  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const contents = messages.filter((m) => m.role !== "system").map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  await withRetry(async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents }) });
    if (!res.ok) { const e = new Error(`Gemini error ${res.status}`); e.status = res.status; throw e; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        try {
          const chunk = JSON.parse(trimmed.slice(6));
          const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) { fullText += text; process.stdout.write(text); }
          if (chunk.usageMetadata) { inputTokens = chunk.usageMetadata.promptTokenCount || 0; outputTokens = chunk.usageMetadata.candidatesTokenCount || 0; }
        } catch {}
      }
    }
  });

  return { provider: "gemini", fullText, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, responseTimeMs: Date.now() - startTime };
}

async function callCohere(messages) {
  const startTime = Date.now();
  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const chatHistory = messages.filter((m) => m.role !== "system").slice(0, -1)
    .map((m) => ({ role: m.role === "assistant" ? "CHATBOT" : "USER", message: m.content }));
  const currentMessage = messages[messages.length - 1]?.content || "";

  await withRetry(async () => {
    const res = await fetch("https://api.cohere.com/v1/chat", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.COHERE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "command-a-03-2025", message: currentMessage, chat_history: chatHistory, stream: true }),
    });
    if (!res.ok) { const e = new Error(`Cohere error ${res.status}`); e.status = res.status; throw e; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed);
          if (event.event_type === "text-generation" && event.text) { fullText += event.text; process.stdout.write(event.text); }
          if (event.event_type === "stream-end") {
            const billed = event.response?.meta?.billed_units;
            if (billed) { inputTokens = billed.input_tokens || 0; outputTokens = billed.output_tokens || 0; }
          }
        } catch {}
      }
    }
  });

  return { provider: "cohere", fullText, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, responseTimeMs: Date.now() - startTime };
}

const providers = { groq: callGroq, gemini: callGemini, cohere: callCohere };

// ─── Token Summary Display ────────────────────────────────────────────────────
function printTokenSummary(result) {
  console.log("");
  console.log("─".repeat(50));
  console.log(`Provider: ${result.provider} | Input: ${result.inputTokens} tokens | Output: ${result.outputTokens} tokens | Total: ${result.totalTokens} tokens`);
  console.log("─".repeat(50));
}

// ─── Chat Loop with PageUp/PageDown Provider Switching ────────────────────────
const isTTY = process.stdin.isTTY;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !isTTY });

// Handle raw key events for PageUp/PageDown (only in TTY mode)
if (isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("data", (data) => {
    const seq = data.toString();
    if (seq === "\x1b[5~") {
      const idx = (VALID.indexOf(currentProvider) - 1 + VALID.length) % VALID.length;
      currentProvider = VALID[idx];
      updatePrompt();
    } else if (seq === "\x1b[6~") {
      const idx = (VALID.indexOf(currentProvider) + 1) % VALID.length;
      currentProvider = VALID[idx];
      updatePrompt();
    }
  });
}

const labels = {
  groq: "Groq (llama-3.3-70b)",
  gemini: "Gemini (2.5-flash)",
  cohere: "Cohere (command-a)",
};

let currentPrompt = `[${labels[currentProvider]}] You: `;

function updatePrompt() {
  currentPrompt = `[${labels[currentProvider]}] You: `;
  process.stdout.write("\r\x1b[K" + currentPrompt);
}

function ask(q) {
  if (!isTTY) {
    // Non-TTY mode (piped input) — use readline
    return new Promise((res) => rl.question(q, res));
  }
  // TTY mode — raw input for PageUp/PageDown support
  return new Promise((res) => {
    process.stdout.write(q);
    let line = "";
    const onData = (data) => {
      const str = data.toString();
      if (str === "\r" || str === "\n") {
        process.stdin.removeListener("data", onData);
        console.log();
        res(line);
        return;
      }
      if (str === "\x7f" || str === "\b") {
        if (line.length > 0) { line = line.slice(0, -1); process.stdout.write("\b \b"); }
        return;
      }
      if (str.startsWith("\x1b")) return;
      line += str;
      process.stdout.write(str);
    };
    process.stdin.on("data", onData);
  });
}

console.log(`\n🤖 Chatbot — ${labels[currentProvider]}`);
console.log(`   Streaming • Retry • Token tracking • CSV logging`);
console.log(`   PageUp/PageDown to switch provider • Type "exit" to quit\n`);

while (true) {
  const input = await ask(currentPrompt);
  if (!input.trim() || input.toLowerCase() === "exit") {
    console.log("Bye!");
    if (isTTY) process.stdin.setRawMode(false);
    rl.close();
    break;
  }

  history.push({ role: "user", content: input.trim() });

  try {
    const result = await providers[currentProvider](history);
    history.push({ role: "assistant", content: result.fullText });
    printTokenSummary(result);
    logToCsv({ ...result, status: "success", prompt: input.trim() });
  } catch (err) {
    const status = err.status || 0;
    if (status === 401) {
      console.error(`\n❌ Authentication failed — check your API key for ${currentProvider}.\n`);
    } else if (status === 400) {
      console.error(`\n❌ Bad request — ${err.message}\n`);
    } else {
      console.error(`\n❌ ${err.message}\n`);
    }
    logToCsv({ provider: currentProvider, inputTokens: 0, outputTokens: 0, totalTokens: 0, responseTimeMs: 0, status: "error", prompt: input.trim() });
  }
}
