import { useState, useCallback } from "react";
import Header from "./components/Header";
import FileTree from "./components/FileTree";
import DepthSelector from "./components/DepthSelector";
import OutputPanel from "./components/OutputPanel";
import ErrorBanner from "./components/ErrorBanner";

export default function App() {
  const [dirPath, setDirPath] = useState("");
  const [depth, setDepth] = useState("detailed");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [pathInfo, setPathInfo] = useState(null);
  const [validating, setValidating] = useState(false);

  const handleValidatePath = useCallback(async () => {
    if (!dirPath.trim()) return;
    setValidating(true);
    setPathInfo(null);
    try {
      const res = await fetch("/api/validate-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: dirPath.trim() }),
      });
      const data = await res.json();
      setPathInfo(data);
    } catch {
      setPathInfo({ valid: false, error: "Could not validate path." });
    } finally {
      setValidating(false);
    }
  }, [dirPath]);

  const handleExplain = useCallback(async () => {
    if (!dirPath.trim() || loading) return;
    setLoading(true);
    setOutput("");
    setStats(null);
    setError(null);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: dirPath.trim(), depth }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.text) {
              fullText += data.text;
              setOutput(fullText);
            }
            if (data.done) {
              setStats({
                inputTokens: data.inputTokens,
                outputTokens: data.outputTokens,
                elapsed: data.elapsed,
              });
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            if (e.message && !e.message.includes("JSON")) throw e;
          }
        }
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [dirPath, depth, loading]);

  const handleRetry = useCallback(() => {
    setError(null);
    handleExplain();
  }, [handleExplain]);

  const isEmpty = !dirPath.trim();
  const canExplain = !isEmpty && !loading;
  const hasTree = pathInfo?.valid && pathInfo.files?.length > 0;

  return (
    <div className="dark">
      <div className="h-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden">
        <Header />

        <div className="flex-1 flex flex-col min-h-0 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 gap-4">
          {/* ── Top: Path Input ── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={dirPath}
                  onChange={(e) => { setDirPath(e.target.value); setPathInfo(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleValidatePath(); }}
                  placeholder="/home/user/my-project"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <button
                onClick={handleValidatePath}
                disabled={!dirPath.trim() || validating}
                className="px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              >
                {validating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Scanning...
                  </span>
                ) : "Validate"}
              </button>
              <button
                onClick={handleExplain}
                disabled={!canExplain}
                className="px-6 py-2.5 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing...
                  </>
                ) : "Explain Codebase"}
              </button>
            </div>
            {pathInfo && (
              <div className={`mt-3 text-xs px-3 py-2 rounded-lg font-medium ${
                pathInfo.valid
                  ? "bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20"
                  : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
              }`}>
                {pathInfo.valid
                  ? `${pathInfo.fileCount} code file${pathInfo.fileCount !== 1 ? "s" : ""} found`
                  : pathInfo.error}
              </div>
            )}
          </div>

          {/* ── Bottom: Tree + Output ── */}
          <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
            {/* Left: File Tree */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col lg:w-[320px] flex-shrink-0">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Files</span>
                {hasTree && (
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{pathInfo.files.length}</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 p-2">
                {hasTree ? (
                  <FileTree files={pathInfo.files} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
                    <svg className="w-10 h-10 text-gray-200 dark:text-gray-800 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <p className="text-xs text-gray-400 dark:text-gray-600">Validate a path to see files</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Output */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {error && <ErrorBanner message={error} onRetry={handleRetry} onDismiss={() => setError(null)} />}
              <OutputPanel output={output} stats={stats} loading={loading} depth={depth} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
