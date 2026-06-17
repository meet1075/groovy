import prisma from "../config/db.js";
import { extractPages, extractAndChunk, STRATEGIES } from "../services/chunkingService.js";
import { getEmbeddingsWithFallback, COOLDOWN_BETWEEN_STRATEGIES } from "../services/embeddingService.js";
import { upsertChunks } from "../services/pineconeService.js";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const fileBuffers = new Map();
const activeIngestions = new Map();

export async function listDocuments(req, res, next) {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { uploadedAt: "desc" },
      include: { ingestions: true },
    });
    res.json(docs.map((d) => ({
      id: d.id, filename: d.filename, pageCount: d.pageCount,
      uploadedAt: d.uploadedAt, ingestions: d.ingestions,
    })));
  } catch (err) { next(err); }
}

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    const { originalname, buffer } = req.file;
    const { pageCount } = await extractPages(buffer);

    const doc = await prisma.document.create({
      data: { filename: originalname, pageCount },
    });

    fileBuffers.set(doc.id, { buffer, originalname });
    setTimeout(() => fileBuffers.delete(doc.id), 10 * 60 * 1000);

    res.json({ id: doc.id, filename: doc.filename, pageCount: doc.pageCount, uploadedAt: doc.uploadedAt });
  } catch (err) { next(err); }
}

export async function getDocument(req, res, next) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { ingestions: true },
    });
    if (!doc) return res.status(404).json({ error: "Document not found." });
    res.json(doc);
  } catch (err) { next(err); }
}

async function processIngestion(docId) {
  const fileData = fileBuffers.get(docId);
  if (!fileData) {
    console.error(`No file buffer found for doc ${docId}`);
    return;
  }

  const strategies = Object.keys(STRATEGIES);

  for (let si = 0; si < strategies.length; si++) {
    const strategy = strategies[si];

    activeIngestions.set(docId, {
      ...activeIngestions.get(docId),
      [strategy]: "active",
      currentStrategy: strategy,
      completedCount: si,
      totalCount: strategies.length,
    });

    let lastError = null;
    const providers = ["gemini", "groq"];

    for (const provider of providers) {
      try {
        const namespace = `doc-${docId}-${strategy}-${Date.now()}`;
        const { chunks } = await extractAndChunk(fileData.buffer, strategy);

        const texts = chunks.map((c) => c.text);
        const { embeddings, provider: usedProvider } = await getEmbeddingsWithFallback(texts);

        await upsertChunks(namespace, chunks, embeddings, usedProvider);

        await prisma.ingestion.upsert({
          where: { documentId_strategy: { documentId: docId, strategy } },
          create: { documentId: docId, strategy, chunkCount: chunks.length, pineconeNamespace: namespace, provider: usedProvider },
          update: { chunkCount: chunks.length, pineconeNamespace: namespace, provider: usedProvider },
        });

        activeIngestions.set(docId, {
          ...activeIngestions.get(docId),
          [strategy]: "done",
          completedCount: si + 1,
        });

        console.log(`Strategy "${strategy}" done for doc ${docId} (provider: ${usedProvider}, ${chunks.length} chunks)`);
        lastError = null;
        break;
      } catch (err) {
        console.error(`Strategy "${strategy}" failed with ${provider} for doc ${docId}: ${err.message}`);
        lastError = err;
        if (provider === "groq") {
          activeIngestions.set(docId, {
            ...activeIngestions.get(docId),
            [strategy]: "error",
            [`${strategy}Error`]: err.message,
            completedCount: si + 1,
          });
        }
      }
    }

    if (si < strategies.length - 1) {
      console.log(`Cooldown ${COOLDOWN_BETWEEN_STRATEGIES / 1000}s before next strategy...`);
      await sleep(COOLDOWN_BETWEEN_STRATEGIES);
    }
  }

  activeIngestions.set(docId, {
    ...activeIngestions.get(docId),
    currentStrategy: null,
    finished: true,
  });
  fileBuffers.delete(docId);
  console.log(`All ingestion complete for doc ${docId}`);
}

export async function startIngestion(req, res, next) {
  try {
    const docId = parseInt(req.params.id);
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    if (!fileBuffers.has(docId)) return res.status(400).json({ error: "File buffer expired. Please re-upload." });

    if (activeIngestions.has(docId) && !activeIngestions.get(docId).finished) {
      return res.status(409).json({ error: "Ingestion already in progress." });
    }

    const progress = {};
    Object.keys(STRATEGIES).forEach((key) => { progress[key] = "pending"; });
    progress.currentStrategy = null;
    progress.completedCount = 0;
    progress.totalCount = STRATEGIES.length;
    progress.finished = false;
    activeIngestions.set(docId, progress);

    processIngestion(docId).catch((err) => {
      console.error(`Background ingestion crashed for doc ${docId}:`, err);
      activeIngestions.set(docId, { ...activeIngestions.get(docId), finished: true, error: err.message });
    });

    res.json({ documentId: docId, status: "started" });
  } catch (err) { next(err); }
}

export async function getIngestProgress(req, res, next) {
  try {
    const docId = parseInt(req.params.id);
    const progress = activeIngestions.get(docId) || null;
    const ingestions = await prisma.ingestion.findMany({ where: { documentId: docId } });
    res.json({ progress, ingestions });
  } catch (err) { next(err); }
}

export async function ingestAll(req, res, next) {
  try {
    const docId = parseInt(req.params.id);
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded for ingestion." });

    fileBuffers.set(docId, { buffer: file.buffer, originalname: file.originalname });

    const strategies = Object.keys(STRATEGIES);
    const results = [];

    for (let si = 0; si < strategies.length; si++) {
      const strategy = strategies[si];

      try {
        const namespace = `doc-${docId}-${strategy}-${Date.now()}`;
        const { chunks } = await extractAndChunk(file.buffer, strategy);

        const texts = chunks.map((c) => c.text);
        const { embeddings, provider } = await getEmbeddingsWithFallback(texts);

        await upsertChunks(namespace, chunks, embeddings, provider);

        await prisma.ingestion.upsert({
          where: { documentId_strategy: { documentId: docId, strategy } },
          create: { documentId: docId, strategy, chunkCount: chunks.length, pineconeNamespace: namespace, provider },
          update: { chunkCount: chunks.length, pineconeNamespace: namespace, provider },
        });

        results.push({ strategy, chunkCount: chunks.length, provider, status: "done" });
      } catch (err) {
        console.error(`Ingestion failed for ${strategy}:`, err.message);
        results.push({ strategy, chunkCount: 0, provider: "unknown", status: "error", error: err.message });
      }

      if (si < strategies.length - 1) {
        console.log(`Cooldown ${COOLDOWN_BETWEEN_STRATEGIES / 1000}s before next strategy...`);
        await sleep(COOLDOWN_BETWEEN_STRATEGIES);
      }
    }

    fileBuffers.delete(docId);
    res.json({ documentId: docId, results });
  } catch (err) { next(err); }
}

export async function getIngestStatus(req, res, next) {
  try {
    const docId = parseInt(req.params.id);
    const ingestions = await prisma.ingestion.findMany({
      where: { documentId: docId },
    });
    res.json(ingestions);
  } catch (err) { next(err); }
}
