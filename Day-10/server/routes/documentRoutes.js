import { Router } from "express";
import upload from "../middleware/upload.js";
import { listDocuments, uploadDocument, getDocument, getPage } from "../controllers/documentController.js";

const router = Router();

router.get("/", listDocuments);
router.post("/upload", upload.single("pdf"), uploadDocument);
router.get("/:id", getDocument);
router.get("/:id/pages/:pageNumber", getPage);

export default router;
