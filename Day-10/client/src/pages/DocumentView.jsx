import QuestionInput from "../components/QuestionInput";
import ConversationHistory from "../components/ConversationHistory";
import CostTelemetry from "../components/CostTelemetry";

export default function DocumentView({ doc, queries, asking, onAsk }) {
  return (
    <div className="flex-1 flex flex-col h-screen min-w-0 bg-ink-950">
      {/* Header */}
      <div className="px-6 py-3 border-b border-ink-800 flex items-center gap-3 flex-shrink-0">
        <svg className="w-4 h-4 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <span className="text-sm text-parchment-200 font-medium truncate">{doc.filename}</span>
        <span className="text-[11px] text-ink-500">{doc.pageCount} pages</span>
      </div>

      {/* Chat history */}
      <ConversationHistory queries={queries} />

      {/* Cost telemetry */}
      <CostTelemetry queries={queries} />

      {/* Input */}
      <div className="px-6 py-4 border-t border-ink-800 flex-shrink-0">
        <QuestionInput onAsk={onAsk} loading={asking} />
      </div>
    </div>
  );
}
