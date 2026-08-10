# Hệ thống Chấm công PWA - Admin Dashboard Frontend

Chào mừng bạn đến với phân hệ **Quản lý (Admin Dashboard)** thuộc giải pháp Chấm công bảo mật thông qua WebAuthn & Face Recognition.

Dự án này được xây dựng bằng **ReactJS 19**, **Vite 5**, **Tailwind CSS v4**, **Axios**, và **React Router DOM v6**.

---

## 1. Công nghệ sử dụng (Tech Stack)

- **Core**: React 19, JavaScript (ES6+).
- **Styling**: Tailwind CSS v4, PostCSS, Google Fonts (Outfit, Inter).
- **Forms & Validation**: React Hook Form, Zod Validators.
- **HTTP Client**: Axios với cơ chế hàng đợi tự động làm mới token (Automatic Token Refresh Queue) và Dynamic Device Fingerprint header.
- **Routing**: React Router DOM (với Route Guards và Role Guards).
- **Build System**: Vite 5.

---

## 2. Cấu trúc thư mục (Directory Structure)

```text
CHAMCONG_UI/
├── dist/                     # Thư mục build production
├── src/
│   ├── assets/               # Ảnh và icons tĩnh
│   ├── components/           # Component dùng chung (Button, Table, Modal...)
│   ├── constants/            # Các hằng số quyền hạn và endpoint (ROLE_CONSTANTS...)
│   ├── contexts/             # State chia sẻ toàn cục (Auth, Theme, App status)
│   ├── enums/                # Enums ánh xạ trạng thái database
│   ├── hooks/                # Custom React Hooks (useAuth, usePagination, useSearch...)
│   ├── layouts/              # Giao diện khung (DashboardLayout...)
│   ├── pages/                # Các trang chức năng của dashboard
│   ├── routes/               # Quản lý định tuyến và chốt chặn phân quyền
│   ├── services/             # Lớp kết nối HTTP API Client (Axios)
│   ├── validators/           # Zod Validation schemas tách biệt
│   ├── App.jsx               # Quản lý routing chính
│   ├── index.css             # Định nghĩa CSS hệ thống & Theme màu
│   └── main.jsx              # Điểm khởi chạy React App
├── index.html                # HTML entry point
├── package.json              # Quản lý dependencies & scripts
├── postcss.config.js         # Cấu hình PostCSS & Tailwind v4
└── vite.config.js            # Cấu hình đóng gói Vite
```

---

## 3. Biến môi trường (Environment Variables)

Dự án sử dụng file cấu hình biến môi trường của Vite: `.env` ở thư mục gốc.

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Hướng dẫn Cài đặt & Chạy dự án (Installation & Running)

### Bước 1: Khởi động cài đặt thư viện
```bash
npm install
```

### Bước 2: Chạy dự án ở chế độ phát triển (Development Mode)
```bash
npm run dev
```

### Bước 3: Đóng gói sản phẩm (Production Build)
```bash
npm run build
```

---

## 5. Danh sách các phân hệ (Dashboard Modules)

1. **Tổng quan (Dashboard)**: Thống kê tổng số lượng nhân sự, phòng ban, địa điểm và các cảnh báo thiếu API.
2. **Quản lý Phòng ban (Departments CRUD)**: Tạo mới, cập nhật, thay đổi trạng thái, in và xuất CSV.
3. **Quản lý Nhân sự (Employees CRUD)**: Quản lý nhân viên kèm tùy chọn tạo tài khoản, xóa/thu hồi khóa WebAuthn.
4. **Địa điểm chấm công (Work Locations CRUD)**: Quản lý vị trí GPS và bản đồ radar geofence kiểm soát bán kính cho phép.
5. **Phân công làm việc (Assignments CRUD)**: Giao dự án cho nhân viên theo ngày làm việc.
6. **Lịch sử chấm công (Attendance logs)**: Xem chi tiết check-in/out, GPS Accuracy, ảnh chụp Cloudinary, Face Verification similarity.
7. **Kiểm duyệt (Review Queue)**: Duyệt các yêu cầu chấm công lỗi phạm vi geofence.
8. **Hồ sơ khuôn mặt (Face Profiles)**: Quản lý vector đặc trưng nhận diện.
9. **Khóa WebAuthn**: Quản lý khóa bảo mật sinh trắc học và mã PIN FIDO2.
10. **Thiết bị đăng ký**: Vô hiệu hóa hoặc thu hồi quyền truy cập của thiết bị.
11. **Trung tâm bảo mật (Security Center)**: Giám sát phiên hoạt động, lịch sử đăng nhập lỗi, force logout.
12. **Nhật ký hệ thống (Audit Logs)**: Kiểm toán lịch sử thao tác API.
13. **Cấu hình tham số (System Settings)**: Điều chỉnh thời gian timeout, ngưỡng sai lệch GPS cho quản trị viên.

---

## 6. Luồng hoạt động (System Flows)

### A. Luồng Đăng nhập & Xác thực phiên
1. Người dùng nhập tài khoản/mật khẩu -> Nhận diện thiết bị (Client Device Name) -> API trả về Access Token & Refresh Token.
2. Ứng dụng tự động kiểm tra phiên hoạt động sau mỗi 5 giây (`/auth/me`).
3. Khi Access Token hết hạn, Axios Interceptor tự động đưa các request lỗi vào hàng đợi, gọi `/auth/refresh-token` để cấp Access Token mới, và tự động gọi lại các request lỗi.

### B. Luồng Hiển thị Báo cáo & Lọc dữ liệu
- Người dùng chọn bộ lọc thời gian/nhân viên -> Hệ thống gọi API kết hợp phân trang tự động.
- In danh sách hoặc Xuất CSV hoàn toàn xử lý cục bộ trên Client Browser.
- Dữ liệu hình ảnh khuôn mặt của Cloudinary chỉ được tải về khi xem chi tiết (AttendanceDetailModal) để tối ưu băng thông.
