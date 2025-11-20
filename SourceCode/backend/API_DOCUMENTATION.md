# API Documentation - IoT Pet Feeder Backend

## Tổng quan

Backend API cho hệ thống máy cho thú cưng ăn tự động với các chức năng:
- Đăng ký/Đăng nhập (JWT Authentication)
- Cho ăn thủ công (Manual Feed)
- Đặt lịch cho ăn tự động (Scheduled Feed)
- Cho ăn bằng lệnh voice (Voice Feed)
- Dashboard (sẽ được thêm sau)

---

## Base URL

```
http://localhost:5000/api
```

---

## 1. Authentication Endpoints

### 1.1. Đăng ký (Register)

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "string (min 3 characters)",
  "password": "string (min 6 characters)"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "user_id",
    "username": "username",
    "lastOnline": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation errors
- `409`: Username already exists
- `500`: Server error

---

### 1.2. Đăng nhập (Login)

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "lastOnline": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation errors
- `401`: Invalid credentials
- `500`: Server error

---

## 2. Feed Endpoints

Tất cả feed endpoints yêu cầu authentication header:
```
Authorization: Bearer <jwt_token>
```

### 2.1. Cho ăn thủ công (Manual Feed)

**Endpoint:** `POST /api/feed/manual`

**Description:** Cho thú cưng ăn ngay lập tức với lượng mặc định 200 gram.

**Request Body:**
```json
{}
```
(Không cần gửi gì, hoặc body rỗng)

**Response (200):**
```json
{
  "message": "Feeding manual command sent",
  "feedLog": {
    "_id": "log_id",
    "user": "user_id",
    "feedType": "manual",
    "amount": 200,
    "targetAmount": 200,
    "status": "success",
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-01T00:00:01.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:01.000Z"
  }
}
```

**Error Responses:**
- `401`: Unauthorized (thiếu hoặc token không hợp lệ)
- `502`: Failed to send feeding command (MQTT error)

**Cách hoạt động:**
1. User gửi request (không cần amount)
2. Backend tự động set amount = 200 gram
3. Gửi MQTT command đến thiết bị
4. Tạo FeedLog với feedType = "manual"
5. Trả về kết quả

---

### 2.2. Cho ăn bằng Voice (Voice Feed)

**Endpoint:** `POST /api/feed/voice`

**Description:** Cho thú cưng ăn dựa trên lệnh voice đã được chuyển thành text.

**Request Body:**
```json
{
  "text": "cho ăn 200 gram"
}
```

**Cú pháp lệnh voice:**
- Phải chứa cụm từ "cho ăn" (không phân biệt hoa thường)
- Phải có số lượng gram: `[số] gram` hoặc `[số] gr` hoặc `[số] g`
- Số lượng phải từ 5 đến 1000 gram

**Ví dụ lệnh hợp lệ:**
- "cho ăn 200 gram"
- "Cho ăn 150 gr"
- "cho ăn 50g"
- "Hãy cho ăn 300 gram"

**Response (200):**
```json
{
  "message": "Voice feeding command sent",
  "feedLog": {
    "_id": "log_id",
    "user": "user_id",
    "feedType": "voice",
    "amount": 200,
    "targetAmount": 200,
    "status": "success",
    "voiceCommand": "cho ăn 200 gram",
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-01T00:00:01.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:01.000Z"
  },
  "parsedAmount": 200
}
```

**Error Responses:**
- `400`: Invalid voice command
  ```json
  {
    "message": "Invalid voice command",
    "error": "Không tìm thấy cụm từ 'cho ăn' trong lệnh",
    "parsedText": "text_input"
  }
  ```
- `401`: Unauthorized
- `502`: Failed to send feeding command

**Cách hoạt động:**
1. User gửi text từ lệnh voice
2. Backend parse text để tìm:
   - Cụm từ "cho ăn"
   - Số lượng gram (ví dụ: "200 gram")
3. Validate số lượng (5-1000 gram)
4. Nếu hợp lệ → gửi MQTT command
5. Tạo FeedLog với feedType = "voice" và lưu voiceCommand
6. Trả về kết quả

---

### 2.3. Thống kê lượng thức ăn 7 ngày (Weekly Feed Stats)

**Endpoint:** `GET /api/feed/stats/weekly`

**Description:** Trả về tổng lượng thức ăn và số lần cho ăn cho từng ngày trong 7 ngày gần nhất (bao gồm hôm nay).

**Response (200):**
```json
{
  "days": 7,
  "data": [
    {
      "date": "2024-11-14",
      "totalAmount": 350,
      "feedCount": 2
    },
    {
      "date": "2024-11-15",
      "totalAmount": 0,
      "feedCount": 0
    }
  ]
}
```

**Error Responses:**
- `401`: Unauthorized
- `500`: Failed to fetch feeding stats

**Cách hoạt động:**
1. Server aggregate bảng `FeedLog` theo ngày (`startTime`) cho user hiện tại.
2. Tự động thêm các ngày không có dữ liệu với `totalAmount = 0`.
3. Frontend chỉ cần đọc `totalAmount` và `feedCount` để vẽ biểu đồ 7 ngày.

---

## 3. Schedule Endpoints

Tất cả schedule endpoints yêu cầu authentication header:
```
Authorization: Bearer <jwt_token>
```

### 3.1. Lấy danh sách lịch (Get Schedules)

**Endpoint:** `GET /api/schedules`

**Response (200):**
```json
{
  "schedules": [
    {
      "_id": "schedule_id",
      "user": "user_id",
      "name": "Feeding schedule",
      "time": "08:00",
      "daysOfWeek": [1, 3, 5],
      "amount": 150,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**daysOfWeek:** Mảng số từ 0-6
- 0 = Chủ nhật (Sunday)
- 1 = Thứ 2 (Monday)
- 2 = Thứ 3 (Tuesday)
- 3 = Thứ 4 (Wednesday)
- 4 = Thứ 5 (Thursday)
- 5 = Thứ 6 (Friday)
- 6 = Thứ 7 (Saturday)

---

### 3.2. Tạo lịch mới (Create Schedule)

**Endpoint:** `POST /api/schedules`

**Request Body:**
```json
{
  "time": "08:00",
  "daysOfWeek": [1, 3, 5],
  "amount": 150,
  "name": "Bữa sáng" // optional, default: "Feeding schedule"
}
```

**Validation:**
- `time`: Format HH:MM (24h), ví dụ: "08:00", "20:30"
- `daysOfWeek`: Array of numbers (0-6), ít nhất 1 phần tử
- `amount`: Integer từ 5 đến 1000 gram
- `name`: String (optional), max 50 characters

**Response (201):**
```json
{
  "schedule": {
    "_id": "schedule_id",
    "user": "user_id",
    "name": "Bữa sáng",
    "time": "08:00",
    "daysOfWeek": [1, 3, 5],
    "amount": 150,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.3. Cập nhật lịch (Update Schedule)

**Endpoint:** `PUT /api/schedules/:id`

**Request Body:** (tương tự Create Schedule)

**Response (200):**
```json
{
  "schedule": {
    // Updated schedule object
  }
}
```

**Error Responses:**
- `404`: Schedule not found
- `400`: Validation errors

---

### 3.4. Xóa lịch (Delete Schedule)

**Endpoint:** `DELETE /api/schedules/:id`

**Response (204):** No content

**Error Responses:**
- `404`: Schedule not found

---

### 3.5. Bật/Tắt lịch (Toggle Schedule)

**Endpoint:** `PATCH /api/schedules/:id/toggle`

**Request Body:**
```json
{
  "isActive": true // optional, nếu không gửi sẽ toggle
}
```

**Response (200):**
```json
{
  "schedule": {
    // Schedule với isActive đã được cập nhật
  }
}
```

---

## 4. Scheduled Feed - Tự động cho ăn theo lịch

**Cách hoạt động:**

1. **Scheduler Service** chạy mỗi phút (cron job: `* * * * *`)
2. Kiểm tra tất cả schedules có `isActive = true`
3. Với mỗi schedule:
   - Kiểm tra hôm nay có trong `daysOfWeek` không
   - Kiểm tra thời gian hiện tại có khớp với `time` không (trong vòng 1 phút)
   - Kiểm tra đã thực thi hôm nay chưa (tránh duplicate)
4. Nếu tất cả điều kiện đúng:
   - Gọi `triggerScheduledFeed()` với `userId`, `amount`, `scheduleId`
   - Gửi MQTT command đến thiết bị
   - Tạo FeedLog với:
     - `feedType = "scheduled"`
     - `schedule = scheduleId`
     - `amount = schedule.amount`
5. Log kết quả

**Ví dụ:**
- Schedule: `time: "08:00"`, `daysOfWeek: [1, 3, 5]` (Thứ 2, 4, 6)
- Nếu hôm nay là Thứ 2 và đã 8:00 → Tự động cho ăn
- Nếu hôm nay là Thứ 3 → Không cho ăn (không có trong daysOfWeek)

**Lưu ý:**
- Mỗi schedule chỉ được thực thi 1 lần mỗi ngày
- Scheduler check mỗi phút, nên có thể có độ trễ tối đa 1 phút
- Nếu MQTT fail, FeedLog vẫn được tạo với `status = "failed"`

---

## 5. Database Models

### User
```javascript
{
  userId: ObjectId,
  username: String,
  password: String (hashed),
  lastOnline: Date
}
```

### Schedule
```javascript
{
  user: ObjectId (ref: User),
  name: String (default: "Feeding schedule"),
  time: String (HH:MM format),
  daysOfWeek: [Number] (0-6),
  amount: Number (min: 5),
  isActive: Boolean (default: true)
}
```

### FeedLog
```javascript
{
  user: ObjectId (ref: User),
  feedType: "manual" | "scheduled" | "voice",
  amount: Number,
  targetAmount: Number,
  status: "success" | "failed",
  startTime: Date,
  endTime: Date,
  schedule: ObjectId (ref: Schedule, optional),
  voiceCommand: String (optional)
}
```

---

## 6. MQTT Integration

**Topic:** `petfeeder/feed` (configurable via `MQTT_FEED_TOPIC`)

**Message Format:**
```json
{
  "mode": "manual" | "scheduled" | "voice",
  "amount": 200,
  "userId": "user_id",
  "issuedAt": 1234567890,
  "scheduleId": "schedule_id", // only for scheduled
  "voiceCommand": "cho ăn 200 gram" // only for voice
}
```

**QoS:** 1 (at least once delivery)

---

## 7. Error Handling

Tất cả endpoints trả về error theo format:
```json
{
  "message": "Error message",
  "error": "Detailed error message" // optional
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `404`: Not Found
- `409`: Conflict (duplicate)
- `500`: Internal Server Error
- `502`: Bad Gateway (MQTT error)

---

## 8. Testing Examples

### Test Manual Feed
```bash
curl -X POST http://localhost:5000/api/feed/manual \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test Voice Feed
```bash
curl -X POST http://localhost:5000/api/feed/voice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "cho ăn 200 gram"}'
```

### Test Create Schedule
```bash
curl -X POST http://localhost:5000/api/schedules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "time": "08:00",
    "daysOfWeek": [1, 3, 5],
    "amount": 150,
    "name": "Bữa sáng"
  }'
```

---

## 9. Notes

- Tất cả timestamps sử dụng ISO 8601 format
- JWT token có thời hạn 7 ngày
- Mỗi user chỉ có 1 pet và 1 thiết bị (giả định)
- Scheduler chạy tự động khi server start
- MQTT connection được khởi tạo khi server start

