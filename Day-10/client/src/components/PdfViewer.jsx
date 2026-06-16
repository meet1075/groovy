import { useState, useRef, useEffect } from "react";

export default function PdfViewer({ doc, pages, fetchPage, highlightPage }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageText, setPageText] = useState("");
  const [loadingPage, setLoadingPage] = useState(false);
  const pageRefs = useRef({});
  const containerRef = useRef(null);

  // Load first page on mount
  useEffect(() => {
    if (doc) loadPage(1);
  }, [doc]);

  // Scroll to highlighted page
  useEffect(() => {
    if (highlightPage && pageRefs.current[highlightPage]) {
      loadPage(highlightPage);
      setCurrentPage(highlightPage);
      pageRefs.current[highlightPage].scrollIntoView({ behavior: "smooth", block: "start" });
      // Remove highlight after animation
      const el = pageRefs.current[highlightPage];
      setTimeout(() => el?.classList.remove("page-highlight"), 2100);
    }
  }, [highlightPage]);

  const loadPage = async (num) => {
    if (!doc || num < 1 || num > doc.pageCount) return;
    setLoadingPage(true);
    try {
      const data = await fetchPage(doc.id, num);
      setPageText(data.text);
      setCurrentPage(num);
    } catch {
      setPageText("Could not load page.");
    } finally {
      setLoadingPage(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ink-900 rounded-xl border border-ink-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-800 flex-shrink-0">
        <span className="text-xs text-ink-400 font-medium truncate max-w-[200px]">{doc?.filename}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-ink-800 disabled:opacity-30 transition-colors"
          >
            <svg className="w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs text-parchment-300 font-mono min-w-[60px] text-center">
            {currentPage} / {doc?.pageCount || "—"}
          </span>
          <button
            onClick={() => loadPage(currentPage + 1)}
            disabled={currentPage >= (doc?.pageCount || 1)}
            className="p-1 rounded hover:bg-ink-800 disabled:opacity-30 transition-colors"
          >
            <svg className="w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Page jump bar */}
      <div className="px-4 py-2 border-b border-ink-800/50 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {Array.from({ length: Math.min(doc?.pageCount || 0, 30) }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => loadPage(n)}
              className={`w-7 h-7 rounded text-[10px] font-mono flex-shrink-0 transition-colors ${
                n === currentPage
                  ? "bg-highlight-500 text-ink-950 font-bold"
                  : "bg-ink-800 text-ink-400 hover:bg-ink-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto min-h-0">
        <div
          ref={(el) => { pageRefs.current[currentPage] = el; }}
          className={`p-6 ${highlightPage === currentPage ? "page-highlight" : ""}`}
        >
          {loadingPage ? (
            <div className="flex items-center gap-2 text-ink-500 text-sm py-8">
              <div className="w-4 h-4 border-2 border-highlight-500 border-t-transparent rounded-full animate-spin" />
              Loading page...
            </div>
          ) : (
            <>
              <div className="text-[10px] text-ink-600 font-mono mb-3">Page {currentPage}</div>
              <div className="font-serif text-sm text-parchment-200 leading-relaxed whitespace-pre-wrap">
                {pageText || "No text content on this page."}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
