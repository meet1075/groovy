import { Router } from "express";
import { compareStrategies, getLabRuns } from "../controllers/labController.js";

const router = Router();
router.post("/:id/compare", compareStrategies);
router.get("/:id/runs", getLabRuns);

export default router;
