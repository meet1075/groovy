import "dotenv/config";
import fs from "fs";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

if (!GEMINI_KEY) {
  console.error("Error: GEMINI_API_KEY not set in .env");
  process.exit(1);
}

// ─── Cosine Similarity ──────────────────────────────────────────────────────
// Formula: cos(A, B) = (A · B) / (||A|| × ||B||)
//
// - A · B is the dot product: sum of A[i] * B[i] for all i
// - ||A|| is the magnitude (L2 norm): sqrt(sum of A[i]^2 for all i)
// - Result ranges from -1 (opposite) to 1 (identical)

function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
  }

  // Step 1: Dot product (A · B)
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  // Step 2: Magnitude of A (||A||)
  let magnitudeA = 0;
  for (let i = 0; i < vecA.length; i++) {
    magnitudeA += vecA[i] * vecA[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);

  // Step 3: Magnitude of B (||B||)
  let magnitudeB = 0;
  for (let i = 0; i < vecB.length; i++) {
    magnitudeB += vecB[i] * vecB[i];
  }
  magnitudeB = Math.sqrt(magnitudeB);

  // Step 4: Cosine similarity
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// ─── Get Embedding from Gemini ───────────────────────────────────────────────
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

// ─── Groq Answer Generation ─────────────────────────────────────────────────
async function generateAnswer(context, question) {
  if (!GROQ_KEY) {
    console.log("\n  (Groq API key not set — skipping answer generation)");
    return null;
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Answer the question using ONLY the provided context. If the context doesn't contain enough information, say so. Be concise.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    console.log(`\n  (Groq API error ${res.status})`);
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const query = process.argv[2];
  if (!query) {
    console.log("Usage: node search.js \"your question here\"");
    console.log('Example: node search.js "What is the topic about cooking?"');
    process.exit(1);
  }

  // Load embeddings
  if (!fs.existsSync("embeddings.json")) {
    console.error("Error: embeddings.json not found. Run 'node generate-embeddings.js' first.");
    process.exit(1);
  }

  const stored = JSON.parse(fs.readFileSync("embeddings.json", "utf-8"));
  console.log(`Loaded ${stored.length} embeddings from embeddings.json\n`);

  // Get query embedding
  process.stdout.write(`Generating embedding for query... `);
  const queryEmbedding = await getEmbedding(query);
  console.log(`✓ (${queryEmbedding.length} dimensions)\n`);

  // Compute similarities
  console.log("─".repeat(70));
  console.log("COSINE SIMILARITY RESULTS");
  console.log("─".repeat(70));
  console.log(`Query: "${query}"\n`);

  const results = stored.map((item) => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Print results
  for (const r of results) {
    const bar = "█".repeat(Math.round(r.score * 30));
    console.log(`  ${r.score.toFixed(4)}  ${bar}`);
    console.log(`        "${r.text}"\n`);
  }

  // Groq answer using most similar snippet
  const best = results[0];
  console.log("─".repeat(70));
  console.log("GROQ ANSWER (using most similar snippet as context)");
  console.log("─".repeat(70));
  console.log(`Best match: [score: ${best.score.toFixed(4)}] "${best.text.slice(0, 80)}..."\n`);

  const answer = await generateAnswer(best.text, query);
  if (answer) {
    console.log(`Answer: ${answer}`);
  }

  // Show the math breakdown for the top result
  console.log("\n" + "─".repeat(70));
  console.log("MATH BREAKDOWN (top result)");
  console.log("─".repeat(70));

  const q = queryEmbedding;
  const s = best.embedding;
  let dot = 0, magQ = 0, magS = 0;
  for (let i = 0; i < q.length; i++) {
    dot += q[i] * s[i];
    magQ += q[i] * q[i];
    magS += s[i] * s[i];
  }
  magQ = Math.sqrt(magQ);
  magS = Math.sqrt(magS);

  console.log(`  Dot product (A · B):  ${dot.toFixed(6)}`);
  console.log(`  ||Query|| magnitude:  ${magQ.toFixed(6)}`);
  console.log(`  ||Snippet|| magnitude: ${magS.toFixed(6)}`);
  console.log(`  cos(θ) = ${dot.toFixed(6)} / (${magQ.toFixed(6)} × ${magS.toFixed(6)})`);
  console.log(`  cos(θ) = ${dot.toFixed(6)} / ${(magQ * magS).toFixed(6)}`);
  console.log(`  cos(θ) = ${best.score.toFixed(6)}`);
}

main().catch(console.error);
