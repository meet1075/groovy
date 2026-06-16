import ReactMarkdown from "react-markdown";

export default function AnswerCard({ query, onCitationClick }) {
  return (
    <div className="border border-ink-800 rounded-lg bg-ink-900/50 p-4">
      {/* Question */}
      <div className="text-xs text-ink-500 mb-2 font-sans">Question</div>
      <p className="text-parchment-200 text-sm mb-3 font-serif">{query.question}</p>

      {/* Answer */}
      <div className="text-xs text-ink-500 mb-2 font-sans">Answer</div>
      <div className="markdown-answer text-parchment-100 text-sm font-serif">
        <ReactMarkdown>{query.answer}</ReactMarkdown>
      </div>

      {/* Citations */}
      {query.citedPages && query.citedPages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {query.citedPages.map((page) => (
            <button
              key={page}
              onClick={() => onCitationClick(page)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-highlight-500/15 text-highlight-400 text-xs font-mono hover:bg-highlight-500/25 transition-colors border border-highlight-500/20"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              p. {page}
            </button>
          ))}
        </div>
      )}

      {/* Telemetry */}
      <div className="mt-3 text-[11px] text-ink-600 font-mono flex gap-3">
        <span>{query.inputTokens?.toLocaleString()} in</span>
        <span>{query.outputTokens?.toLocaleString()} out</span>
        <span>${query.estimatedCost?.toFixed(4)}</span>
        <span>{(query.responseTimeMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}
