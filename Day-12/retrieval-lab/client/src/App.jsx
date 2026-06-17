import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "./services/api.js";
import ReactMarkdown from "react-markdown";

const STRATEGIES = [
  { key: "fixed", label: "Fixed", subtitle: "1500 chars, 200 overlap" },
  { key: "small", label: "Small", subtitle: "500 chars, 100 overlap" },
  { key: "large", label: "Large", subtitle: "3000 chars, 100 overlap" },
  { key: "semantic", label: "Semantic", subtitle: "paragraph/sentence" },
];

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [ingestions, setIngestions] = useState([]);
  const [ingesting, setIngesting] = useState(false);
  const [ingestProgress, setIngestProgress] = useState({});
  const [question, setQuestion] = useState("");
  const [rerankEnabled, setRerankEnabled] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [results, setResults] = useState(null);
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pollRef = useRef(null);

  const loadDocuments = useCallback(async () => {
    try { setDocuments(await api.listDocuments()); } catch {}
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const loadIngestions = useCallback(async (docId) => {
    try {
      const data = await api.getIngestStatus(docId);
      setIngestions(data);
    } catch { setIngestions([]); }
  }, []);

  const loadRuns = useCallback(async (docId) => {
    try { setRuns(await api.getLabRuns(docId)); } catch { setRuns([]); }
  }, []);

  const startPolling = useCallback((docId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { progress, ingestions: ing } = await api.getIngestProgress(docId);
        if (progress) {
          setIngestProgress(progress);
          if (progress.finished) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setIngesting(false);
            setIngestions(ing);
          }
        } else {
          setIngestions(ing);
          if (ing.length === 4) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setIngesting(false);
          }
        }
      } catch {}
    }, 2000);
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleUpload = useCallback(async (file) => {
    setUploading(true);
    setError(null);
    try {
      const result = await api.uploadDocument(file);
      setCurrentDoc(result);
      setIngestions([]);
      setIngestProgress({});
      setResults(null);
      setRuns([]);
      await loadDocuments();

      setIngesting(true);
      const progress = {};
      STRATEGIES.forEach((s) => { progress[s.key] = "pending"; });
      progress.finished = false;
      progress.completedCount = 0;
      progress.totalCount = 4;
      setIngestProgress(progress);

      await api.startIngestion(result.id);
      startPolling(result.id);
    } catch (err) { setError(err.message); setUploading(false); }
  }, [loadDocuments, startPolling]);

  const handleSelectDoc = useCallback((doc) => {
    setCurrentDoc(doc);
    setResults(null);
    setQuestion("");
    setIngestProgress({});
    loadIngestions(doc.id);
    loadRuns(doc.id);

    const allDone = doc.ingestions?.length === 4;
    if (!allDone && doc.ingestions?.length < 4) {
      api.getIngestProgress(doc.id).then(({ progress }) => {
        if (progress && !progress.finished) {
          setIngesting(true);
          startPolling(doc.id);
        }
      }).catch(() => {});
    }
  }, [loadIngestions, loadRuns, startPolling]);

  const handleCompare = useCallback(async () => {
    if (!currentDoc || !question.trim()) return;
    setComparing(true);
    setError(null);
    try {
      const result = await api.compareStrategies(currentDoc.id, question.trim(), rerankEnabled);
      setResults(result);
      await loadRuns(currentDoc.id);
    } catch (err) { setError(err.message); }
    finally { setComparing(false); }
  }, [currentDoc, question, rerankEnabled, loadRuns]);

  const handleRunClick = useCallback((run) => {
    setResults(run);
    setQuestion(run.question);
    setRerankEnabled(run.rerankUsed);
  }, []);

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar
        documents={documents}
        currentDoc={currentDoc}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onSelect={handleSelectDoc}
        onUpload={handleUpload}
        uploading={uploading}
        runs={runs}
        onRunClick={handleRunClick}
      />
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto">
        {currentDoc ? (
          <LabView
            doc={currentDoc}
            ingestions={ingestions}
            ingesting={ingesting}
            ingestProgress={ingestProgress}
            question={question}
            setQuestion={setQuestion}
            rerankEnabled={rerankEnabled}
            setRerankEnabled={setRerankEnabled}
            comparing={comparing}
            onCompare={handleCompare}
            results={results}
            runs={runs}
            onRunClick={handleRunClick}
            error={error}
          />
        ) : (
          <Home onUpload={handleUpload} uploading={uploading} error={error} />
        )}
      </div>
    </div>
  );
}

function Sidebar({ documents, currentDoc, collapsed, onToggleCollapse, onSelect, onUpload, uploading, runs, onRunClick }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") onUpload(file);
    e.target.value = "";
  };

  return (
    <div className={`${collapsed ? "w-14" : "w-64"} flex-shrink-0 h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200`}>
      <div className="px-3 py-3 border-b border-slate-800 flex items-center gap-2 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-md bg-electric-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-electric-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-frost-100 truncate">Retrieval Lab</span>
          </div>
        )}
        <button onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? "M8.25 4.5l7.5 7.5-7.5 7.5" : "M15.75 19.5L8.25 12l7.5-7.5"} />
          </svg>
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="px-3 py-3 space-y-2 border-b border-slate-800 flex-shrink-0">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-electric-500/10 hover:bg-electric-500/20 text-electric-400 text-xs font-medium transition-colors disabled:opacity-50 border border-electric-500/20">
              {uploading ? <div className="w-3.5 h-3.5 border-2 border-electric-400 border-t-transparent rounded-full animate-spin" />
                : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>}
              {uploading ? "Uploading & Ingesting..." : "Upload PDF"}
            </button>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} className="hidden" />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 px-2 py-2 space-y-0.5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium px-2 mb-1.5">Documents</div>
            {documents.length === 0 && (
              <div className="px-2 py-6 text-center">
                <svg className="w-8 h-8 text-slate-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-slate-600 text-[11px]">No documents yet</p>
              </div>
            )}
            {documents.map((doc) => (
              <button key={doc.id} onClick={() => onSelect(doc)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 ${currentDoc?.id === doc.id ? "bg-slate-800 text-frost-200 shadow-sm" : "hover:bg-slate-800/50 text-slate-400"}`}>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate font-medium">{doc.filename}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {doc.pageCount}p · {doc.ingestions?.length || 0}/4 strategies
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {runs.length > 0 && (
            <div className="border-t border-slate-800 px-2 py-2 max-h-48 overflow-y-auto flex-shrink-0">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium px-2 mb-1.5">Recent Runs</div>
              {runs.slice(0, 5).map((run) => (
                <button key={run.id} onClick={() => onRunClick(run)}
                  className="w-full text-left px-3 py-1.5 rounded text-[11px] text-slate-400 hover:bg-slate-800/50 truncate transition-colors">
                  {run.question.slice(0, 35)}...
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Home({ onUpload, uploading, error }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (file && file.type === "application/pdf") onUpload(file);
  }, [onUpload]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-0">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-electric-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-frost-100 mb-2">Retrieval Lab</h1>
          <p className="text-slate-400 text-sm">Upload a PDF to start comparing retrieval strategies</p>
        </div>
        <div onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploading && document.getElementById("home-pdf-input").click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${dragging ? "border-electric-500 bg-electric-500/5 scale-[1.02]" : "border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-900"} ${uploading ? "opacity-50 cursor-wait" : ""}`}>
          <input id="home-pdf-input" type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          {uploading ? (
            <div>
              <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-frost-300 text-sm font-medium">Uploading & Ingesting...</p>
              <p className="text-slate-500 text-xs mt-1">Processing 4 chunking strategies</p>
            </div>
          ) : (
            <div>
              <svg className="w-10 h-10 text-slate-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p className="text-frost-200 font-medium mb-1">Drop a PDF here or click to upload</p>
              <p className="text-slate-500 text-xs">PDF files up to 10MB</p>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">{error}</div>
        )}
      </div>
    </div>
  );
}

function LabView({ doc, ingestions, ingesting, ingestProgress, question, setQuestion, rerankEnabled, setRerankEnabled, comparing, onCompare, results, runs, onRunClick, error }) {
  const allDone = STRATEGIES.every((s) => ingestions.find((i) => i.strategy === s.key));
  const hasIngestions = ingestions.length > 0;
  const completedCount = ingestProgress.completedCount || ingestions.length;
  const totalCount = ingestProgress.totalCount || 4;
  const percent = ingestProgress.finished ? 100 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-6 space-y-6">
      <div className="flex-shrink-0 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
            <svg className="w-4 h-4 text-electric-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <span className="text-sm text-frost-200 font-medium">{doc.filename}</span>
            <span className="text-xs text-slate-500 ml-2">{doc.pageCount} pages</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700/50">
            <span className="text-[10px] text-slate-500 font-mono">4 strategies</span>
            <span className="text-slate-700">·</span>
            <span className="text-[10px] text-slate-500 font-mono">Cohere rerank</span>
          </div>
        </div>

        {(ingesting || (ingestProgress.currentStrategy && !ingestProgress.finished)) && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Ingesting</span>
              <span className="text-xs font-mono text-electric-400 font-semibold">{percent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-electric-500 to-electric-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {STRATEGIES.map((s) => {
                const status = ingestions.find((i) => i.strategy === s.key);
                const progress = ingestProgress[s.key];
                const isActive = progress === "active" || (!status && !progress);
                const isDone = progress === "done" || status;
                const isError = progress === "error";

                return (
                  <div key={s.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all duration-300 ${
                    isDone ? "border-electric-500/30 bg-electric-500/10 text-electric-400" :
                    isActive ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" :
                    isError ? "border-red-500/30 bg-red-500/10 text-red-400" :
                    "border-slate-700 bg-slate-800/50 text-slate-500"
                  }`}>
                    {isDone ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isError ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                    )}
                    <span>{s.label}</span>
                    {isDone && status && <span className="text-[10px] opacity-60">{status.chunkCount}c</span>}
                    {isError && <span className="text-[10px] opacity-60">retrying...</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!ingesting && hasIngestions && !allDone && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Ingestion</span>
              <span className="text-xs font-mono text-electric-400">{ingestions.length}/4 done</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {STRATEGIES.map((s) => {
                const status = ingestions.find((i) => i.strategy === s.key);
                return (
                  <div key={s.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                    status ? "border-electric-500/30 bg-electric-500/10 text-electric-400" :
                    "border-slate-700 bg-slate-800/50 text-slate-500"
                  }`}>
                    {status ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                    )}
                    <span>{s.label}</span>
                    {status && <span className="text-[10px] opacity-60">{status.chunkCount}c</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!ingesting && hasIngestions && allDone && (
          <div className="bg-electric-500/5 border border-electric-500/20 rounded-xl p-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-electric-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-electric-400 font-medium">All 4 strategies ingested. Ready to compare.</span>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onCompare()}
              placeholder="Ask a question about this document..." disabled={comparing || !allDone}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-frost-100 text-sm font-serif placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-electric-500/30 focus:border-electric-500/50 disabled:opacity-50 transition-all" />
          </div>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400 cursor-pointer select-none hover:bg-slate-750 transition-colors group" title="Retrieves top-15 chunks, then re-scores them with Cohere for higher precision before answering">
            <input type="checkbox" checked={rerankEnabled} onChange={(e) => setRerankEnabled(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-electric-500 focus:ring-electric-500/50" />
            <span className="group-hover:text-frost-300 transition-colors">Cohere Rerank</span>
            <svg className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </label>
          <button onClick={onCompare} disabled={!question.trim() || comparing || !allDone}
            className="px-5 py-2.5 rounded-lg bg-electric-500 hover:bg-electric-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold text-sm transition-all flex-shrink-0 flex items-center gap-2">
            {comparing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Running...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Run
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}
      </div>

      {comparing && !results && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STRATEGIES.map((s) => (
            <div key={s.key} className="border border-slate-800 rounded-xl bg-slate-900/50 p-4 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-20 mb-2" />
              <div className="h-3 bg-slate-800 rounded w-32 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-800 rounded w-full" />
                <div className="h-3 bg-slate-800 rounded w-5/6" />
                <div className="h-3 bg-slate-800 rounded w-4/6" />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
                <div className="h-3 bg-slate-800 rounded w-16" />
                <div className="h-3 bg-slate-800 rounded w-12" />
                <div className="h-3 bg-slate-800 rounded w-14" />
              </div>
            </div>
          ))}
        </div>
      )}

      {results && <ResultsGrid results={results} />}

      {!results && !comparing && !ingesting && !hasIngestions && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
            <p className="text-slate-500 text-sm">Upload a PDF to start comparing retrieval strategies</p>
          </div>
        </div>
      )}

      {!results && !comparing && !ingesting && hasIngestions && !allDone && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-slate-500 text-sm">Some strategies failed. Re-upload to retry all 4.</p>
          </div>
        </div>
      )}

      {runs.length > 0 && (
        <div className="flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium mb-2">Run History</div>
          <div className="space-y-1">
            {runs.map((run) => (
              <button key={run.id} onClick={() => onRunClick(run)}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 flex items-center gap-3 transition-all hover:bg-slate-900">
                <span className="text-frost-300 font-serif truncate flex-1">{run.question}</span>
                <span className="text-[10px] text-slate-600 font-mono flex-shrink-0">{new Date(run.createdAt).toLocaleTimeString()}</span>
                {run.rerankUsed && <span className="text-[10px] text-electric-500 font-mono flex-shrink-0 px-1.5 py-0.5 rounded bg-electric-500/10">rerank</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsGrid({ results }) {
  const strategyResults = STRATEGIES.map((s) => ({
    ...s,
    result: results.results?.find((r) => r.strategy === s.key),
  }));

  const rerankUsed = results.rerankUsed;

  const avgPinecone = {};
  const avgCohere = {};
  const allCitedPages = {};

  strategyResults.forEach(({ key, result }) => {
    if (!result?.retrievedChunks?.length) return;
    const scores = result.retrievedChunks.map((c) => c.pineconeScore).filter(Boolean);
    avgPinecone[key] = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3) : "—";
    const cohereScores = result.retrievedChunks.map((c) => c.cohereScore).filter(Boolean);
    avgCohere[key] = cohereScores.length ? (cohereScores.reduce((a, b) => a + b, 0) / cohereScores.length).toFixed(3) : "—";
    allCitedPages[key] = result.citedPages || [];
  });

  const commonPages = Object.values(allCitedPages).filter((p) => p.length > 0);
  const agreementPages = commonPages.length === 4
    ? commonPages[0].filter((p) => commonPages.every((cp) => cp.includes(p)))
    : [];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {strategyResults.map(({ key, label, subtitle, result }) => {
          if (!result) return null;
          return (
            <div key={key} className="border border-slate-800 rounded-xl bg-slate-900/50 p-4 flex flex-col hover:border-slate-700 transition-colors">
              <div className="mb-3">
                <div className="text-sm font-semibold text-frost-200">{label}</div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">{subtitle}</div>
              </div>

              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-medium">Answer</div>
              <div className="markdown-answer text-frost-100 text-xs font-serif leading-relaxed mb-3 flex-1">
                <ReactMarkdown>{result.answer || ""}</ReactMarkdown>
              </div>

              {result.citedPages?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {result.citedPages.map((page) => (
                    <span key={page} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-default transition-colors ${
                      agreementPages.includes(page)
                        ? "bg-electric-500/20 text-electric-400 border-electric-500/30 hover:bg-electric-500/30"
                        : "bg-electric-500/10 text-electric-400/70 border-electric-500/20 hover:bg-electric-500/15"
                    }`}>p. {page}</span>
                  ))}
                </div>
              )}

              {result.retrievedChunks?.length > 0 && (
                <details className="border-t border-slate-800 pt-2 mt-1 group">
                  <summary className="text-[10px] text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-400 transition-colors flex items-center gap-1">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    Retrieved Chunks ({result.retrievedChunks.length})
                  </summary>
                  <div className="mt-2 space-y-1.5">
                    {result.retrievedChunks.map((c, i) => (
                      <div key={i} className="text-[10px] font-mono p-2 rounded bg-slate-800/50 border border-slate-800">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-electric-500 font-semibold">p.{c.pageNumber}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-slate-400">{c.pineconeScore?.toFixed(3)}</span>
                          {rerankUsed && c.cohereScore != null && (
                            <>
                              <span className="text-slate-700">·</span>
                              <span className="text-yellow-400 font-semibold">R:{c.cohereScore?.toFixed(3)}</span>
                            </>
                          )}
                        </div>
                        <div className="text-slate-500 leading-relaxed">{c.text?.slice(0, 120)}...</div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-600 font-mono flex gap-2 flex-wrap">
                <span>{result.inputTokens?.toLocaleString()} in</span>
                <span>{result.outputTokens?.toLocaleString()} out</span>
                <span>${result.estimatedCost?.toFixed(4)}</span>
                <span>{(result.responseTimeMs / 1000).toFixed(1)}s</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border border-slate-800 rounded-xl bg-slate-900/50 p-4">
        <div className="text-xs text-slate-500 font-medium mb-3">Comparison Summary</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="text-left py-1.5 pr-3">Strategy</th>
                <th className="text-left py-1.5 pr-3">Avg Score</th>
                {rerankUsed && <th className="text-left py-1.5 pr-3">Avg Cohere</th>}
                <th className="text-left py-1.5 pr-3">Cost</th>
                <th className="text-left py-1.5 pr-3">Time</th>
                <th className="text-left py-1.5">Cited Pages</th>
              </tr>
            </thead>
            <tbody>
              {strategyResults.map(({ key, label, result }) => {
                if (!result) return null;
                const hasAgreement = allCitedPages[key]?.some((p) => agreementPages.includes(p));
                return (
                  <tr key={key} className={`border-b border-slate-800/50 transition-colors ${hasAgreement ? "bg-electric-500/5 hover:bg-electric-500/8" : "hover:bg-slate-800/30"}`}>
                    <td className="py-1.5 pr-3 text-frost-300 font-medium">{label}</td>
                    <td className="py-1.5 pr-3 text-slate-400">{avgPinecone[key]}</td>
                    {rerankUsed && <td className="py-1.5 pr-3 text-yellow-400/70">{avgCohere[key]}</td>}
                    <td className="py-1.5 pr-3 text-slate-400">${result.estimatedCost?.toFixed(4)}</td>
                    <td className="py-1.5 pr-3 text-slate-400">{(result.responseTimeMs / 1000).toFixed(1)}s</td>
                    <td className="py-1.5 text-slate-400">
                      {result.citedPages?.map((p) => (
                        <span key={p} className={`inline-block px-1 py-0 rounded text-[10px] mr-1 ${
                          agreementPages.includes(p) ? "bg-electric-500/20 text-electric-400" : ""
                        }`}>{p}</span>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {agreementPages.length > 0 && (
          <div className="mt-2 text-[10px] text-electric-400 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All 4 strategies agree on pages: {agreementPages.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
