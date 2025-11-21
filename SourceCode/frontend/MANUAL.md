# Smart Pet Feeder Frontend Manual

## 1. Chuẩn bị môi trường
- Node.js >= 18
- npm >= 9
- Các giá trị môi trường (đã cấu hình sẵn fallback):
  - `VITE_API_BASE_URL` – URL backend REST (mặc định `http://localhost:5000`)
  - `VITE_MQTT_URL` – URL WebSocket MQTT (mặc định `wss://e4b01f831a674150bbae2854b6f1735c.s1.eu.hivemq.cloud:8884/mqtt`)
  - `VITE_DEVICE_ID` – ID thiết bị feeder (mặc định `petfeeder-feed-node-01`)
  - `VITE_MQTT_USERNAME` / `VITE_MQTT_PASSWORD` – tài khoản HiveMQ Cloud (mặc định `quandotrung` / `Pass1235`)

## 2. Cài đặt
```bash
cd frontend
npm install
```

## 3. Chạy môi trường phát triển
```bash
npm run dev
```
Mở trình duyệt tới URL được hiển thị (mặc định `http://localhost:5173`).

## 4. Build production
```bash
npm run build
npm run preview   # kiểm tra gói build
```
Kết quả build nằm tại thư mục `frontend/dist`.

## 5. Cấu trúc chính
- `src/pages` – các trang Dashboard, Manual Feed, Schedule
- `src/components` – Sidebar, TopBar, StatCard, v.v.
- `src/services/api.js` – cấu hình REST + Axios
- `src/services/mqtt.js` – quản lý kết nối MQTT
- `src/styles.css` – phong cách giao diện xanh trắng kiểu Blynk

## 6. Luồng hoạt động
1. Hệ thống sử dụng 1 tài khoản mặc định trên backend, không cần đăng nhập/token.
2. MQTT:
   - Subscribe `feeder/{deviceId}/telemetry`, `.../ack`, `.../alert`
   - Gửi lệnh thủ công qua topic `feeder/{deviceId}/command` với payload `{ "action": "feed_now" }`
3. REST API:
   - `/api/schedules` CRUD lịch
   - `/api/feed-logs` lấy lịch sử cho ăn
4. Voice Feed:
   - Sử dụng Web Speech API nhận lệnh “feed now”, sau đó publish MQTT.

## 7. Tùy chỉnh nhanh
- Màu sắc: chỉnh trong `src/styles.css` (biến CSS ở đầu file).
- Sidebar/route mới: thêm trong `src/components/Sidebar.jsx` và `src/App.jsx`.
- Nếu muốn tích hợp module nhận giọng nói riêng (VD `speech-module`), cập nhật logic trong `src/pages/ManualFeed.jsx`.

## 8. Kiểm thử
- Sau khi build, chạy `npm run preview`.
- Dùng MQTT client ngoài để kiểm tra topic nếu cần.

## 9. Triển khai
Upload nội dung `dist/` lên hosting tĩnh (Vercel, Netlify, S3, …). Đảm bảo môi trường backend và broker MQTT truy cập được từ domain triển khai.


