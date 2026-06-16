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
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Upload failed"); }
  return res.json();
}

export async function askQuestion(docId, question) {
  const res = await fetch(`${BASE}/documents/${docId}/ask`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Request failed"); }
  return res.json();
}

export async function getQueries(docId) {
  const res = await fetch(`${BASE}/documents/${docId}/queries`);
  if (!res.ok) throw new Error("Failed to load queries.");
  return res.json();
}
