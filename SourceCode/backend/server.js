import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import cron from "node-cron";
import authRoutes from "./routes/auth.js";
import feedRoutes from "./routes/feed.js";
import scheduleRoutes from "./routes/schedule.js";
import { connectDB } from "./config/database.js";
// Initialize MQTT service
import "./services/mqttService.js";
// Import scheduler
import { processScheduledFeeds } from "./services/schedulerService.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

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
