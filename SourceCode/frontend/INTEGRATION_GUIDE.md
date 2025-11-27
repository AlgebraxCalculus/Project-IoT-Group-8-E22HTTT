# Frontend-Backend Integration Guide

## Tổng quan

Tài liệu này mô tả cách frontend đã được kết nối với backend API của hệ thống Smart Pet Feeder.

## Thay đổi đã thực hiện

### 1. API Service (`src/services/api.js`)

**Thay đổi:**
- Xóa `FeedLogAPI` (backend không có endpoint `/api/feed/logs`)
- Thêm `FeedAPI.weeklyStats()` để gọi endpoint `/api/feed/stats/weekly`

**API Endpoints được sử dụng:**

#### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký tài khoản mới

#### Feed Operations
- `POST /api/feed/manual` - Cho ăn thủ công (mặc định 200g)
- `POST /api/feed/voice` - Cho ăn bằng lệnh giọng nói (body: `{ text: "cho ăn 200 gram" }`)
- `GET /api/feed/stats/weekly` - Lấy thống kê cho ăn 7 ngày gần nhất

#### Schedule Management
- `GET /api/schedules/get` - Lấy danh sách lịch
- `POST /api/schedules/create` - Tạo lịch mới
- `PUT /api/schedules/:id` - Cập nhật lịch
- `DELETE /api/schedules/:id` - Xóa lịch

### 2. Dashboard (`src/pages/Dashboard.jsx`)

**Thay đổi:**
- Đổi từ `FeedLogAPI.list()` sang `FeedAPI.weeklyStats()`
- Cập nhật `chartData` để xử lý dữ liệu từ weekly stats API
- Thay thế bảng "Feed History" (logs chi tiết) bằng "Weekly Summary" (thống kê theo ngày)

**Dữ liệu hiển thị:**
- Biểu đồ: Tổng lượng thức ăn theo ngày (7 ngày gần nhất)
- Bảng: Date, Total Amount, Feed Count cho mỗi ngày

### 3. Register Page (`src/pages/Register.jsx`)

**Thay đổi:**
- Xóa trường "Full Name" (backend không cần)
- Đổi label "Email" thành "Username"
- Đổi `type="email"` thành `type="text"`
- Thêm validation: `minLength={3}` cho username, `minLength={6}` cho password

### 4. Login Page (`src/pages/Login.jsx`)

**Thay đổi:**
- Đổi label "Email" thành "Username"
- Đổi `type="email"` thành `type="text"`
- Giữ nguyên logic authentication flow

### 5. Manual Feed Page (`src/pages/ManualFeed.jsx`)

**Thay đổi lớn:**
- Thay thế MediaRecorder API + backend speech-to-text bằng **Web Speech API** (browser-based)
- Xóa logic ghi âm và gửi audio file lên server
- Sử dụng `SpeechRecognition` API của browser để nhận diện giọng nói trực tiếp
- Gửi text đã nhận diện đến backend endpoint `/api/feed/voice`

**Lợi ích:**
- Không cần backend speech-to-text service
- Nhanh hơn (không cần upload audio)
- Hoạt động trên Chrome và Edge (có hỗ trợ Web Speech API)

### 6. Schedule Page (`src/pages/Schedule.jsx`)

**Không thay đổi** - Đã hoạt động đúng với backend endpoints hiện có.

## Luồng hoạt động

### Authentication Flow

```
1. User vào /register
   → Nhập username + password
   → POST /api/auth/register
   → Backend trả về user object
   → Redirect về /login

2. User vào /login
   → Nhập username + password
   → POST /api/auth/login
   → Backend trả về { token, user }
   → Lưu token vào localStorage
   → Redirect về /

3. Mọi request tiếp theo
   → Axios interceptor tự động thêm header:
      Authorization: Bearer <token>
```

### Manual Feed Flow

```
1. User nhấn "Feed Now"
   → POST /api/feed/manual
   → Backend gửi MQTT command
   → Tạo FeedLog với feedType="manual", amount=200
   → Trả về success message

2. User nhấn "Voice Feed"
   → Browser Web Speech API bắt đầu lắng nghe
   → User nói: "cho ăn 200 gram"
   → Browser chuyển giọng nói thành text
   → POST /api/feed/voice { text: "cho ăn 200 gram" }
   → Backend parse text để tìm số lượng
   → Gửi MQTT command
   → Tạo FeedLog với feedType="voice"
   → Trả về success message
```

### Schedule Flow

```
1. Load schedules
   → GET /api/schedules/get
   → Hiển thị danh sách

2. Create schedule
   → User điền form (time, daysOfWeek, amount, name)
   → POST /api/schedules/create
   → Backend tạo schedule mới
   → Scheduler service sẽ tự động kích hoạt theo lịch

3. Update/Delete
   → PUT /api/schedules/:id
   → DELETE /api/schedules/:id
```

### Dashboard Flow

```
1. Load weekly stats
   → GET /api/feed/stats/weekly
   → Backend trả về array of { date, totalAmount, feedCount }
   → Frontend vẽ biểu đồ và bảng

2. MQTT telemetry
   → Subscribe topic: feeder/{deviceId}/telemetry
   → Nhận realtime data: { weight, lastFeed }
   → Cập nhật UI
```

## Cấu hình môi trường

Tạo file `.env` trong thư mục `frontend/`:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000

# MQTT Broker (HiveMQ Cloud)
VITE_MQTT_URL=wss://e4b01f831a674150bbae2854b6f1735c.s1.eu.hivemq.cloud:8884/mqtt
VITE_MQTT_USERNAME=quandotrung
VITE_MQTT_PASSWORD=Pass1235

# Device ID
VITE_DEVICE_ID=petfeeder-feed-node-01
```

## Yêu cầu trình duyệt

- **Chrome/Edge**: Đầy đủ chức năng (bao gồm Web Speech API)
- **Firefox/Safari**: Một số chức năng giọng nói có thể không hoạt động

## Cách chạy

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Testing

### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "123456"}'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "123456"}'
```

### 3. Manual Feed (với token)
```bash
curl -X POST http://localhost:5000/api/feed/manual \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Voice Feed
```bash
curl -X POST http://localhost:5000/api/feed/voice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "cho ăn 200 gram"}'
```

### 5. Weekly Stats
```bash
curl -X GET http://localhost:5000/api/feed/stats/weekly \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Lưu ý quan trọng

1. **Backend không có endpoint để lấy feed logs chi tiết** - Chỉ có weekly stats (aggregated data)
2. **Voice feed sử dụng Web Speech API của browser** - Không cần backend speech service
3. **JWT token có hiệu lực 7 ngày** - Sau đó cần đăng nhập lại
4. **MQTT chỉ dùng để nhận telemetry** - Các lệnh feed được gửi qua REST API, backend sẽ publish MQTT
5. **Schedule được xử lý tự động bởi backend** - Cron job chạy mỗi phút để kiểm tra

## Troubleshooting

### "401 Unauthorized"
- Kiểm tra token đã được lưu trong localStorage chưa
- Token có thể đã hết hạn → Đăng nhập lại

### "MQTT offline"
- Kiểm tra MQTT broker URL và credentials
- Kiểm tra network/firewall

### "Voice recognition not working"
- Sử dụng Chrome hoặc Edge
- Cho phép quyền microphone
- Kiểm tra HTTPS (Web Speech API yêu cầu HTTPS trên production)

### "Invalid voice command"
- Backend parse text tìm cụm "cho ăn" + số lượng gram
- Ví dụ hợp lệ: "cho ăn 200 gram", "cho ăn 150 gr", "cho ăn 50g"
- Số lượng phải từ 5-1000 gram

## Tính năng đã được kết nối

✅ Authentication (Register/Login)  
✅ Manual Feed  
✅ Voice Feed (Web Speech API)  
✅ Schedule CRUD  
✅ Weekly Stats Dashboard  
✅ MQTT Telemetry  
✅ Protected Routes  
✅ Logout  

## Backend API Documentation

Xem chi tiết tại: `backend/API_DOCUMENTATION.md`

