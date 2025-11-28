import { Router } from "express";
import { manualFeed, weeklyStats, recentFeedHistory } from "../controllers/feedController.js";
import { voiceFeed } from "../controllers/voiceController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/manual", authMiddleware, manualFeed);
router.post("/voice", authMiddleware, voiceFeed);
router.get("/stats/weekly", authMiddleware, weeklyStats);
router.get("/history", authMiddleware, recentFeedHistory);

export default router;

