import { useRef, useEffect } from "react";
import QuestionInput from "../components/QuestionInput";
import AnswerCard from "../components/AnswerCard";

export default function ChatView({ doc, queries, asking, onAsk }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [queries, asking]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950">
      <div className="flex-shrink-0 px-6 py-3 border-b border-slate-800 flex items-center gap-3">
        <svg className="w-4 h-4 text-electric-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <span className="text-sm text-frost-200 font-medium truncate">{doc.filename}</span>
        <span className="text-xs text-slate-500 flex-shrink-0">{doc.pageCount}p · {doc.totalChunks} chunks</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
        {queries.length === 0 && !asking && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">Ask a question about this document</p>
            </div>
          </div>
        )}

        {queries.map((q, i) => (
          <AnswerCard key={i} query={q} />
        ))}

        {asking && (
          <div className="border border-slate-800 rounded-lg bg-slate-900/50 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="w-4 h-4 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
              Searching vectors and generating answer...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 px-6 py-4 border-t border-slate-800">
        <QuestionInput onAsk={onAsk} loading={asking} />
      </div>
    </div>
  );
}
