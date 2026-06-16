import "dotenv/config";
import fs from "fs";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.error("Error: GEMINI_API_KEY not set in .env");
  process.exit(1);
}

// ─── Sample Dataset ──────────────────────────────────────────────────────────
const snippets = [
  "Python is a versatile programming language known for its simple syntax and readability. It is widely used in web development, data science, and artificial intelligence.",
  "JavaScript is the most popular language for web development. It runs in browsers and on servers through Node.js, making it extremely versatile.",
  "Cooking pasta requires boiling salted water and cooking the noodles until al dente. A good olive oil and fresh garlic make a simple but delicious sauce.",
  "The Eiffel Tower in Paris was built in 1889 for the World's Fair. It stands 330 meters tall and was the world's tallest structure until 1930.",
  "Machine learning is a subset of artificial intelligence that enables systems to learn from data. Neural networks are a common approach used in deep learning.",
  "The Amazon rainforest produces about 20 percent of the world's oxygen. It is home to more than 10 percent of all known species on Earth.",
  "Regular exercise improves cardiovascular health, strengthens muscles, and boosts mental well-being. Even 30 minutes of walking daily can make a significant difference.",
  "The stock market can be volatile and unpredictable. Diversifying your portfolio across different asset classes is a key strategy for managing risk.",
];

// ─── Generate Embeddings ────────────────────────────────────────────────────
async function getEmbedding(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

async function main() {
  console.log(`Generating embeddings for ${snippets.length} snippets...\n`);

  const results = [];

  for (let i = 0; i < snippets.length; i++) {
    const text = snippets[i];
    process.stdout.write(`  [${i + 1}/${snippets.length}] Embedding: "${text.slice(0, 60)}..." `);

    try {
      const embedding = await getEmbedding(text);
      results.push({ id: i + 1, text, embedding });
      console.log(`✓ (${embedding.length} dimensions)`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }

    // Small delay to avoid rate limiting
    if (i < snippets.length - 1) await new Promise((r) => setTimeout(r, 200));
  }

  // Save to JSON
  fs.writeFileSync("embeddings.json", JSON.stringify(results, null, 2));
  console.log(`\nSaved ${results.length} embeddings to embeddings.json`);
}

main().catch(console.error);
