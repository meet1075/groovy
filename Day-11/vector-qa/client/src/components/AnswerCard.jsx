import ReactMarkdown from "react-markdown";

export default function AnswerCard({ query }) {
  return (
    <div className="border border-slate-800 rounded-lg bg-slate-900/50 p-4">
      <div className="text-xs text-slate-500 mb-1 font-sans">Question</div>
      <p className="text-frost-200 text-sm mb-3 font-serif">{query.question}</p>

      <div className="text-xs text-slate-500 mb-1 font-sans">Answer</div>
      <div className="markdown-answer text-frost-100 text-sm font-serif">
        <ReactMarkdown>{query.answer}</ReactMarkdown>
      </div>

      {query.citedPages && query.citedPages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {query.citedPages.map((page) => (
            <span key={page} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-electric-500/15 text-electric-400 text-xs font-mono border border-electric-500/20">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              p. {page}
            </span>
          ))}
        </div>
      )}

      {query.retrievedChunks && query.retrievedChunks.length > 0 && (
        <div className="mt-3 border-t border-slate-800 pt-2">
          <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Retrieved chunks (top {query.retrievedChunks.length})</div>
          {query.retrievedChunks.map((c, i) => (
            <div key={i} className="text-[11px] text-slate-500 font-mono mb-1">
              <span className="text-electric-500">p.{c.pageNumber}</span>
              <span className="text-slate-700 mx-1">·</span>
              <span className="text-slate-400">{c.score?.toFixed(3)}</span>
              <span className="text-slate-700 mx-1">·</span>
              <span className="text-slate-500">{c.text?.slice(0, 80)}...</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-[11px] text-slate-600 font-mono flex gap-3">
        <span>{query.inputTokens?.toLocaleString()} in</span>
        <span>{query.outputTokens?.toLocaleString()} out</span>
        <span>${query.estimatedCost?.toFixed(4)}</span>
        <span>{(query.responseTimeMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}
