import { Router } from "express";
import { getFeedLogs, manualFeed, weeklyStats } from "../controllers/feedController.js";
import { voiceFeed } from "../controllers/voiceController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/logs", authMiddleware, getFeedLogs);
router.post("/manual", authMiddleware, manualFeed);
router.post("/voice", authMiddleware, voiceFeed);
router.get("/stats/weekly", authMiddleware, weeklyStats);

export default router;

