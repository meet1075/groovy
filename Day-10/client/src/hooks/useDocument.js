import { useState, useCallback } from "react";
import * as api from "../services/api.js";

export function useDocument() {
  const [doc, setDoc] = useState(null);
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(false);

  const upload = useCallback(async (file) => {
    setLoading(true);
    try {
      const result = await api.uploadDocument(file);
      setDoc(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPage = useCallback(async (docId, pageNum) => {
    if (pages[pageNum]) return pages[pageNum];
    const data = await api.getPage(docId, pageNum);
    setPages((prev) => ({ ...prev, [pageNum]: data }));
    return data;
  }, [pages]);

  return { doc, pages, loading, upload, fetchPage };
}
