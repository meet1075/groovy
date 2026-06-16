// Day 8 — Multi-Provider Chatbot with Streaming, Retry & Token Tracking
// Usage:
//   node chatbot.js --provider groq
//   node chatbot.js --provider gemini
//   node chatbot.js --provider cohere

import dotenv from "dotenv";
import readline from "readline";
dotenv.config();

// ─── Arg Parsing ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const provider = args[args.indexOf("--provider") + 1];
const VALID = ["groq", "gemini", "cohere"];

if (!VALID.includes(provider)) {
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

      // Don't retry on 400 or 401 — these won't succeed on retry
      if (status === 400 || status === 401) {
        throw err;
      }

      // Only retry on 429 or 5xx
      const isRetryable = status === 429 || (status >= 500 && status < 600);
      if (!isRetryable && attempt > 1) {
        throw err;
      }
      if (!isRetryable) {
        throw err;
      }

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

// --- Groq (OpenAI-compatible SSE) ---
async function callGroq(messages) {
  const startTime = Date.now();
  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  await withRetry(async () => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, stream: true, stream_options: { include_usage: true } }),
    });

    if (!res.ok) {
      const err = new Error(`Groq error ${res.status}`);
      err.status = res.status;
      throw err;
    }

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
          if (delta) {
            fullText += delta;
            process.stdout.write(delta);
          }
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens || 0;
            outputTokens = chunk.usage.completion_tokens || 0;
          }
        } catch {}
      }
    }
  });

  return {
    provider: "groq",
    fullText,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    responseTimeMs: Date.now() - startTime,
  };
}

// --- Gemini (streamGenerateContent with SSE) ---
async function callGemini(messages) {
  const startTime = Date.now();
  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  await withRetry(async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    if (!res.ok) {
      const err = new Error(`Gemini error ${res.status}`);
      err.status = res.status;
      throw err;
    }

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
          if (text) {
            fullText += text;
            process.stdout.write(text);
          }
          if (chunk.usageMetadata) {
            inputTokens = chunk.usageMetadata.promptTokenCount || 0;
            outputTokens = chunk.usageMetadata.candidatesTokenCount || 0;
          }
        } catch {}
      }
    }
  });

  return {
    provider: "gemini",
    fullText,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    responseTimeMs: Date.now() - startTime,
  };
}

// --- Cohere (v1/chat streaming, newline-delimited JSON) ---
async function callCohere(messages) {
  const startTime = Date.now();
  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  // Cohere v1/chat uses `message` (current) + `chat_history` (previous)
  const chatHistory = messages
    .filter((m) => m.role !== "system")
    .slice(0, -1)
    .map((m) => ({ role: m.role === "assistant" ? "CHATBOT" : "USER", message: m.content }));
  const currentMessage = messages[messages.length - 1]?.content || "";

  await withRetry(async () => {
    const res = await fetch("https://api.cohere.com/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-a-03-2025",
        message: currentMessage,
        chat_history: chatHistory,
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = new Error(`Cohere error ${res.status}`);
      err.status = res.status;
      throw err;
    }

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

          if (event.event_type === "text-generation") {
            const text = event.text;
            if (text) {
              fullText += text;
              process.stdout.write(text);
            }
          }

          if (event.event_type === "stream-end") {
            const billed = event.response?.meta?.billed_units;
            if (billed) {
              inputTokens = billed.input_tokens || 0;
              outputTokens = billed.output_tokens || 0;
            }
          }
        } catch {}
      }
    }
  });

  return {
    provider: "cohere",
    fullText,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    responseTimeMs: Date.now() - startTime,
  };
}

const providers = { groq: callGroq, gemini: callGemini, cohere: callCohere };

// ─── Token Summary Display ────────────────────────────────────────────────────
function printTokenSummary(result) {
  console.log("");
  console.log("─".repeat(50));
  console.log(
    `Provider: ${result.provider} | ` +
    `Input: ${result.inputTokens} tokens | ` +
    `Output: ${result.outputTokens} tokens | ` +
    `Total: ${result.totalTokens} tokens`
  );
  console.log("─".repeat(50));
}

// ─── Chat Loop ────────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

const labels = {
  groq: "Groq (llama-3.3-70b)",
  gemini: "Gemini (2.5-flash)",
  cohere: "Cohere (command-a)",
};

console.log(`\n🤖 Chatbot — ${labels[provider]}  (type "exit" to quit)`);
console.log(`   Streaming responses • Auto-retry • Token tracking\n`);

while (true) {
  const input = await ask("You: ");
  if (!input.trim() || input.toLowerCase() === "exit") {
    console.log("Bye!");
    rl.close();
    break;
  }

  history.push({ role: "user", content: input.trim() });

  try {
    const result = await providers[provider](history);
    history.push({ role: "assistant", content: result.fullText });
    printTokenSummary(result);
  } catch (err) {
    const status = err.status || 0;
    if (status === 401) {
      console.error(`\n❌ Authentication failed — check your API key for ${provider}.\n`);
    } else if (status === 400) {
      console.error(`\n❌ Bad request — ${err.message}\n`);
    } else {
      console.error(`\n❌ ${err.message}\n`);
    }
  }
}
