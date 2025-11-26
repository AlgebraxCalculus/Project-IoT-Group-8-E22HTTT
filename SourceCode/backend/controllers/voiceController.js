import { triggerVoiceFeed } from "../services/feedService.js";
import speechService from "../services/speechModule.js";

const DEFAULT_FEED_AMOUNT = 50; // gram

export const voiceFeed = async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      message: "Text input is required",
      error: "Vui lòng cung cấp text từ lệnh voice",
    });
  }

  // Dùng cùng logic parse command với speech-module (Whisper)
  const command = speechService.parseCommand(text);

  if (!command || command.action !== "feed") {
    // Không coi đây là lỗi nữa, chỉ bỏ qua lệnh không liên quan đến cho ăn
    return res.status(200).json({
      message: "Voice command ignored (not a feed command)",
      parsedText: text,
      parsedCommand: command,
    });
  }

  // Nếu không có amount, dùng lượng mặc định
  let amount = command.amount ?? DEFAULT_FEED_AMOUNT;

  // Validate lượng thức ăn (an toàn cơ bản)
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      message: "Invalid feed amount from voice command",
      error: "Số lượng thức ăn không hợp lệ trong lệnh voice",
      parsedCommand: command,
    });
  }

  // Giới hạn trong khoảng hợp lý
  if (amount < 5 || amount > 1000) {
    return res.status(400).json({
      message: "Feed amount out of range",
      error: "Số lượng phải từ 5 đến 1000 gram",
      parsedAmount: amount,
      parsedCommand: command,
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
      parsedCommand: command,
    });
  } catch (error) {
    console.error("Voice feed error:", error.message);
    return res.status(502).json({
      message: "Failed to send voice feeding command",
      error: error.message,
    });
  }
};

