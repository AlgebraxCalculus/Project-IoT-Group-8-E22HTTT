# 🚀 Quick Start Guide (Whisper)

Hướng dẫn nhanh để test Speech-to-Text module với OpenAI Whisper (Xenova) chạy offline.

## ⚡ Bước 1: Cài đặt (5 phút)
```bash
# Di chuyển vào thư mục backend
cd speech-module/backend

# Cài đặt dependencies
npm install
```

## 📥 Bước 2: Lần chạy đầu tiên
- Chạy `npm start` (xem bước 3) lần đầu sẽ tự tải model Whisper (~240MB).
- Giữ kết nối Internet cho đến khi tải xong.
- Model mặc định: `Xenova/whisper-small` (quantized).

## 🎯 Bước 3: Chạy Server
```bash
cd speech-module/backend
npm start
```
Bạn sẽ thấy log tương tự:
```
🚀 Speech-to-Text Server started!
📡 Server running on http://localhost:3001
🌐 Frontend: http://localhost:3001
🔁 Loading Whisper model: Xenova/whisper-small (quantized=true)
✅ Whisper model loaded in 12.3s
```

## 🧪 Bước 4: Test
### Cách 1: Test bằng giao diện web (khuyến nghị)
1. Mở trình duyệt: http://localhost:3001
2. Cho phép quyền microphone
3. Click "Bắt đầu ghi âm" → nói lệnh (ví dụ: **"Cho 50 gram"**)
4. Click "Dừng" → xem kết quả transcription và command

### Cách 2: Test API (Postman/Thunder Client)
1. Tạo request `POST http://localhost:3001/api/speech-command`
2. Body `form-data`
3. Key `audio` → chọn file audio (.webm/.wav/.mp3)
4. (Tuỳ chọn) thêm `languageCode = vi-VN`
5. Send → xem JSON trả về

### Cách 3: Test bằng cURL
```bash
curl -X POST http://localhost:3001/api/speech-command \
  -F "audio=@test-audio.webm" \
  -F "languageCode=vi-VN"
```

## ✅ Checklist
- [ ] Chạy `npm install`
- [ ] Server khởi động thành công ở port 3001
- [ ] Frontend truy cập được tại `http://localhost:3001`
- [ ] Whisper model tải xong (log "Whisper model loaded")
- [ ] Microphone hoạt động
- [ ] Đã test lệnh nói thành công

## 🎤 Lệnh test gợi ý
- "Cho ăn"
- "Cho 50 gram"
- "Cho 100g thức ăn"
- "Dừng lại"
- "Kiểm tra lượng thức ăn"

## 🐛 Lỗi thường gặp & cách khắc phục
- **"Cannot find module '@xenova/transformers'"** → chạy `npm install`
- **Model download chậm** → kiểm tra mạng; lần sau chạy offline
- **"FFmpeg conversion failed"** → ghi âm lại bằng giao diện web hoặc dùng file audio khác
- **Transcription chậm** → đổi sang model nhỏ hơn `WHISPER_MODEL=Xenova/whisper-tiny`
- **Không nhận diện đúng tiếng Việt** → gửi thêm `languageCode=vi-VN`, nói rõ ràng hơn

## 📞 Thông tin thêm
Xem file [`README.md`](./README.md) để biết chi tiết cấu hình, API và troubleshooting nâng cao.

