import prisma from "../config/db.js";
import { getEmbedding } from "../services/embeddingService.js";
import { queryChunks } from "../services/pineconeService.js";
import { answerQuestion } from "../services/groqService.js";

export async function askQuestion(req, res, next) {
  try {
    const docId = parseInt(req.params.id);
    const { question } = req.body;
    if (!question || !question.trim()) return res.status(400).json({ error: "Question is required." });

    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    // 1. Embed the query
    const queryEmbedding = await getEmbedding(question.trim());

    // 2. Retrieve top 3 chunks from Pinecone
    const matches = await queryChunks(doc.pineconeNs, queryEmbedding, 3);

    if (matches.length === 0) {
      return res.json({ answer: "No relevant chunks found in the document.", citedPages: [], inputTokens: 0, outputTokens: 0, estimatedCost: 0, responseTimeMs: 0, retrievedChunks: [] });
    }

    // 3. Generate answer with Groq using retrieved chunks as context
    const result = await answerQuestion(matches, question.trim());

    // 4. Save to DB
    const query = await prisma.query.create({
      data: {
        documentId: docId, question: question.trim(), answer: result.answer,
        citedPages: result.citedPages, retrievedChunks: matches.map((m) => `[p.${m.pageNumber}] ${m.text.slice(0, 100)}...`),
        inputTokens: result.inputTokens, outputTokens: result.outputTokens,
        estimatedCost: result.estimatedCost, responseTimeMs: result.responseTimeMs,
      },
    });

    res.json({
      id: query.id, answer: result.answer, citedPages: result.citedPages,
      inputTokens: result.inputTokens, outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost, responseTimeMs: result.responseTimeMs,
      retrievedChunks: matches.map((m) => ({ pageNumber: m.pageNumber, score: m.score, text: m.text })),
    });
  } catch (err) { next(err); }
}

export async function getQueries(req, res, next) {
  try {
    const queries = await prisma.query.findMany({
      where: { documentId: parseInt(req.params.id) }, orderBy: { createdAt: "asc" },
    });
    res.json(queries);
  } catch (err) { next(err); }
}
