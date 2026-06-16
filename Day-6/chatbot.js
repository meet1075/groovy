// CLI Multi-turn Chatbot — Node.js + Groq
// Run: node chatbot.js

import Groq from "groq-sdk";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const history = [
  {
    role: "system",
    content: "You are a helpful assistant. Keep responses concise.",
  },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (prompt) => new Promise((res) => rl.question(prompt, res));

async function chat(userMessage) {
  history.push({ role: "user", content: userMessage });

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: history,
  });

  const reply = response.choices[0].message.content;
  history.push({ role: "assistant", content: reply });
  return reply;
}

console.log('🤖 Groq Chatbot  (type "exit" to quit)\n');

while (true) {
  const input = await ask("You: ");
  if (!input.trim() || input.toLowerCase() === "exit") {
    console.log("Bye!");
    rl.close();
    break;
  }
  const reply = await chat(input.trim());
  console.log(`\nAssistant: ${reply}\n`);
}
