import pdf from "pdf-parse";

function splitIntoPages(raw, numpages) {
  const splits = raw.split(/\f|\n{4,}/);
  if (splits.length >= (numpages || 1) - 1) return splits;
  const charsPerPage = Math.ceil(raw.length / (numpages || 1));
  const pages = [];
  for (let i = 0; i < (numpages || 1); i++) {
    pages.push(raw.slice(i * charsPerPage, (i + 1) * charsPerPage));
  }
  return pages;
}

function fixedChunk(text, maxChars = 1500, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start + overlap >= text.length) break;
  }
  return chunks.filter((c) => c.trim().length > 50);
}

function smallChunk(text) {
  return fixedChunk(text, 500, 100);
}

function largeChunk(text) {
  return fixedChunk(text, 3000, 100);
}

function semanticChunk(text) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed || trimmed.length < 50) continue;
    if (trimmed.length <= 2000) {
      chunks.push(trimmed);
    } else {
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      let current = "";
      for (const sentence of sentences) {
        if (current.length + sentence.length > 2000 && current.length > 0) {
          chunks.push(current.trim());
          current = sentence;
        } else {
          current += (current ? " " : "") + sentence;
        }
      }
      if (current.trim().length > 50) chunks.push(current.trim());
    }
  }
  return chunks;
}

export const STRATEGIES = {
  fixed: { label: "Fixed", subtitle: "1500 chars, 200 overlap", fn: fixedChunk },
  small: { label: "Small", subtitle: "500 chars, 100 overlap", fn: smallChunk },
  large: { label: "Large", subtitle: "3000 chars, 100 overlap", fn: largeChunk },
  semantic: { label: "Semantic", subtitle: "paragraph/sentence boundaries", fn: semanticChunk },
};

export async function extractAndChunk(buffer, strategy) {
  const data = await pdf(buffer);
  const pages = splitIntoPages(data.text, data.numpages);
  const chunkFn = STRATEGIES[strategy].fn;
  const allChunks = [];

  for (let i = 0; i < pages.length; i++) {
    const pageText = (pages[i] || "").trim();
    if (!pageText) continue;
    const pageChunks = chunkFn(pageText);
    for (let j = 0; j < pageChunks.length; j++) {
      allChunks.push({
        pageNumber: i + 1,
        chunkIndex: allChunks.length,
        strategy,
        text: pageChunks[j],
      });
    }
  }

  return {
    pageCount: pages.length,
    chunks: allChunks,
    totalChars: allChunks.reduce((s, c) => s + c.text.length, 0),
  };
}

export async function extractPages(buffer) {
  const data = await pdf(buffer);
  const pages = splitIntoPages(data.text, data.numpages);
  return {
    pageCount: pages.length,
    pages: pages.map((p, i) => ({ pageNumber: i + 1, text: (p || "").trim() })),
  };
}
