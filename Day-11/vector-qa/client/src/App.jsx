import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import ChatView from "./pages/ChatView";
import Home from "./pages/Home";
import * as api from "./services/api.js";

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [queries, setQueries] = useState([]);
  const [asking, setAsking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [error, setError] = useState(null);

  const loadDocuments = useCallback(async () => {
    try { setDocuments(await api.listDocuments()); } catch {}
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const loadQueries = useCallback(async (docId) => {
    try { setQueries(await api.getQueries(docId)); } catch { setQueries([]); }
  }, []);

  const handleUpload = useCallback(async (file) => {
    setUploading(true);
    setError(null);
    try {
      const result = await api.uploadDocument(file);
      setCurrentDoc(result);
      setQueries([]);
      setChatKey((k) => k + 1);
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally { setUploading(false); }
  }, [loadDocuments]);

  const handleSelectDoc = useCallback((doc) => {
    setCurrentDoc(doc);
    setChatKey((k) => k + 1);
    loadQueries(doc.id);
  }, [loadQueries]);

  const handleNewChat = useCallback(() => {
    setQueries([]);
    setChatKey((k) => k + 1);
  }, []);

  const handleAsk = useCallback(async (question) => {
    if (!currentDoc || !question.trim()) return null;
    setAsking(true);
    try {
      const result = await api.askQuestion(currentDoc.id, question);
      setQueries((prev) => [...prev, { ...result, question, createdAt: new Date().toISOString() }]);
      return result;
    } finally { setAsking(false); }
  }, [currentDoc]);

  return (
    <div className="flex h-screen">
      <Sidebar documents={documents} currentDoc={currentDoc} onSelect={handleSelectDoc}
        onNewChat={handleNewChat} onUpload={handleUpload} uploading={uploading} />
      {currentDoc ? (
        <ChatView key={chatKey} doc={currentDoc} queries={queries} asking={asking} onAsk={handleAsk} />
      ) : (
        <Home onUpload={handleUpload} uploading={uploading} error={error} />
      )}
    </div>
  );
}
