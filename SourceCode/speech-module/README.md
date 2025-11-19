# 🎤 Speech-to-Text Module (Whisper Edition)

Module Speech-to-Text cho hệ thống IoT Cho Thú Cưng Ăn Tự Động, chạy hoàn toàn offline nhờ OpenAI Whisper (triển khai qua thư viện `@xenova/transformers`).

## 📋 Mục lục
- [Tính năng](#tính-năng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Sử dụng](#sử-dụng)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

## ✨ Tính năng
- ✅ Chuyển đổi giọng nói thành văn bản bằng OpenAI Whisper (Xenova/transformers) – không cần API key
- ✅ Hỗ trợ tiếng Việt và đa ngôn ngữ (tự động nhận diện)
- ✅ Chạy offline, dữ liệu audio không thoát khỏi máy chủ
- ✅ Parse lệnh từ text thành command object cho hệ thống IoT
- ✅ Giao diện web ghi âm và test nhanh
- ✅ RESTful API sẵn sàng tích hợp với backend chính

## 🖥️ Yêu cầu hệ thống
- Node.js ≥ 18 (để hỗ trợ `fetch`, `FormData`, `esm`)
- RAM tối thiểu 4GB (khuyến nghị ≥ 8GB cho model nhỏ/medium)
- Không cần cài Python hay ffmpeg thủ công (đã dùng `ffmpeg-static`)

## 🚀 Cài đặt

### 1. Cài đặt dependencies
```bash
cd speech-module/backend
npm install
```

### 2. Lần chạy đầu tiên
- Khi chạy server lần đầu, `@xenova/transformers` sẽ tự động tải model Whisper về máy (~240MB cho `whisper-small` quantized).
- Model mặc định: `Xenova/whisper-small` (quantized)
- Các model đã tải được lưu trong cache của thư viện (thường tại `~/.cache/huggingface/transformers` hoặc `%TEMP%\transformers_cache`).

### 3. Chạy server
```bash
cd speech-module/backend
npm start
```

Server chạy tại `http://localhost:3001`

## 📁 Cấu trúc thư mục
```
speech-module/
├── backend/
│   ├── server.js           # Express server chính
│   ├── speechService.js    # Service xử lý Whisper
│   ├── package.json
│   └── uploads/            # Thư mục chứa file audio tạm
├── frontend/
│   └── index.html          # Giao diện test ghi âm
├── .gitignore
├── QUICKSTART.md
└── README.md
```

## ⚙️ Cấu hình
Tạo file `.env` (tuỳ chọn) trong thư mục `backend/` để override cấu hình mặc định:
```env
PORT=3001
NODE_ENV=development
WHISPER_MODEL=Xenova/whisper-small
WHISPER_QUANTIZED=true
```

- `WHISPER_MODEL`: chọn model khác (`Xenova/whisper-tiny`, `Xenova/whisper-base`, `Xenova/whisper-medium`, ...)
- `WHISPER_QUANTIZED`: `true` (mặc định) giúp nhẹ hơn và chạy nhanh hơn. Đặt `false` nếu muốn độ chính xác cao nhất (cần nhiều RAM hơn).

## 🎯 Sử dụng

### Test với giao diện web
1. Chạy server:
   ```bash
   cd speech-module/backend
   npm start
   ```
2. Mở trình duyệt: `http://localhost:3001`
3. Bấm "Bắt đầu ghi âm", nói lệnh (ví dụ: "Cho ăn 50 gram"), sau đó bấm "Dừng"
4. Xem kết quả transcription & command đã parse

### Sử dụng API từ code
#### JavaScript/Node.js
```javascript
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testSpeechToText() {
  const formData = new FormData();
  formData.append('audio', fs.createReadStream('audio.webm'));
  formData.append('languageCode', 'vi-VN'); // Tuỳ chọn, Whisper vẫn tự detect

  const response = await fetch('http://localhost:3001/api/speech-command', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  console.log('Transcription:', data.transcription);
  console.log('Command:', data.command);
}

testSpeechToText();
```

#### React Frontend (ví dụ)
```javascript
async function handleVoiceCommand(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('languageCode', 'vi-VN');

  const response = await fetch('http://localhost:3001/api/speech-command', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  
  if (data.success) {
    const { action, amount } = data.command;
    if (action === 'feed') {
      sendMQTTCommand({ action: 'feed', amount });
    }
  }
}
```

## 📡 API Endpoints

### `GET /api/health`
Kiểm tra trạng thái server.
```json
{
  "status": "ok",
  "message": "Speech-to-Text API is running!",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### `POST /api/speech-to-text`
Nhận file audio, trả về text.
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `audio`: File audio (webm, wav, mp3, ogg...)
  - `languageCode`: (optional) gợi ý ngôn ngữ (`vi-VN`, `en-US`, ...)

**Response mẫu:**
```json
{
  "success": true,
  "text": "cho ăn 50 gram",
  "confidence": null,
  "processingTime": "3.21s",
  "language": "vi"
}
```
> Whisper không trả về confidence score nên giá trị này là `null`.

### `POST /api/parse-command`
Parse text thành command object.
```json
{
  "text": "cho ăn 50 gram"
}
```

**Response:**
```json
{
  "success": true,
  "originalText": "cho ăn 50 gram",
  "command": {
    "action": "feed",
    "amount": 50,
    "unit": "gram",
    "rawText": "cho ăn 50 gram",
    "confidence": "high"
  }
}
```

### `POST /api/speech-command`
Kết hợp Speech-to-Text + parse command (khuyến nghị).
- Body: giống `/api/speech-to-text`

```json
{
  "success": true,
  "transcription": "cho ăn 50 gram",
  "confidence": null,
  "command": {
    "action": "feed",
    "amount": 50,
    "unit": "gram",
    "rawText": "cho ăn 50 gram",
    "confidence": "high"
  },
  "processingTime": "3.21s"
}
```

## 🐛 Troubleshooting

### "Cannot find module '@xenova/transformers'"
```bash
cd speech-module/backend
npm install
```

### Model download chậm hoặc thất bại
- Kiểm tra kết nối Internet (lần tải đầu tiên cần mạng)
- Sau khi tải xong có thể chạy offline
- Đặt biến `TRANSFORMERS_CACHE` để trỏ tới thư mục cache mong muốn (tuỳ chọn)

### Lỗi FFmpeg conversion failed
- Đảm bảo file audio hợp lệ (webm/wav/mp3)
- Thử ghi âm lại từ giao diện frontend (đã tương thích sẵn)

### Máy yếu, tốc độ xử lý chậm
- Đổi sang model nhỏ hơn: đặt `WHISPER_MODEL=Xenova/whisper-tiny` hoặc `Xenova/whisper-base`
- Giữ `WHISPER_QUANTIZED=true` để giảm tải

### Không nhận diện đúng ngôn ngữ
- Gửi thêm `languageCode` (ví dụ `vi-VN`) để gợi ý
- Nói rõ ràng, tránh tạp âm

## 📊 Command Parsing
| Lệnh nói            | Action  | Amount | Unit |
|---------------------|---------|--------|------|
| "Cho ăn"            | `feed`  | `null` (mặc định) | `gram` |
| "Cho 50 gram"       | `feed`  | `50`   | `gram` |
| "Cho 100g"          | `feed`  | `100`  | `gram` |
| "Cho 1 kg"          | `feed`  | `1000` | `gram` |
| "Dừng"              | `stop`  | `null` | - |
| "Kiểm tra"          | `status`| `null` | - |

## 🔐 Bảo mật
- Không cần credentials/API key
- Audio chỉ xử lý trong nội bộ server
- Vẫn nên triển khai HTTPS, auth, rate limiting khi đưa vào production

## 📝 License
MIT

## 👥 Contributors
IoT Group 8 - E22HTTT

