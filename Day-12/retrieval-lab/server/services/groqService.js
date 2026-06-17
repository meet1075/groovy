const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const INPUT_PRICE = 0.59;
const OUTPUT_PRICE = 0.79;

export function calculateCost(inputTokens, outputTokens) {
  return (inputTokens / 1_000_000) * INPUT_PRICE + (outputTokens / 1_000_000) * OUTPUT_PRICE;
}

export async function answerQuestion(chunks, question) {
  const context = chunks
    .map((c) => `[Page ${c.pageNumber}, Chunk ${c.chunkIndex || 0}]\n${c.text}`)
    .join("\n\n---\n\n");

  const systemMsg = `You are a precise document analysis assistant. You answer questions based on the provided document chunks. Each chunk is labeled with [Page X, Chunk Y].

Rules:
- Cite the page number(s) your answer is based on using the format (p. X).
- If multiple pages support a claim, cite all relevant pages.
- If the answer is not in the document, say "I don't find this information in the provided document."
- Be concise but thorough. Quote relevant passages when helpful.`;

  const userMsg = `Document chunks (retrieved by semantic similarity):\n\n${context}\n\n---\n\nQuestion: ${question}`;

  const start = Date.now();

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content || "No answer generated.";
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const responseTimeMs = Date.now() - start;

  const citedPages = parseCitations(answer);

  return { answer, citedPages, inputTokens, outputTokens, estimatedCost: calculateCost(inputTokens, outputTokens), responseTimeMs };
}

function parseCitations(text) {
  const pages = new Set();
  const regex = /\(p\.?\s*(\d+(?:\s*[-–,]\s*\d+)*)\)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    match[1].split(/[-–,\s]+/).forEach((n) => { const v = parseInt(n, 10); if (!isNaN(v)) pages.add(v); });
  }
  return [...pages].sort((a, b) => a - b);
}
