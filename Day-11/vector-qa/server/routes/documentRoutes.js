import { Router } from "express";
import upload from "../middleware/upload.js";
import { listDocuments, uploadDocument, getDocument } from "../controllers/documentController.js";

const router = Router();
router.get("/", listDocuments);
router.post("/upload", upload.single("pdf"), uploadDocument);
router.get("/:id", getDocument);

export default router;
