export default function CostTelemetry({ queries }) {
  const totalTokens = queries.reduce((s, q) => s + (q.inputTokens || 0) + (q.outputTokens || 0), 0);
  const totalCost = queries.reduce((s, q) => s + (q.estimatedCost || 0), 0);
  const totalQuestions = queries.length;

  return (
    <div className="px-4 py-2 border-t border-ink-800 flex items-center gap-4 text-[11px] text-ink-500 font-mono flex-shrink-0">
      <span>{totalQuestions} question{totalQuestions !== 1 ? "s" : ""}</span>
      <span>{totalTokens.toLocaleString()} tokens</span>
      <span>${totalCost.toFixed(4)}</span>
    </div>
  );
}
