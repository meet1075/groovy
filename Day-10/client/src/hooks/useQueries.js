import { useState, useCallback } from "react";
import * as api from "../services/api.js";

export function useQueries(docId) {
  const [queries, setQueries] = useState([]);
  const [asking, setAsking] = useState(false);

  const load = useCallback(async () => {
    if (!docId) return;
    const data = await api.getQueries(docId);
    setQueries(data);
  }, [docId]);

  const reset = useCallback(() => {
    setQueries([]);
    setAsking(false);
  }, []);

  const ask = useCallback(async (question) => {
    if (!docId || !question.trim()) return null;
    setAsking(true);
    try {
      const result = await api.askQuestion(docId, question);
      setQueries((prev) => [...prev, { ...result, question, createdAt: new Date().toISOString() }]);
      return result;
    } finally {
      setAsking(false);
    }
  }, [docId]);

  return { queries, asking, load, reset, ask };
}
