import { useState } from "react";

export default function QuestionInput({ onAsk, loading }) {
  const [question, setQuestion] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim() && !loading) {
      onAsk(question.trim());
      setQuestion("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question about this document..."
        disabled={loading}
        className="flex-1 px-4 py-2.5 rounded-lg bg-ink-800 border border-ink-700 text-parchment-100 text-sm font-serif placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-highlight-500/50 focus:border-highlight-500/50 transition-colors disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!question.trim() || loading}
        className="px-5 py-2.5 rounded-lg bg-highlight-500 hover:bg-highlight-400 disabled:bg-ink-700 disabled:text-ink-500 text-ink-950 font-medium text-sm transition-colors flex-shrink-0"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
        ) : (
          "Ask"
        )}
      </button>
    </form>
  );
}
