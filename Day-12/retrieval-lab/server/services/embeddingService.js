const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

const GEMINI_MODEL = "gemini-embedding-001";
const GROQ_MODEL = "nomic-embed-text-v1.5";

const BATCH_SIZE = 5;
const DELAY_BETWEEN_CALLS = 250;
const COOLDOWN_BETWEEN_STRATEGIES = 15000;
const MAX_RETRIES = 5;

export { COOLDOWN_BETWEEN_STRATEGIES };

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    if (res.status === 429 || res.status === 503) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.log(`API ${res.status}, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retries + 1})`);
      await sleep(delay);
      continue;
    }
    const err = await res.text();
    throw new Error(`Embedding API error ${res.status}: ${err}`);
  }
  throw new Error("Embedding API: max retries exceeded");
}

async function getGeminiEmbedding(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:embedContent?key=${GEMINI_KEY}`;
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  });
  const data = await res.json();
  return data.embedding.values;
}

async function getGroqEmbedding(text) {
  const url = "https://api.groq.com/openai/v1/embeddings";
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: GROQ_MODEL, input: text }),
  });
  const data = await res.json();
  return data.data[0].embedding;
}

export async function getEmbedding(text, provider = "gemini") {
  if (provider === "groq") return getGroqEmbedding(text);
  return getGeminiEmbedding(text);
}

export async function getEmbeddingWithFallback(text) {
  try {
    const values = await getGeminiEmbedding(text);
    return { values, provider: "gemini" };
  } catch (err) {
    console.log(`Gemini failed, falling back to Groq: ${err.message}`);
    const values = await getGroqEmbedding(text);
    return { values, provider: "groq" };
  }
}

export async function getEmbeddingsWithFallback(texts) {
  const allResults = [];
  let activeProvider = "gemini";

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const results = [];

    for (const text of batch) {
      try {
        if (activeProvider === "gemini") {
          const values = await getGeminiEmbedding(text);
          results.push({ values, provider: "gemini" });
        } else {
          const values = await getGroqEmbedding(text);
          results.push({ values, provider: "groq" });
        }
      } catch (err) {
        if (activeProvider === "gemini") {
          console.log(`Gemini failed mid-batch, switching to Groq: ${err.message}`);
          activeProvider = "groq";
          const values = await getGroqEmbedding(text);
          results.push({ values, provider: "groq" });
        } else {
          throw err;
        }
      }
      if (i + BATCH_SIZE < texts.length) await sleep(DELAY_BETWEEN_CALLS);
    }

    allResults.push(...results);
    if (i + BATCH_SIZE < texts.length) await sleep(DELAY_BETWEEN_CALLS);
  }

  return {
    embeddings: allResults.map((r) => r.values),
    provider: activeProvider,
  };
}

export async function getEmbeddings(texts, provider = "gemini") {
  const allResults = [];
  const embedFn = provider === "groq" ? getGroqEmbedding : getGeminiEmbedding;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    for (const text of batch) {
      const values = await embedFn(text);
      allResults.push(values);
      await sleep(DELAY_BETWEEN_CALLS);
    }
    if (i + BATCH_SIZE < texts.length) await sleep(DELAY_BETWEEN_CALLS);
  }

  return allResults;
}
