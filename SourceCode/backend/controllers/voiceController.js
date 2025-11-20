import { parseVoiceCommand } from "../services/voiceService.js";
import { triggerVoiceFeed } from "../services/feedService.js";

export const voiceFeed = async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      message: "Text input is required",
      error: "Vui lòng cung cấp text từ lệnh voice",
    });
  }

  // Parse voice command
  const { shouldFeed, amount, error } = parseVoiceCommand(text);

  if (!shouldFeed) {
    return res.status(400).json({
      message: "Invalid voice command",
      error: error || "Lệnh voice không hợp lệ",
      parsedText: text,
    });
  }

  try {
    const feedLog = await triggerVoiceFeed({
      userId: req.user._id,
      amount,
      voiceCommand: text,
    });

    return res.status(200).json({
      message: "Voice feeding command sent",
      feedLog: feedLog.toObject(),
      parsedAmount: amount,
    });
  } catch (error) {
    console.error("Voice feed error:", error.message);
    return res.status(502).json({
      message: "Failed to send voice feeding command",
      error: error.message,
    });
  }
};

