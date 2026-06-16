import prisma from "../config/db.js";
import { extractChunks } from "../services/pdfService.js";
import { getEmbeddings } from "../services/embeddingService.js";
import { upsertChunks } from "../services/pineconeService.js";

export async function listDocuments(req, res, next) {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { uploadedAt: "desc" },
      include: { _count: { select: { queries: true } } },
    });
    res.json(docs.map((d) => ({
      id: d.id, filename: d.filename, pageCount: d.pageCount,
      totalChunks: d.totalChunks, uploadedAt: d.uploadedAt, queryCount: d._count.queries,
    })));
  } catch (err) { next(err); }
}

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const { originalname, buffer } = req.file;
    const { pageCount, chunks, totalChars } = await extractChunks(buffer);
    const namespace = `doc-${Date.now()}`;

    // Create document in DB first
    const doc = await prisma.document.create({
      data: { filename: originalname, pageCount, totalChunks: chunks.length, pineconeNs: namespace },
    });

    // Store chunks in DB
    for (const chunk of chunks) {
      await prisma.documentChunk.create({
        data: {
          documentId: doc.id, pageNumber: chunk.pageNumber,
          chunkIndex: chunk.chunkIndex, chunkText: chunk.text,
          pineconeId: `${namespace}-chunk-${chunk.chunkIndex}`,
        },
      });
    }

    // Generate embeddings and upsert to Pinecone
    const texts = chunks.map((c) => c.text);
    const embeddings = await getEmbeddings(texts);
    await upsertChunks(namespace, chunks, embeddings);

    res.json({
      id: doc.id, filename: doc.filename, pageCount: doc.pageCount,
      totalChunks: chunks.length, uploadedAt: doc.uploadedAt,
    });
  } catch (err) { next(err); }
}

export async function getDocument(req, res, next) {
  try {
    const doc = await prisma.document.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!doc) return res.status(404).json({ error: "Document not found." });
    res.json(doc);
  } catch (err) { next(err); }
}
