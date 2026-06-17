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

export async function startIngestion(docId) {
  const res = await fetch(`${BASE}/documents/${docId}/start-ingestion`, { method: "POST" });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed to start ingestion"); }
  return res.json();
}

export async function getIngestProgress(docId) {
  const res = await fetch(`${BASE}/documents/${docId}/ingest-progress`);
  if (!res.ok) throw new Error("Failed to get ingestion progress.");
  return res.json();
}

export async function ingestAll(docId, file) {
  const form = new FormData();
  form.append("pdf", file);
  const res = await fetch(`${BASE}/documents/${docId}/ingest-all`, { method: "POST", body: form });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Ingestion failed"); }
  return res.json();
}

export async function getIngestStatus(docId) {
  const res = await fetch(`${BASE}/documents/${docId}/ingest-status`);
  if (!res.ok) throw new Error("Failed to get ingestion status.");
  return res.json();
}

export async function compareStrategies(docId, question, rerankUsed) {
  const res = await fetch(`${BASE}/documents/${docId}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, rerankUsed }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Comparison failed"); }
  return res.json();
}

export async function getLabRuns(docId) {
  const res = await fetch(`${BASE}/documents/${docId}/runs`);
  if (!res.ok) throw new Error("Failed to load runs.");
  return res.json();
}
