import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import DocumentView from "./pages/DocumentView";
import Home from "./pages/Home";
import { useDocument } from "./hooks/useDocument";
import { useQueries } from "./hooks/useQueries";
import * as api from "./services/api.js";

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [chatKey, setChatKey] = useState(0);
  const { doc, pages, loading: docLoading, upload, fetchPage } = useDocument();
  const { queries, asking, load: loadQueries, reset: resetQueries, ask } = useQueries(currentDoc?.id);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
    } catch {}
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleUpload = useCallback(async (file) => {
    const result = await upload(file);
    if (result) {
      setCurrentDoc(result);
      setChatKey((k) => k + 1);
      await loadDocuments();
    }
  }, [upload, loadDocuments]);

  const handleSelectDoc = useCallback((docMeta) => {
    setCurrentDoc(docMeta);
    setChatKey((k) => k + 1);
    loadQueries();
  }, [loadQueries]);

  const handleNewChat = useCallback(() => {
    resetQueries();
    setChatKey((k) => k + 1);
  }, [resetQueries]);

  if (documents.length === 0 && !currentDoc) {
    return (
      <div className="flex h-screen">
        <Home onUpload={handleUpload} loading={docLoading} />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        documents={documents}
        currentDoc={currentDoc}
        onSelectDoc={handleSelectDoc}
        onNewChat={handleNewChat}
        onUpload={handleUpload}
        uploading={docLoading}
      />
      {currentDoc ? (
        <DocumentView
          key={chatKey}
          doc={currentDoc}
          queries={queries}
          asking={asking}
          onAsk={ask}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-ink-950">
          <p className="text-ink-500 text-sm">Select a document or upload a new one</p>
        </div>
      )}
    </div>
  );
}
