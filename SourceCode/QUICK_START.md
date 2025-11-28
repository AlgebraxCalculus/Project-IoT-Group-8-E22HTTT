# Quick Start Guide - Smart Pet Feeder

## Bước 1: Cấu hình Backend

### 1.1. Tạo file .env
Trong thư mục `backend/`, tạo file `.env` với nội dung:

```env
PORT=5000

MONGODB_URI=mongodb+srv://root:12345@cluster-1.k28cwf8.mongodb.net/IOT_PetFeederDB?retryWrites=true&w=majority&appName=Cluster-1

JWT_SECRET=e4a0f5857b91a2c990bbcf7af2e16c0b4a830bc3b2eaa6cc8bbc885de9133f45

MQTT_BROKER_URL=mqtts://e4b01f831a674150bbae2854b6f1735c.s1.eu.hivemq.cloud:8883

MQTT_FEED_TOPIC=petfeeder/feed

MQTT_USERNAME=quandotrung

MQTT_PASSWORD=Pass1235
```

**Hoặc copy từ file có sẵn:**
```bash
cd backend
copy .env.example .env
```

### 1.2. Cài đặt và chạy Backend
```bash
cd backend
npm install
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

## Bước 2: Cấu hình Frontend

### 2.1. Tạo file .env (Optional)
Trong thư mục `frontend/`, tạo file `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_MQTT_URL=wss://e4b01f831a674150bbae2854b6f1735c.s1.eu.hivemq.cloud:8884/mqtt
VITE_MQTT_USERNAME=quandotrung
VITE_MQTT_PASSWORD=Pass1235
VITE_DEVICE_ID=petfeeder-feed-node-01
```

**Lưu ý:** Frontend đã có các giá trị mặc định, không tạo `.env` vẫn hoạt động.

### 2.2. Cài đặt và chạy Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## Bước 3: Test hệ thống

### 3.1. Đăng ký tài khoản
1. Truy cập `http://localhost:5173/register`
2. Nhập username (tối thiểu 3 ký tự)
3. Nhập password (tối thiểu 6 ký tự)
4. Nhấn "Register"

### 3.2. Đăng nhập
1. Truy cập `http://localhost:5173/login`
2. Nhập username và password vừa tạo
3. Nhấn "Login"

### 3.3. Test các chức năng

#### Dashboard
- Xem biểu đồ thống kê cho ăn 7 ngày
- Xem bảng tổng hợp theo ngày
- Xem MQTT status (online/offline)
- Xem telemetry realtime (nếu có thiết bị kết nối)

#### Manual Feed
- Nhấn "Feed Now" để cho ăn ngay lập tức (200g)
- Nhấn "Voice Feed" và nói: "cho ăn 200 gram"

#### Schedule
- Tạo lịch cho ăn tự động
- Chọn thời gian (HH:MM)
- Chọn ngày trong tuần
- Nhập số lượng (gram)
- Backend sẽ tự động thực hiện theo lịch

## Bước 4: Kiểm tra Backend hoạt động

### Test API với curl

#### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"testuser\", \"password\": \"123456\"}"
```

#### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"testuser\", \"password\": \"123456\"}"
```

Lưu `token` từ response để dùng cho các request tiếp theo.

#### 3. Manual Feed
```bash
curl -X POST http://localhost:5000/api/feed/manual \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. Weekly Stats
```bash
curl -X GET http://localhost:5000/api/feed/stats/weekly \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 5. Get Schedules
```bash
curl -X GET http://localhost:5000/api/schedules/get \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Kiểm tra kết nối

### Backend Health Check
```bash
curl http://localhost:5000/health
```

Kết quả mong đợi:
```json
{
  "status": "ok",
  "time": "2024-11-27T..."
}
```

### MongoDB Connection
Kiểm tra log backend, phải thấy:
```
MongoDB connected successfully
```

### MQTT Connection
Kiểm tra log backend, phải thấy:
```
MQTT connected to broker
```

## Troubleshooting

### Backend không kết nối được MongoDB
- Kiểm tra `MONGODB_URI` trong `.env`
- Kiểm tra kết nối internet
- Kiểm tra MongoDB Atlas có cho phép IP của bạn không

### Backend không kết nối được MQTT
- Kiểm tra `MQTT_BROKER_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD`
- Kiểm tra HiveMQ Cloud broker có hoạt động không
- Kiểm tra firewall/network

### Frontend không gọi được API
- Kiểm tra backend đã chạy chưa
- Kiểm tra `VITE_API_BASE_URL` trong frontend `.env`
- Kiểm tra CORS đã được enable trong backend

### Voice Feed không hoạt động
- Chỉ hoạt động trên Chrome/Edge
- Cần cho phép quyền microphone
- Nói rõ ràng: "cho ăn [số] gram"

## Cấu trúc dự án

```
Project-IoT-Group-8-E22HTTT/
├── SourceCode/
│   ├── backend/
│   │   ├── .env                 ← Tạo file này
│   │   ├── .env.example         ← Copy từ file này
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   │
│   └── frontend/
│       ├── .env                 ← Optional
│       ├── package.json
│       ├── index.html
│       └── src/
│           ├── App.jsx
│           ├── main.jsx
│           ├── pages/
│           ├── components/
│           ├── services/
│           └── hooks/
│
├── QUICK_START.md               ← File này
└── README.md
```

## Tài liệu chi tiết

- Backend API: `backend/API_DOCUMENTATION.md`
- Frontend Integration: `frontend/INTEGRATION_GUIDE.md`
- Frontend Manual: `frontend/MANUAL.md`

## Các tính năng đã được tích hợp

✅ Authentication (JWT)  
✅ Manual Feed (REST API)  
✅ Voice Feed (Web Speech API + Backend)  
✅ Schedule Management (CRUD)  
✅ Automatic Scheduled Feeding (Cron)  
✅ Weekly Statistics (7 days)  
✅ MQTT Telemetry (realtime data)  
✅ Protected Routes  
✅ Responsive UI  

## Lưu ý

1. **Backend KHÔNG được sửa** - Chỉ frontend được cập nhật để kết nối
2. **Voice Feed sử dụng Web Speech API** - Browser nhận diện giọng nói trước khi gửi text lên server
3. **JWT token có hiệu lực 7 ngày**
4. **Scheduled feeding được xử lý tự động** - Backend kiểm tra mỗi phút
5. **MQTT chỉ dùng cho telemetry** - Feed commands được gửi qua REST API

## Support

Nếu gặp vấn đề, kiểm tra:
1. Log của backend trong terminal
2. Console của frontend trong browser (F12)
3. Network tab để xem API requests
4. MongoDB Atlas logs
5. HiveMQ Cloud dashboard


