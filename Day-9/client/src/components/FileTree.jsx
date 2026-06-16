import { useMemo } from "react";

function buildTree(files) {
  const root = {};
  for (const f of files) {
    const parts = f.split("/").filter(Boolean);
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!node[part]) {
        node[part] = i === parts.length - 1 ? null : {};
      }
      if (node[part] !== null) node = node[part];
    }
  }
  return root;
}

function extColor(name) {
  const ext = name.split(".").pop();
  const map = {
    js: "text-yellow-500", ts: "text-blue-500", jsx: "text-cyan-500", tsx: "text-cyan-500",
    py: "text-green-500", java: "text-orange-500", go: "text-sky-500", rb: "text-red-400",
    json: "text-yellow-300", md: "text-gray-400", css: "text-purple-400", html: "text-red-400",
    rs: "text-orange-300", sh: "text-green-400", sql: "text-pink-400", vue: "text-emerald-400",
    svelte: "text-orange-400",
  };
  return map[ext] || "text-gray-400";
}

function TreeNode({ name, children, depth = 0 }) {
  if (children === null) {
    // file
    return (
      <div className="flex items-center gap-1.5 py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${extColor(name)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">{name}</span>
      </div>
    );
  }

  // folder
  const entries = Object.entries(children).sort(([aName, aVal], [bName, bVal]) => {
    if (aVal !== null && bVal === null) return -1;
    if (aVal === null && bVal !== null) return 1;
    return aName.localeCompare(bName);
  });

  return (
    <div>
      <div className="flex items-center gap-1.5 py-1 px-2" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
        <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{name}</span>
      </div>
      {entries.map(([childName, childVal]) => (
        <TreeNode key={childName} name={childName} children={childVal} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function FileTree({ files }) {
  const tree = useMemo(() => buildTree(files), [files]);

  return (
    <div className="font-mono">
      {Object.entries(tree)
        .sort(([aName, aVal], [bName, bVal]) => {
          if (aVal !== null && bVal === null) return -1;
          if (aVal === null && bVal !== null) return 1;
          return aName.localeCompare(bName);
        })
        .map(([name, val]) => (
          <TreeNode key={name} name={name} children={val} depth={0} />
        ))}
    </div>
  );
}
