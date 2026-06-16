const BASE = "/api";

export async function listDocuments() {
  const res = await fetch(`${BASE}/documents`);
  if (!res.ok) throw new Error("Failed to load documents.");
  return res.json();
}

export async function uploadDocument(file) {
  const form = new FormData();
  form.append("pdf", file);
  const res = await fetch(`${BASE}/documents/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Upload failed: ${res.status}` }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function getDocument(id) {
  const res = await fetch(`${BASE}/documents/${id}`);
  if (!res.ok) throw new Error("Document not found.");
  return res.json();
}

export async function getPage(id, pageNumber) {
  const res = await fetch(`${BASE}/documents/${id}/pages/${pageNumber}`);
  if (!res.ok) throw new Error("Page not found.");
  return res.json();
}

export async function askQuestion(docId, question) {
  const res = await fetch(`${BASE}/documents/${docId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Request failed: ${res.status}` }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function getQueries(docId) {
  const res = await fetch(`${BASE}/documents/${docId}/queries`);
  if (!res.ok) throw new Error("Failed to load queries.");
  return res.json();
}
