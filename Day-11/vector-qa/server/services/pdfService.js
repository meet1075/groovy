import pdf from "pdf-parse";

function chunkText(text, maxChars = 1500, overlap = 200) {
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

export async function extractChunks(buffer) {
  const data = await pdf(buffer);
  const allChunks = [];
  const raw = data.text;
  const splits = raw.split(/\f|\n{4,}/);

  let pages;
  if (splits.length >= (data.numpages || 1) - 1) {
    pages = splits;
  } else {
    const charsPerPage = Math.ceil(raw.length / (data.numpages || 1));
    pages = [];
    for (let i = 0; i < (data.numpages || 1); i++) {
      pages.push(raw.slice(i * charsPerPage, (i + 1) * charsPerPage));
    }
  }

  for (let i = 0; i < pages.length; i++) {
    const pageText = (pages[i] || "").trim();
    if (!pageText) continue;
    const pageChunks = chunkText(pageText);
    for (let j = 0; j < pageChunks.length; j++) {
      allChunks.push({
        pageNumber: i + 1,
        chunkIndex: allChunks.length,
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
