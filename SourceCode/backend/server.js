import "./config/loadEnv.js";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import cron from "node-cron";
import multer from "multer";
import fs from "fs";
import path from "path";
import authRoutes from "./routes/auth.js";
import feedRoutes from "./routes/feed.js";
import scheduleRoutes from "./routes/schedule.js";
import { connectDB } from "./config/database.js";
// Initialize MQTT service
import "./services/mqttService.js";
// Import scheduler
import { processScheduledFeeds } from "./services/schedulerService.js";
import speechService from "./services/speechModule.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ================== Speech-to-Text (Whisper) integration ==================
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "audio/webm",
      "audio/wav",
      "audio/mp3",
      "audio/mpeg",
      "audio/ogg",
      "audio/opus",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only audio files are allowed."));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Health check for speech module
app.get("/api/speech/health", async (req, res) => {
  try {
    const status = await speechService.testConnection();
    res.json({
      status: status.connected ? "ok" : "error",
      ...status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

// POST /api/speech-to-text
app.post("/api/speech-to-text", upload.single("audio"), async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided",
        message: "Please send an audio file in the request",
      });
    }

    const result = await speechService.transcribeAudio(req.file.path, {
      languageCode: req.body.languageCode || "vi-VN",
    });

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      text: result.text,
      confidence: result.confidence,
      processingTime: `${processingTime}s`,
      language: result.languageCode,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("❌ Speech-to-text error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/parse-command
app.post("/api/parse-command", (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "Text is required",
      });
    }

    const command = speechService.parseCommand(text);

    res.json({
      success: true,
      originalText: text,
      command,
    });
  } catch (error) {
    console.error("❌ Parse-command error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/speech-command (speech-to-text + parse)
app.post("/api/speech-command", upload.single("audio"), async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided",
      });
    }

    const transcription = await speechService.transcribeAudio(req.file.path, {
      languageCode: req.body.languageCode || "vi-VN",
    });

    const command = speechService.parseCommand(transcription.text);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      transcription: transcription.text,
      confidence: transcription.confidence,
      command,
      processingTime: `${processingTime}s`,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("❌ Speech-command error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
// ========================================================================

app.use("/api/auth", authRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/schedules", scheduleRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Start scheduler - check every minute for scheduled feeds
    cron.schedule("* * * * *", async () => {
      await processScheduledFeeds();
    });

    console.log("Scheduler started - checking for scheduled feeds every minute");
  });
};

startServer();
