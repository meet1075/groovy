import { useState } from "react";

export default function QuestionInput({ onAsk, loading }) {
  const [question, setQuestion] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim() && !loading) { onAsk(question.trim()); setQuestion(""); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question about this document..." disabled={loading}
        className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-frost-100 text-sm font-serif placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-electric-500/50 disabled:opacity-50" />
      <button type="submit" disabled={!question.trim() || loading}
        className="px-5 py-2.5 rounded-lg bg-electric-500 hover:bg-highlight-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-medium text-sm transition-colors flex-shrink-0">
        {loading ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : "Ask"}
      </button>
    </form>
  );
}
