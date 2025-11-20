const FEED_TRIGGER_REGEX = /cho\s*ăn/i;
const AMOUNT_REGEX = /(\d+)\s*(gram|gr|g)\b/i;

/**
 * Parse voice command text to extract feeding instruction
 * @param {String} text - Voice command text
 * @returns {Object} { shouldFeed: Boolean, amount: Number|null, error: String|null }
 */
export const parseVoiceCommand = (text = "") => {
  if (!text || typeof text !== "string") {
    return { shouldFeed: false, amount: null, error: "Invalid text input" };
  }

  const normalized = text.trim().toLowerCase();
  
  // Check for feed trigger phrase
  const hasTrigger = FEED_TRIGGER_REGEX.test(normalized);
  if (!hasTrigger) {
    return { 
      shouldFeed: false, 
      amount: null, 
      error: "Không tìm thấy cụm từ 'cho ăn' trong lệnh" 
    };
  }

  // Extract amount
  const amountMatch = normalized.match(AMOUNT_REGEX);
  if (!amountMatch) {
    return { 
      shouldFeed: false, 
      amount: null, 
      error: "Không tìm thấy số lượng gram trong lệnh (ví dụ: 200 gram)" 
    };
  }

  const amount = Number(amountMatch[1]);
  if (Number.isNaN(amount) || amount <= 0) {
    return { 
      shouldFeed: false, 
      amount: null, 
      error: "Số lượng gram không hợp lệ" 
    };
  }

  // Validate amount range
  if (amount < 5 || amount > 1000) {
    return { 
      shouldFeed: false, 
      amount: null, 
      error: "Số lượng phải từ 5 đến 1000 gram" 
    };
  }

  return { shouldFeed: true, amount, error: null };
};

