# 💻 TRANG QUẢN TRỊ ADMIN (ADMIN DASHBOARD PORTAL)
> **Phân hệ Quản trị Web Dashboard** dành cho Ban Giám đốc, Nhân sự (HR) và Quản lý để giám sát, phân công và kiểm duyệt chấm công toàn công ty.

---

## 📌 1. Tổng Quan Về Trang Quản Trị

Trang Quản trị là giao diện Web dành cho Admin và Manager nhằm theo dõi tình hình làm việc của toàn bộ nhân viên kỹ thuật hiện trường theo thời gian thực. 

Ứng dụng giúp tự động hóa quá trình quản lý nhân sự, loại bỏ báo cáo thủ công bằng giấy, và đưa ra quyết định duyệt công chính xác dựa trên dữ liệu vị trí GPS & nhận diện khuôn mặt AI.

### 🌟 Các Phân Hệ Quản Lý Chính:
1. **📊 Bảng Điều Khiển Tổng Quan (Dashboard)**: Thống kê tổng nhân sự, tỷ lệ chuyên cần, số lượt check-in hôm nay, biểu đồ công tích lũy và cảnh báo hệ thống.
2. **⚠️ Hàng Đợi Kiểm Duyệt (Review Queue)**: Phê duyệt hoặc Từ chối các lượt chấm công nghi vấn (vượt bán kính >100m, mất tín hiệu GPS, hoặc hình ảnh không khớp).
3. **👥 Quản Lý Nhân Sự (Employees) & Tài Khoản (Accounts)**: Tạo hồ sơ nhân viên, cấp tài khoản, đổi vai trò (Role), đặt lại mật khẩu và khóa/mở tài khoản.
4. **🏢 Quản Lý Phòng Ban (Departments)**: Thêm mới, cập nhật và quản lý cơ cấu phòng ban trong công ty.
5. **📍 Quản Lý Địa Điểm Chấm Công (Work Locations)**: Thiết lập tọa độ GPS (Vĩ độ, Kinh độ) và cài đặt bán kính Geofence cho phép (ví dụ: 100m).
6. **📅 Quản Lý Phân Công (Assignments)**: Giao địa điểm và ca làm việc cho nhân viên theo từng ngày.
7. **📑 Quản Lý Đơn Nghỉ Phép & Tăng Ca (OT)**: Tiếp nhận và xử lý đơn xin nghỉ phép năm, đơn đăng ký làm thêm giờ của nhân viên.
8. **📊 Lịch Sử Chấm Công & Báo Cáo (Reports)**: Tra cứu lịch sử check-in/out kèm ảnh chụp thực tế, tọa độ GPS, độ lệch Geofence và xuất báo cáo công tháng.
9. **🛡️ Trung Tâm Bảo Mật & Nhật Ký (Security Center & Audit Logs)**: Giám sát các phiên đăng nhập đang hoạt động, khóa thiết bị lạ, và kiểm toán mọi thao tác trên hệ thống.

---

## 🛠️ 2. Công Nghệ Sử Dụng

- **Core Library:** ReactJS (React 19)
- **Build Tool:** Vite 5 (Build siêu nhanh, tối ưu hóa dung lượng bundle)
- **Styling:** Tailwind CSS, Google Fonts (Outfit, Inter)
- **HTTP Client:** Axios Interceptor (Tự động gửi Token, tự động Refresh Token và đính kèm `X-Device-Fingerprint`)
- **Form & Validation:** React Hook Form, Zod Schema Validator
- **Icon Set:** React Icons (Feather Icons & Remix Icons)
- **Date Utilities:** Day.js

---

## 📂 3. Cấu Trúc Thư Mục (`/CHAMCONG_UI/src`)

```text
CHAMCONG_UI/src/
├── assets/           # Hình ảnh, biểu tượng (Logo, icons)
├── components/       # Component dùng chung (Button, Table, Modal, StatusBadge, Card...)
├── constants/        # Hằng số hệ thống, danh sách Role, API Endpoints
├── contexts/         # React Context chia sẻ trạng thái toàn cục (Auth, App State)
├── hooks/            # Custom Hooks (useAuth, usePagination, useSearch, useApp...)
├── layouts/          # Khung giao diện chính (DashboardLayout có Sidebar & Topbar)
├── pages/            # Giao diện các trang chức năng:
│   ├── Dashboard.jsx            # Trang tổng quan thống kê
│   ├── ReviewQueue.jsx          # Trang hàng đợi kiểm duyệt Admin
│   ├── Attendance.jsx           # Trang lịch sử chấm công toàn hệ thống
│   ├── Employees.jsx            # Trang quản lý nhân sự
│   ├── Departments.jsx          # Trang quản lý phòng ban
│   ├── WorkLocations.jsx        # Trang quản lý địa điểm GPS
│   ├── Assignments.jsx          # Trang phân công công việc
│   ├── LeaveRequests.jsx        # Trang duyệt đơn nghỉ phép
│   ├── OvertimeRequests.jsx     # Trang duyệt đơn tăng ca
│   ├── Reports.jsx              # Trang báo cáo & thống kê công
│   └── SecurityCenter.jsx       # Trang bảo mật & giám sát phiên
├── services/         # Tầng kết nối gọi RESTful API tới Backend
├── App.jsx           # Quản lý cấu hình Định tuyến (Routing) & Bảo vệ Route Guard
└── main.jsx          # File điểm khởi chạy React
```

---

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Cài đặt các thư viện cần thiết
```bash
cd CHAMCONG_UI
npm install
```

### 2. Cấu hình biến môi trường (`.env`)
Tạo file `.env` tại thư mục gốc `CHAMCONG_UI`:
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Chạy ứng dụng ở chế độ Phát Triển (Development)
```bash
npm run dev
```
Trang quản trị sẽ chạy tại địa chỉ: `http://localhost:5173` (hoặc port do Vite cấp).

### 4. Đóng gói sản phẩm (Production Build)
```bash
npm run build
```
File tĩnh sau khi build sẽ nằm trong thư mục `CHAMCONG_UI/dist/`.

---

## 🔑 5. Tài Khoản Đăng Nhập Mặc Định

- **Tài khoản**: `admin`
- **Mật khẩu**: `Admin@123`

---

## 🛡️ License & Copyright
Dự án được bảo hộ quyền sở hữu trí tuệ cho phân hệ quản trị nhân sự hiện trường.
