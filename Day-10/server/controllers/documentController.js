import prisma from "../config/db.js";
import { extractPages } from "../services/pdfService.js";

export async function listDocuments(req, res, next) {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { uploadedAt: "desc" },
      include: { _count: { select: { queries: true } } },
    });
    res.json(docs.map((d) => ({
      id: d.id,
      filename: d.filename,
      pageCount: d.pageCount,
      totalChars: d.totalChars,
      uploadedAt: d.uploadedAt,
      queryCount: d._count.queries,
    })));
  } catch (err) {
    next(err);
  }
}

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const { originalname, buffer } = req.file;

    // Extract text per page
    const { pageCount, pages, totalChars } = await extractPages(buffer);

    // Store in DB
    const doc = await prisma.document.create({
      data: {
        filename: originalname,
        pageCount,
        totalChars,
        pages: {
          create: pages.map((p) => ({
            pageNumber: p.pageNumber,
            pageText: p.text,
          })),
        },
      },
      include: { pages: true },
    });

    res.json({
      id: doc.id,
      filename: doc.filename,
      pageCount: doc.pageCount,
      totalChars: doc.totalChars,
      uploadedAt: doc.uploadedAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDocument(req, res, next) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!doc) return res.status(404).json({ error: "Document not found." });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

export async function getPage(req, res, next) {
  try {
    const docId = parseInt(req.params.id);
    const pageNum = parseInt(req.params.pageNumber);
    const page = await prisma.documentPage.findUnique({
      where: { documentId_pageNumber: { documentId: docId, pageNumber: pageNum } },
    });
    if (!page) return res.status(404).json({ error: "Page not found." });
    res.json({ pageNumber: page.pageNumber, text: page.pageText });
  } catch (err) {
    next(err);
  }
}
