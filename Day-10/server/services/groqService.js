const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const GROQ_KEY = process.env.GROQ_API_KEY;

// Groq pricing for llama-3.3-70b-versatile (per 1M tokens)
const INPUT_PRICE = 0.59;
const OUTPUT_PRICE = 0.79;

export function calculateCost(inputTokens, outputTokens) {
  return (
    (inputTokens / 1_000_000) * INPUT_PRICE +
    (outputTokens / 1_000_000) * OUTPUT_PRICE
  );
}

function scorePage(pageText, question) {
  const qWords = question.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const textLower = pageText.toLowerCase();
  let score = 0;
  for (const word of qWords) {
    const regex = new RegExp(word, "gi");
    const matches = textLower.match(regex);
    if (matches) score += matches.length;
  }
  return score;
}

function selectRelevantPages(pages, question, maxTokens = 6000) {
  // Score each page by keyword overlap with the question
  const scored = pages
    .map((p) => ({ ...p, score: scorePage(p.pageText, question) }))
    .sort((a, b) => b.score - a.score);

  // Estimate tokens: ~4 chars per token
  const charsBudget = maxTokens * 4;
  let usedChars = 0;
  const selected = [];

  // Always include top pages, even with low score, up to budget
  for (const page of scored) {
    if (usedChars + page.pageText.length > charsBudget) break;
    selected.push(page);
    usedChars += page.pageText.length;
  }

  // Sort by page number for readable context
  return selected.sort((a, b) => a.pageNumber - b.pageNumber);
}

export async function answerQuestion(pages, question) {
  const selectedPages = selectRelevantPages(pages, question);

  const documentContext = selectedPages
    .map((p) => `[Page ${p.pageNumber}]\n${p.pageText}`)
    .join("\n\n---\n\n");

  const systemMsg = `You are a precise document analysis assistant. You answer questions based on the provided document text. Each page is labeled with [Page X].

Rules:
- Cite the page number(s) your answer is based on using the format (p. X) or (p. X-Y).
- If multiple pages support a claim, cite all relevant pages.
- If the answer is not contained in the document, say "I don't find this information in the provided document."
- Be concise but thorough. Quote relevant passages when helpful.
- Do not make up information that isn't in the document.`;

  const userMsg = `Document content:\n\n${documentContext}\n\n---\n\nQuestion: ${question}`;

  const start = Date.now();

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
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
    const errBody = await res.text();
    console.error("Groq API error:", res.status, errBody);
    throw new Error(`Groq API error: ${res.status}`);
  }

  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content || "No answer generated.";
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const responseTimeMs = Date.now() - start;

  // Parse cited page numbers from the answer
  const citedPages = parseCitations(answer);

  return {
    answer,
    citedPages,
    inputTokens,
    outputTokens,
    estimatedCost: calculateCost(inputTokens, outputTokens),
    responseTimeMs,
  };
}

function parseCitations(text) {
  const pages = new Set();
  // Match patterns like (p. 4), (p. 4-6), (pp. 4, 5), (p. 4 and 6)
  const regex = /\(p\.?\s*(\d+(?:\s*[-–,]\s*\d+)*)\)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const nums = match[1].split(/[-–,\s]+/).map((n) => parseInt(n.trim(), 10));
    nums.forEach((n) => { if (!isNaN(n)) pages.add(n); });
  }
  // Also match (p. 4) style without the dot
  const regex2 = /\(page\s*(\d+(?:\s*[-–,]\s*\d+)*)\)/gi;
  while ((match = regex2.exec(text)) !== null) {
    const nums = match[1].split(/[-–,\s]+/).map((n) => parseInt(n.trim(), 10));
    nums.forEach((n) => { if (!isNaN(n)) pages.add(n); });
  }
  return [...pages].sort((a, b) => a - b);
}
