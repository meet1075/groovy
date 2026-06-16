// Node.js SDK — Groq API
// API key loaded from .env
// Run: node --input-type=module < groq_hello.js

import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const response = await client.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "user",
      content: "Say hello and tell me what you can help me with.",
    },
  ],
});

console.log("Model  :", response.model);
console.log("Role   :", response.choices[0].message.role);
console.log("Content:", response.choices[0].message.content);
