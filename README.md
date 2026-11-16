# SELF RESTAURANT – HỆ THỐNG QUẢN LÝ NHÀ HÀNG CHUYÊN NGHIỆP

Hệ thống quản lý nhà hàng toàn diện được xây dựng bằng kiến trúc Full-Stack hiện đại, giao diện tiếng Việt sang trọng, nghiệp vụ khép kín từ gọi món tại bàn, điều phối bếp, thu ngân thanh toán đến quản trị phân quyền và báo cáo doanh thu.

Dự án đáp ứng đầy đủ tiêu chí đồ án tốt nghiệp ngành Kỹ thuật Phần mềm (Software Engineering).

---

## 1. Công Nghệ Sử Dụng

### Frontend
- **React 18** & **TypeScript**
- **Vite** (Bundler tốc độ cao)
- **Tailwind CSS** (Design System sang trọng: tông nền trắng ngà, xanh olive, cam đồng trầm)
- **React Router v6** (Điều hướng SPA & phân quyền URL)
- **Lucide React** (Hệ thống biểu tượng trực quan)
- **Recharts** (Biểu đồ trực quan hóa doanh thu 7 ngày)

### Backend
- **Node.js** & **Express.js** (TypeScript)
- **RESTful API** chuẩn hóa
- **Prisma ORM** (Schema, Migrations & Seeding)
- **Zod** (Validation dữ liệu đầu vào nghiêm ngặt)
- **JWT (JSON Web Token)** & **Bcryptjs** (Mã hóa mật khẩu 10 rounds, RBAC chặt chẽ)
- **Morgan** & **Centralized Error Handling**

### Cơ Sở Dữ Liệu
- **SQLite** (Môi trường Local Dev chạy ngay lập tức, không cần cài server phụ)
- **MySQL** (Hỗ trợ sẵn schema `server/prisma/schema.mysql.prisma` cho môi trường chấm đồ án/production)

---

## 2. Tài Khoản Thử Nghiệm Mặc Định (Seed Data)

Hệ thống đã chuẩn bị sẵn tài khoản cho 4 vai trò chính với mật khẩu chung: `Password123@`

| Vai trò | Email đăng nhập | Mật khẩu | Phạm vi quyền hạn |
| :--- | :--- | :--- | :--- |
| **QUẢN LÝ (MANAGER)** | `manager@selfrestaurant.vn` | `Password123@` | **Toàn quyền hệ thống**: Quản lý nhân viên, thực đơn, sơ đồ bàn, đơn hàng, hóa đơn, báo cáo doanh thu, nhật ký kiểm toán. |
| **BẾP (CHEF)** | `chef@selfrestaurant.vn` | `Password123@` | **Màn hình Bếp (KDS)**: Nhận đơn theo thời gian thực, cập nhật tiến độ chế biến, báo hoàn thành món. |
| **THU NGÂN (CASHIER)** | `cashier@selfrestaurant.vn` | `Password123@` | **Quầy Thu Ngân (POS)**: Sơ đồ bàn, tiếp nhận yêu cầu thanh toán, tính tiền thừa, in hóa đơn và giải phóng bàn. |
| **KHÁCH HÀNG (CUSTOMER)** | `customer@selfrestaurant.vn` | `Password123@` | **Đặt món**: Xem thực đơn, chọn bàn/quét QR, đặt món, theo dõi tiến độ thời gian thực, gửi yêu cầu thanh toán. |

> **Mẹo nhanh:** Trên thanh điều hướng đầu trang có sẵn thanh **"Môi trường Đồ án / Thử nghiệm"**, cho phép bạn nhấp chuột 1 chạm để đăng nhập tức thì giữa các vai trò mà không cần gõ lại email và mật khẩu!

---

## 3. Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu cầu tiên quyết
- **Node.js** (Phiên bản 18+ hoặc 20+)
- **npm** (Đi kèm Node.js)

### Bước 1: Khởi tạo Cơ sở dữ liệu Backend
Mở một cửa sổ Terminal tại thư mục `server`:
```bash
cd server
npm install
npx prisma db push
npx tsx prisma/seed.ts
```
Lệnh seed sẽ tự động tạo người dùng mẫu, danh mục, 15 món ăn hảo hạng, 10 bàn ăn thuộc 3 khu vực và các hóa đơn mẫu ban đầu.

### Bước 2: Chạy Backend Server
Tại thư mục `server`:
```bash
npm run dev
```
Backend API sẽ hoạt động tại: `http://localhost:5000` (API Base: `http://localhost:5000/api`)

### Bước 3: Chạy Frontend Client
Mở một cửa sổ Terminal thứ hai tại thư mục `client`:
```bash
cd client
npm install
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`

---

## 4. Chạy Kiểm Thử Tự Động (Automated Test Suite)

Dự án tích hợp bộ kiểm thử tự động toàn diện bao quát xác thực, phân quyền RBAC và luồng nghiệp vụ khép kín:
```bash
cd server
npm test
```
Bộ kiểm thử sẽ tự động thực hiện:
- Kiểm tra mã lỗi 401 khi nhập sai mật khẩu.
- Kiểm tra phân quyền RBAC: Khách không được vào trang quản trị (403), Bếp không được xác nhận thanh toán (403), Thu ngân không được tạo nhân viên (403).
- **Kiểm tra luồng nghiệp vụ khép kín:** Khách đặt món bàn A03 -> Bàn chuyển sang `OCCUPIED` -> Bếp nhận đơn và nấu -> Khách bấm Yêu cầu thanh toán -> Bàn chuyển sang `PAYMENT_REQUESTED` -> Thu ngân mở đúng bàn, xem đầy đủ món, tính tiền thừa và xác nhận -> Hóa đơn `INV-` được tạo -> Bàn tự động giải phóng về `AVAILABLE` -> Doanh thu cập nhật vào Báo cáo quản lý.
- **Cam kết không xảy ra lỗi "Bàn có món nhưng thu ngân báo chưa có món".**

---

## 5. Cấu Trúc Thư Mục Dự Án

```
SELF-RESTAURANT-WEB/
├── client/                     # Ứng dụng React + TypeScript + Vite
│   ├── src/
│   │   ├── api/                # API client kết nối backend
│   │   ├── components/         # Các thành phần giao diện dùng chung
│   │   ├── context/            # Quản lý Auth & Giỏ hàng
│   │   ├── pages/
│   │   │   ├── auth/           # Đăng nhập & Đăng ký
│   │   │   ├── public/         # Trang chủ & Thực đơn công khai
│   │   │   ├── customer/       # Đặt món tại bàn & Theo dõi tiến độ
│   │   │   ├── chef/           # Màn hình điều phối bếp (KDS)
│   │   │   ├── cashier/        # Sơ đồ bàn & Quầy thu ngân (POS)
│   │   │   └── manager/        # Cổng quản trị toàn diện của Quản lý
│   │   └── types/              # Định nghĩa kiểu dữ liệu TypeScript
│   └── package.json
├── server/                     # Backend API Express.js + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma       # Mô hình CSDL chuẩn (SQLite dev)
│   │   ├── schema.mysql.prisma # Mô hình CSDL cho MySQL
│   │   └── seed.ts             # Dữ liệu mẫu ban đầu
│   ├── src/
│   │   ├── controllers/        # Xử lý logic nghiệp vụ
│   │   ├── middleware/         # Xác thực JWT & Phân quyền RBAC
│   │   ├── routes/             # Định tuyến RESTful API
│   │   ├── tests/              # Kịch bản kiểm thử tự động toàn diện
│   │   ├── app.ts              # Cấu hình Express app
│   │   └── index.ts            # Điểm khởi chạy server
│   ├── .env.example            # Biến môi trường mẫu
│   └── package.json
└── docs/                       # Tài liệu kỹ thuật chuyên sâu
    ├── ERD.md                  # Sơ đồ thực thể quan hệ cơ sở dữ liệu
    ├── API_DOCS.md             # Đặc tả chi tiết các RESTful API
    └── ARCHITECTURE.md         # Kiến trúc hệ thống & Ma trận phân quyền
```

---

## 6. Tài Liệu Kỹ Thuật Bổ Sung

- [Sơ đồ Thực Thể Quan Hệ (ERD)](docs/ERD.md)
- [Đặc Tả Chi Tiết RESTful API](docs/API_DOCS.md)
- [Kiến Trúc & Hướng Dẫn Chuyển Sang MySQL](docs/ARCHITECTURE.md)
