import { Router } from "express";
import upload from "../middleware/upload.js";
import { listDocuments, uploadDocument, getDocument, ingestAll, getIngestStatus, startIngestion, getIngestProgress } from "../controllers/documentController.js";

const router = Router();
router.get("/", listDocuments);
router.post("/upload", upload.single("pdf"), uploadDocument);
router.get("/:id", getDocument);
router.post("/:id/ingest-all", upload.single("pdf"), ingestAll);
router.post("/:id/start-ingestion", startIngestion);
router.get("/:id/ingest-status", getIngestStatus);
router.get("/:id/ingest-progress", getIngestProgress);

export default router;
