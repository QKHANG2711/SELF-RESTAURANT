# KIẾN TRÚC HỆ THỐNG VÀ HƯỚNG DẪN CƠ SỞ DỮ LIỆU - SELF RESTAURANT

## 1. Kiến Trúc Tổng Thể

Hệ thống được xây dựng theo mô hình Client-Server hiện đại, đáp ứng tiêu chuẩn đồ án tốt nghiệp ngành Kỹ thuật Phần mềm:

```
[ Trình Duyệt / Khách Hàng / Nhân Viên ]
                  │
          (HTTPS / RESTful API)
                  │
                  ▼
        [ Express.js Backend ]
  ┌─────────────────────────────────┐
  │ - Authentication Middleware     │
  │ - RBAC Authorization Guard      │
  │ - Zod Request Validation        │
  │ - Business Logic Controllers    │
  │ - Audit Logging Interceptor     │
  └─────────────────────────────────┘
                  │
            (Prisma ORM)
                  │
                  ▼
       [ Cơ Sở Dữ Liệu Quan Hệ ]
  - Development: SQLite (dev.db, không cần cài MySQL server)
  - Production / Báo cáo: MySQL (schema.mysql.prisma)
```

---

## 2. Ma Trận Phân Quyền (RBAC Matrix)

| Chức Năng / Nghiệp Vụ | CUSTOMER | CHEF | CASHIER | MANAGER |
| :--- | :---: | :---: | :---: | :---: |
| Xem thực đơn, tìm kiếm món ăn | ✅ | ✅ | ✅ | ✅ |
| Chọn bàn, đặt món tại bàn | ✅ | ❌ | ❌ | ✅ |
| Theo dõi tiến độ đơn hàng | ✅ (chỉ đơn mình) | ✅ | ✅ | ✅ |
| Gửi yêu cầu thanh toán | ✅ | ❌ | ✅ | ✅ |
| Tiếp nhận đơn, cập nhật trạng thái nấu | ❌ | ✅ | ❌ | ✅ |
| Xem sơ đồ bàn, mở bàn tính tiền | ❌ | ❌ | ✅ | ✅ |
| Xác nhận thanh toán, xuất hóa đơn | ❌ | ❌ | ✅ | ✅ |
| Giải phóng bàn ăn | ❌ | ❌ | ✅ | ✅ |
| Quản lý món ăn, danh mục, giá bán | ❌ | ❌ | ❌ | ✅ |
| Quản lý tài khoản và phân quyền nhân viên | ❌ | ❌ | ❌ | ✅ |
| Xem báo cáo doanh thu, xuất file CSV | ❌ | ❌ | ❌ | ✅ |
| Xem nhật ký kiểm toán (Audit Logs) | ❌ | ❌ | ❌ | ✅ |

---

## 3. Hướng Dẫn Chuyển Sang Cơ Sở Dữ Liệu MySQL

Dự án hiện đang sử dụng SQLite thông qua Prisma Client để bảo đảm chạy ngay lập tức 100% trong môi trường máy phát triển mà không phụ thuộc vào dịch vụ MySQL ngoại vi.

Khi triển khai trên máy chủ thực tế hoặc bảo vệ đồ án tốt nghiệp với MySQL:

### Bước 1: Chuẩn bị cơ sở dữ liệu MySQL
1. Khởi động MySQL Server (XAMPP, MySQL Installer, hoặc Docker).
2. Tạo database:
   ```sql
   CREATE DATABASE self_restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### Bước 2: Cập nhật cấu hình môi trường
Trong file `server/.env`:
```env
DATABASE_URL="mysql://root:matkhau@localhost:3306/self_restaurant"
```

### Bước 3: Đổi Provider trong Prisma Schema
Trong file `server/prisma/schema.prisma`, thay đổi:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```
*(Hoặc sao chép nội dung từ file mẫu `server/prisma/schema.mysql.prisma`)*.

### Bước 4: Chạy Migration và Seed dữ liệu mẫu
```bash
cd server
npx prisma db push
npx tsx prisma/seed.ts
```
Toàn bộ bảng, chỉ mục và dữ liệu mẫu sẽ được khởi tạo tự động trong MySQL!
