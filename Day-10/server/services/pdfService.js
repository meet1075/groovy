import pdf from "pdf-parse";

export async function extractPages(buffer) {
  const data = await pdf(buffer);
  const pages = [];
  const text = data.text;

  // pdf-parse doesn't reliably split by page in all cases.
  // We use the internal pagebreaks array if available,
  // otherwise split on form-feed characters or distribute evenly.
  if (data.numpages && data.numpages > 1 && text.length > 0) {
    // Try to split by page markers (form feed \f or multiple newlines)
    const raw = text;
    const splits = raw.split(/\f|\n{4,}/);

    if (splits.length >= data.numpages - 1) {
      // We got reasonable splits
      for (let i = 0; i < data.numpages; i++) {
        pages.push({
          pageNumber: i + 1,
          text: (splits[i] || "").trim(),
        });
      }
    } else {
      // Fallback: distribute characters evenly across pages
      const charsPerPage = Math.ceil(raw.length / data.numpages);
      for (let i = 0; i < data.numpages; i++) {
        const start = i * charsPerPage;
        const end = Math.min(start + charsPerPage, raw.length);
        pages.push({
          pageNumber: i + 1,
          text: raw.slice(start, end).trim(),
        });
      }
    }
  } else {
    pages.push({ pageNumber: 1, text: text.trim() });
  }

  return {
    pageCount: pages.length,
    pages,
    totalChars: pages.reduce((sum, p) => sum + p.text.length, 0),
  };
}
