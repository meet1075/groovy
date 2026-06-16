import prisma from "../config/db.js";
import { answerQuestion } from "../services/groqService.js";

export async function askQuestion(req, res, next) {
  try {
    const docId = parseInt(req.params.id);
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question is required." });
    }

    // Fetch document pages
    const pages = await prisma.documentPage.findMany({
      where: { documentId: docId },
      orderBy: { pageNumber: "asc" },
    });

    if (pages.length === 0) {
      return res.status(404).json({ error: "Document not found or has no pages." });
    }

    // Call Groq
    const result = await answerQuestion(
      pages.map((p) => ({ pageNumber: p.pageNumber, pageText: p.pageText })),
      question.trim()
    );

    // Save to DB
    const query = await prisma.query.create({
      data: {
        documentId: docId,
        question: question.trim(),
        answer: result.answer,
        citedPages: result.citedPages,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        estimatedCost: result.estimatedCost,
        responseTimeMs: result.responseTimeMs,
      },
    });

    res.json({
      id: query.id,
      answer: result.answer,
      citedPages: result.citedPages,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost,
      responseTimeMs: result.responseTimeMs,
    });
  } catch (err) {
    next(err);
  }
}

export async function getQueries(req, res, next) {
  try {
    const docId = parseInt(req.params.id);
    const queries = await prisma.query.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: "asc" },
    });
    res.json(queries);
  } catch (err) {
    next(err);
  }
}
