const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const wav = require('node-wav');

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  console.warn('⚠️ ffmpeg-static could not determine a binary path. Ensure FFmpeg is installed and available in PATH.');
}

class SpeechService {
  constructor() {
    this.pipelinePromise = null;
    this.modelName = process.env.WHISPER_MODEL || 'Xenova/whisper-small';
    this.modelQuantized = process.env.WHISPER_QUANTIZED !== 'false';
  }

  /**
   * Lazy load Whisper model
   */
  async getPipeline() {
    if (!this.pipelinePromise) {
      this.pipelinePromise = import('@xenova/transformers').then(async ({ pipeline }) => {
        console.log(`🔁 Loading Whisper model: ${this.modelName} (quantized=${this.modelQuantized})`);
        const start = Date.now();
        const whisperPipeline = await pipeline('automatic-speech-recognition', this.modelName, {
          quantized: this.modelQuantized,
        });
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`✅ Whisper model loaded in ${duration}s`);
        return whisperPipeline;
      }).catch(error => {
        console.error('❌ Failed to load Whisper model:', error);
        this.pipelinePromise = null;
        throw error;
      });
    }
    return this.pipelinePromise;
  }

  /**
   * Convert input audio to 16kHz mono WAV (required by Whisper)
   * @param {string} inputPath
   * @returns {Promise<string>} output WAV path
   */
  async convertToWav(inputPath) {
    const outputPath = `${inputPath}-converted.wav`;

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-ac 1', // mono
          '-ar 16000', // 16kHz
          '-f wav',
        ])
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', (error) => {
          reject(new Error(`FFmpeg conversion failed: ${error.message}`));
        })
        .save(outputPath);
    });
  }

  /**
   * Chuyển đổi audio thành text bằng Whisper
   * @param {string} audioFilePath - Đường dẫn đến file audio
   * @param {object} options - Tùy chọn: languageCode (gợi ý, Whisper tự detect)
   * @returns {Promise<object>} {text, languageCode}
   */
  async transcribeAudio(audioFilePath, options = {}) {
    const normalizeLanguageCode = (code) => {
      if (!code || typeof code !== 'string') return undefined;
      // Lấy phần ngôn ngữ chính (ví dụ vi-VN -> vi, en-US -> en)
      const base = code.split(/[-_]/)[0].toLowerCase();
      // Danh sách chuẩn đơn giản cho các ngôn ngữ hay dùng
      const supported = new Set([
        'vi','en','fr','de','es','it','pt','ru','ja','ko','zh','ar','hi','id','th','tr'
      ]);
      return supported.has(base) ? base : undefined;
    };

    let wavPath = null;
    try {
      const pipeline = await this.getPipeline();

      // Whisper cần WAV 16kHz mono -> convert
      wavPath = await this.convertToWav(audioFilePath);

      console.log(`🔍 Transcribing audio with Whisper...`);
      const start = Date.now();

      // Đọc dữ liệu WAV vào bộ nhớ và giải mã thành Float32Array
      const wavBuffer = await fs.promises.readFile(wavPath);
      const decoded = wav.decode(wavBuffer);
      if (!decoded || !decoded.channelData || decoded.channelData.length === 0) {
        throw new Error('Decoded audio is empty');
      }
      const audioInput = decoded.channelData[0]; // Float32Array kênh đơn

      const result = await pipeline(audioInput, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: normalizeLanguageCode(options.languageCode),
        task: 'transcribe',
        return_timestamps: false,
        sampling_rate: decoded.sampleRate,
      });

      const duration = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`📝 Whisper result: "${result?.text?.trim() || ''}"`);
      console.log(`⏱️ Whisper processing time: ${duration}s`);

      // Xóa file convert tạm
      if (fs.existsSync(wavPath)) {
        fs.unlinkSync(wavPath);
      }

      return {
        text: (result?.text || '').trim(),
        confidence: null,
        languageCode: result?.language || options.languageCode || 'unknown',
      };
    } catch (error) {
      if (wavPath && fs.existsSync(wavPath)) {
        fs.unlinkSync(wavPath);
      }
      console.error('❌ Whisper transcription error:', error);
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }

  /**
   * Parse text thành command cho hệ thống IoT
   * @param {string} text - Text từ speech-to-text
   * @returns {object} Command object
   */
  parseCommand(text) {
    if (!text || typeof text !== 'string') {
      return {
        action: 'unknown',
        amount: null,
        unit: null,
        rawText: text,
      };
    }

    const lowerText = text.toLowerCase().trim();
    const command = {
      action: 'unknown',
      amount: null,
      unit: 'gram',
      rawText: text,
      confidence: 'low',
    };

    // Tìm số lượng (gram, g, kg)
    const amountPatterns = [
      /(\d+)\s*(?:gram|g|gr)/i,
      /(\d+)\s*(?:kilogram|kg)/i,
      /cho\s+(\d+)/i,
      /(\d+)/,
    ];

    for (const pattern of amountPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        let amount = parseInt(match[1]);
        
        // Chuyển kg sang gram
        if (lowerText.includes('kg') || lowerText.includes('kilogram')) {
          amount = amount * 1000;
          command.unit = 'gram';
        }
        
        command.amount = amount;
        break;
      }
    }

    // Xác định action
    const feedKeywords = [
      'cho ăn',
      'cho thú cưng ăn',
      'cho pet ăn',
      'feed',
      'feeding',
      'cho thức ăn',
      'đổ thức ăn',
    ];

    const stopKeywords = [
      'dừng',
      'stop',
      'ngừng',
      'tắt',
      'cancel',
    ];

    const statusKeywords = [
      'kiểm tra',
      'xem',
      'check',
      'status',
      'tình trạng',
      'lượng thức ăn',
    ];

    if (feedKeywords.some(keyword => lowerText.includes(keyword))) {
      command.action = 'feed';
      command.confidence = 'high';
    } else if (stopKeywords.some(keyword => lowerText.includes(keyword))) {
      command.action = 'stop';
      command.confidence = 'high';
    } else if (statusKeywords.some(keyword => lowerText.includes(keyword))) {
      command.action = 'status';
      command.confidence = 'high';
    } else if (command.amount !== null) {
      // Nếu có số lượng nhưng không rõ action, mặc định là feed
      command.action = 'feed';
      command.confidence = 'medium';
    }

    // Xử lý các lệnh đặc biệt
    if (lowerText.includes('mặc định') || lowerText.includes('default')) {
      command.action = 'feed';
      command.amount = null; // Dùng lượng mặc định
      command.confidence = 'high';
    }

    return command;
  }

  /**
   * Kiểm tra kết nối với Google Cloud
   */
  async testConnection() {
    try {
      await this.getPipeline();
      return {
        connected: true,
        message: `Whisper model ${this.modelName} is ready`,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
module.exports = new SpeechService();

