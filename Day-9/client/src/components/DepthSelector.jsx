const DEPTHS = [
  { key: "quick", label: "Quick Summary", desc: "2-3 sentence overview" },
  { key: "detailed", label: "Detailed Walkthrough", desc: "Full explanation" },
  { key: "line", label: "Line-by-Line", desc: "Statement by statement" },
];

export default function DepthSelector({ depth, setDepth }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Depth:</span>
      {DEPTHS.map((d) => (
        <button
          key={d.key}
          onClick={() => setDepth(d.key)}
          title={d.desc}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            depth === d.key
              ? "bg-accent-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
