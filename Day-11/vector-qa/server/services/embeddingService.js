const GEMINI_KEY = process.env.GEMINI_API_KEY;
const BATCH_SIZE = 100;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    if (res.status === 429 || res.status === 503) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.log(`Gemini ${res.status}, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retries + 1})`);
      await sleep(delay);
      continue;
    }
    const err = await res.text();
    throw new Error(`Gemini embedding error ${res.status}: ${err}`);
  }
  throw new Error("Gemini API: max retries exceeded");
}

export async function getEmbedding(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`;
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  });
  const data = await res.json();
  return data.embedding.values;
}

export async function getEmbeddings(texts) {
  const allResults = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((text) => getEmbedding(text)));
    allResults.push(...results);

    if (i + BATCH_SIZE < texts.length) {
      await sleep(500);
    }
  }

  return allResults;
}
