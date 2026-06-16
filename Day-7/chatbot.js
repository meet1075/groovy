// Multi-Provider Interactive Chatbot — Day 7
// Choose your provider at startup, then chat freely
//
// Usage:
//   node chatbot.js --provider groq
//   node chatbot.js --provider gemini
//   node chatbot.js --provider cohere

import dotenv from "dotenv";
import readline from "readline";
dotenv.config();

// ─── Arg Parsing ─────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const provider = args[args.indexOf("--provider") + 1];
const VALID    = ["groq", "gemini", "cohere"];

if (!VALID.includes(provider)) {
  console.log(`Usage: node chatbot.js --provider <groq|gemini|cohere>`);
  process.exit(1);
}

// ─── Conversation History ─────────────────────────────────────────────────────
const history = [
  { role: "system", content: "You are a helpful assistant. Keep responses concise." },
];

// ─── Provider Functions ───────────────────────────────────────────────────────
async function callGroq(messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  return (await res.json()).choices[0].message.content;
}

async function callGemini(messages) {
  // Convert history to Gemini's "contents" format (skip system message)
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  return (await res.json()).candidates[0].content.parts[0].text;
}

async function callCohere(messages) {
  // Cohere v2 uses same messages format but no system role — prepend as first user message
  const cohereMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));
  const res = await fetch("https://api.cohere.com/v2/chat", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.COHERE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "command-a-03-2025", messages: cohereMessages }),
  });
  if (!res.ok) throw new Error(`Cohere error ${res.status}: ${await res.text()}`);
  return (await res.json()).message.content[0].text;
}

const providers = { groq: callGroq, gemini: callGemini, cohere: callCohere };

// ─── Chat Loop ────────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

const labels = {
  groq: "Groq (llama-3.3-70b)", gemini: "Gemini (2.5-flash)", cohere: "Cohere (command-a)",
};

console.log(`\n🤖 Chatbot — ${labels[provider]}  (type "exit" to quit)\n`);

while (true) {
  const input = await ask("You: ");
  if (!input.trim() || input.toLowerCase() === "exit") {
    console.log("Bye!"); rl.close(); break;
  }
  history.push({ role: "user", content: input.trim() });
  try {
    const reply = await providers[provider](history);
    history.push({ role: "assistant", content: reply });
    console.log(`\nAssistant: ${reply}\n`);
  } catch (err) {
    console.error(`\n❌ ${err.message}\n`);
  }
}
