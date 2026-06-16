import { useRef } from "react";

const ACCEPTED_EXTENSIONS = [
  ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".go", ".rb", ".php",
  ".json", ".md", ".css", ".html", ".c", ".cpp", ".cs", ".rs", ".swift",
  ".kt", ".sh", ".sql", ".yaml", ".yml", ".toml", ".xml", ".vue", ".svelte",
  ".env", ".gitignore", ".prettierrc", ".eslintrc", ".lock",
];

const SKIP_DIRS = new Set([
  "node_modules", ".git", "__pycache__", ".next", ".nuxt", "dist", "build",
  ".cache", ".parcel-cache", "coverage", ".idea", ".vscode", "vendor",
]);

function buildTree(files) {
  const root = { name: "", children: {}, isDir: true };
  for (const f of files) {
    const parts = f.path.split("/").filter(Boolean);
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!node.children[part]) {
        node.children[part] = {
          name: part,
          children: {},
          isDir: i < parts.length - 1,
          file: i === parts.length - 1 ? f : null,
        };
      }
      node = node.children[part];
    }
  }
  return root;
}

function FileTreeNode({ node, onRemove }) {
  if (node.isDir) {
    const sorted = Object.values(node.children).sort((a, b) =>
      a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1
    );
    return (
      <div className="ml-3">
        <div className="flex items-center gap-1.5 py-0.5 text-gray-500 dark:text-gray-400">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
          <span className="text-xs font-medium">{node.name}</span>
        </div>
        {sorted.map((child) => (
          <FileTreeNode key={child.name} node={child} onRemove={onRemove} />
        ))}
      </div>
    );
  }

  const ext = "." + node.name.split(".").pop();
  const color = {
    ".js": "text-yellow-400", ".ts": "text-blue-400", ".jsx": "text-cyan-400", ".tsx": "text-cyan-400",
    ".py": "text-green-400", ".java": "text-orange-400", ".go": "text-sky-400",
    ".json": "text-yellow-300", ".md": "text-gray-300", ".css": "text-purple-400",
    ".html": "text-red-400", ".rb": "text-red-400", ".rs": "text-orange-300",
  }[ext] || "text-gray-400";

  return (
    <div className="flex items-center gap-1.5 py-0.5 pl-3 group/file">
      <svg className={`w-3.5 h-3.5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">{node.name}</span>
      <span className="text-[10px] text-gray-400 dark:text-gray-600">
        {node.file ? `${(node.file.content.length / 1024).toFixed(1)}k` : ""}
      </span>
      <button
        onClick={() => onRemove(node.file.path)}
        className="ml-auto opacity-0 group-hover/file:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
        title="Remove file"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function CodeInput({
  code, setCode, files, setFiles, tokenCount, maxTokens, overLimit,
}) {
  const fileRef = useRef(null);
  const folderRef = useRef(null);
  const lineCount = (code || "").split("\n").length;
  const mode = files.length > 0 ? "files" : "code";

  const handleSingleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCode(ev.target.result);
      setFiles([]);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleFolder = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const results = [];
    for (const f of rawFiles) {
      const path = f.webkitRelativePath || f.name;
      const dirParts = path.split("/");
      if (dirParts.some((p) => SKIP_DIRS.has(p))) continue;
      const ext = "." + f.name.split(".").pop();
      if (!ACCEPTED_EXTENSIONS.includes(ext) && f.size > 512 * 1024) continue;
      if (f.size === 0 || f.size > 1024 * 1024) continue;

      try {
        const content = await f.text();
        results.push({ path: path.split("/").slice(1).join("/"), content });
      } catch {}
    }

    results.sort((a, b) => a.path.localeCompare(b.path));
    setFiles(results);
    setCode("");
    e.target.value = "";
  };

  const handleRemoveFile = (filePath) => {
    const next = files.filter((f) => f.path !== filePath);
    setFiles(next);
  };

  const handleClearFiles = () => {
    setFiles([]);
  };

  const pct = Math.min((tokenCount / maxTokens) * 100, 100);
  const tree = files.length > 0 ? buildTree(files) : null;

  return (
    <div className="flex flex-col gap-2">
      {/* Header with buttons */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {mode === "files" ? `${files.length} files selected` : "Your Code"}
        </label>
        <div className="flex items-center gap-2">
          {files.length > 0 && (
            <button
              onClick={handleClearFiles}
              className="text-xs px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-red-600 dark:text-red-400"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload file
            </span>
          </button>
          <button
            onClick={() => folderRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-md border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/30 hover:bg-accent-100 dark:hover:bg-accent-900/50 transition-colors text-accent-700 dark:text-accent-300"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Upload folder
            </span>
          </button>
          <input ref={fileRef} type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={handleSingleFile} className="hidden" />
          <input ref={folderRef} type="file" webkitdirectory="" onChange={handleFolder} className="hidden" />
        </div>
      </div>

      {/* Content area */}
      <div
        className={`relative rounded-xl border-2 transition-colors ${
          overLimit
            ? "border-red-400 dark:border-red-500"
            : mode === "files"
            ? "border-accent-300 dark:border-accent-700"
            : code
            ? "border-accent-300 dark:border-accent-700"
            : "border-gray-200 dark:border-gray-800"
        } bg-white dark:bg-gray-900 overflow-hidden`}
      >
        {mode === "files" && tree ? (
          /* File tree view */
          <div className="p-4 max-h-[500px] overflow-y-auto">
            {Object.values(tree.children)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((node) => (
                <FileTreeNode key={node.name} node={node} onRemove={handleRemoveFile} />
              ))}
          </div>
        ) : (
          /* Code textarea */
          <div className="flex">
            <div className="flex-shrink-0 py-3 pl-3 pr-2 text-right select-none border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                <div key={i} className="font-mono text-xs text-gray-400 dark:text-gray-600 leading-6 h-6">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => { setCode(e.target.value); setFiles([]); }}
              placeholder="Paste your code here, or upload a folder..."
              spellCheck={false}
              className="code-textarea flex-1 w-full p-3 bg-transparent font-mono text-sm leading-6 resize-none focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 min-h-[400px]"
            />
          </div>
        )}
      </div>

      {/* Token counter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              overLimit ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-accent-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className={`text-xs font-medium tabular-nums whitespace-nowrap ${
            overLimit ? "text-red-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {tokenCount.toLocaleString()} / {maxTokens.toLocaleString()} tokens
        </span>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600">~1 token per 4 characters (approximation)</p>
    </div>
  );
}
