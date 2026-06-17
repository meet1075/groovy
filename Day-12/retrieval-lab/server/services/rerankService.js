const COHERE_URL = "https://api.cohere.com/v1/rerank";
const MODEL = "rerank-english-v3.0";

export async function rerankChunks(query, chunks, topN = 3) {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) throw new Error("COHERE_API_KEY not set in environment");

  const documents = chunks.map((c) => c.text);

  const res = await fetch(COHERE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      query,
      documents,
      top_n: topN,
      return_documents: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cohere rerank error ${res.status}: ${err}`);
  }

  const data = await res.json();

  return data.results.map((r) => ({
    ...chunks[r.index],
    cohereScore: r.relevance_score,
  }));
}
