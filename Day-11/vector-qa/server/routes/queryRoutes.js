import { Router } from "express";
import { askQuestion, getQueries } from "../controllers/queryController.js";

const router = Router();
router.post("/:id/ask", askQuestion);
router.get("/:id/queries", getQueries);

export default router;
