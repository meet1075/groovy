import prisma from "../config/db.js";
import { getEmbedding } from "../services/embeddingService.js";
import { queryChunks } from "../services/pineconeService.js";
import { answerQuestion } from "../services/groqService.js";
import { rerankChunks } from "../services/rerankService.js";
import { STRATEGIES } from "../services/chunkingService.js";

export async function compareStrategies(req, res, next) {
  try {
    const docId = parseInt(req.params.id);
    const { question, rerankUsed = false } = req.body;

    if (!question || !question.trim()) return res.status(400).json({ error: "Question is required." });

    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    const ingestions = await prisma.ingestion.findMany({ where: { documentId: docId } });
    if (ingestions.length === 0) return res.status(400).json({ error: "Document not ingested yet." });

    const strategies = Object.keys(STRATEGIES);
    const results = [];

    for (const strategy of strategies) {
      const ingestion = ingestions.find((i) => i.strategy === strategy);
      if (!ingestion) {
        results.push({ strategy, answer: "Not ingested.", citedPages: [], retrievedChunks: [], inputTokens: 0, outputTokens: 0, estimatedCost: 0, responseTimeMs: 0 });
        continue;
      }

      try {
        const provider = ingestion.provider || "gemini";
        const queryEmbedding = await getEmbedding(question.trim(), provider);

        const topK = rerankUsed ? 15 : 3;
        let matches = await queryChunks(ingestion.pineconeNamespace, queryEmbedding, topK, provider);

        let cohereScores = [];
        if (rerankUsed && matches.length > 0) {
          try {
            matches = await rerankChunks(question.trim(), matches, 3);
            cohereScores = matches.map((m) => m.cohereScore);
          } catch (err) {
            console.error(`Cohere rerank failed for ${strategy}:`, err.message);
            matches = matches.slice(0, 3);
          }
        }

        if (matches.length === 0) {
          results.push({ strategy, answer: "No relevant chunks found.", citedPages: [], retrievedChunks: [], inputTokens: 0, outputTokens: 0, estimatedCost: 0, responseTimeMs: 0 });
          continue;
        }

        const result = await answerQuestion(matches, question.trim());

        results.push({
          strategy,
          answer: result.answer,
          citedPages: result.citedPages,
          retrievedChunks: matches.map((m) => ({
            pageNumber: m.pageNumber,
            text: m.text,
            pineconeScore: m.score,
            cohereScore: m.cohereScore || null,
          })),
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCost: result.estimatedCost,
          responseTimeMs: result.responseTimeMs,
        });
      } catch (err) {
        console.error(`Compare failed for ${strategy}:`, err.message);
        results.push({ strategy, answer: `Error: ${err.message}`, citedPages: [], retrievedChunks: [], inputTokens: 0, outputTokens: 0, estimatedCost: 0, responseTimeMs: 0 });
      }
    }

    const labRun = await prisma.labRun.create({
      data: { documentId: docId, question: question.trim(), rerankUsed, results },
    });

    res.json({ id: labRun.id, question: question.trim(), rerankUsed, results, createdAt: labRun.createdAt });
  } catch (err) { next(err); }
}

export async function getLabRuns(req, res, next) {
  try {
    const docId = parseInt(req.params.id);
    const runs = await prisma.labRun.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(runs);
  } catch (err) { next(err); }
}
