import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

function CodeBlock({ language, children }) {
  const code = String(children).replace(/\n$/, "");
  return (
    <div className="relative group my-3">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs px-2 py-1 rounded bg-gray-700/80 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          Copy
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={{
          "code[class*=\"language-\"]": { color: "#e2e8f0", background: "none" },
          "pre[class*=\"language-\"]": { background: "#0f172a", padding: "1rem", borderRadius: "0.5rem", overflow: "auto" },
          comment: { color: "#64748b" },
          string: { color: "#fbbf24" },
          keyword: { color: "#c084fc" },
          function: { color: "#34d399" },
          number: { color: "#fb923c" },
          operator: { color: "#38bdf8" },
          punctuation: { color: "#94a3b8" },
          className: { color: "#f472b6" },
          tag: { color: "#f472b6" },
          "attr-name": { color: "#38bdf8" },
          "attr-value": { color: "#fbbf24" },
        }}
        customStyle={{
          margin: 0,
          background: "#0f172a",
          borderRadius: "0.5rem",
          fontSize: "0.85rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-output">
      <ReactMarkdown
        components={{
          code({ node, children, ...props }) {
            const text = String(children);
            const isInline = !text.includes("\n");
            if (isInline) {
              return <code {...props}>{children}</code>;
            }
            const lang = node.lang || "text";
            return <CodeBlock language={lang}>{children}</CodeBlock>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
      <svg className="w-14 h-14 text-gray-200 dark:text-gray-800 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
      <p className="text-gray-400 dark:text-gray-600 text-sm">
        Enter a path and click <span className="font-medium text-accent-500">Explain</span> to get started
      </p>
    </div>
  );
}

function StreamingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-dot" />
      <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
      <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
      <span className="text-xs text-gray-400 ml-2">Thinking...</span>
    </div>
  );
}

export default function OutputPanel({ output, stats, loading }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Explanation</span>
        {output && (
          <button
            onClick={handleCopy}
            className="text-xs px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-5">
        {!output && !loading ? (
          <EmptyState />
        ) : loading && !output ? (
          <StreamingDots />
        ) : (
          <div className="animate-fade-in">
            <MarkdownRenderer content={output} />
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-600 flex items-center gap-4 flex-shrink-0">
          <span>Input tokens: {stats.inputTokens?.toLocaleString()}</span>
          <span>Output tokens: {stats.outputTokens?.toLocaleString()}</span>
          <span>Response time: {stats.elapsed}s</span>
        </div>
      )}
    </div>
  );
}
