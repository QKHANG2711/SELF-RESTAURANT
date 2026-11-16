# TÀI LIỆU RESTFUL API - SELF RESTAURANT

Toàn bộ các API đều trả về định dạng JSON thống nhất:
- Thành công: `{ "success": true, "data": ..., "message": "..." }`
- Thất bại: `{ "success": false, "error": "...", "details": null }`

---

## 1. Xác Thực & Phân Quyền (`/api/auth`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Công khai | Đăng ký tài khoản khách hàng (vai trò CUSTOMER) |
| `POST` | `/api/auth/login` | Công khai | Đăng nhập hệ thống (trả về JWT Token) |
| `GET` | `/api/auth/me` | Bearer Token | Lấy thông tin tài khoản đang đăng nhập |
| `PUT` | `/api/auth/profile` | Bearer Token | Cập nhật thông tin cá nhân |
| `PUT` | `/api/auth/change-password` | Bearer Token | Đổi mật khẩu tài khoản |

---

## 2. Thực Đơn & Danh Mục (`/api/menu`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/menu/categories` | Công khai | Danh sách danh mục món ăn |
| `POST` | `/api/menu/categories` | MANAGER | Thêm danh mục mới |
| `PUT` | `/api/menu/categories/:id` | MANAGER | Sửa danh mục |
| `DELETE` | `/api/menu/categories/:id` | MANAGER | Xóa danh mục (kiểm tra món ràng buộc) |
| `GET` | `/api/menu/items` | Công khai | Lọc món theo danh mục, từ khóa, khoảng giá |
| `GET` | `/api/menu/items/:id` | Công khai | Chi tiết món ăn |
| `POST` | `/api/menu/items` | MANAGER | Thêm món ăn mới |
| `PUT` | `/api/menu/items/:id` | MANAGER | Cập nhật thông tin/giá/trạng thái món |
| `DELETE` | `/api/menu/items/:id` | MANAGER | Xóa/ngưng bán món ăn an toàn |

---

## 3. Bàn Ăn & Khu Vực (`/api/tables`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tables/areas` | Công khai | Danh sách khu vực (Sảnh, Sân vườn, VIP) |
| `POST` | `/api/tables/areas` | MANAGER | Tạo khu vực mới |
| `GET` | `/api/tables` | Công khai | Danh sách bàn ăn kèm đơn đang hoạt động |
| `GET` | `/api/tables/qr/:token` | Công khai | Quét mã QR tra cứu bàn |
| `POST` | `/api/tables` | MANAGER | Tạo bàn ăn mới kèm sinh token QR |
| `PUT` | `/api/tables/:id` | MANAGER | Cập nhật thông tin bàn |
| `POST` | `/api/tables/:id/reset` | CASHIER, MANAGER | Giải phóng bàn về trạng thái Trống |

---

## 4. Quản Lý Đơn Hàng (`/api/orders`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Công khai / Khách | Tạo đơn gọi món mới (Tính tiền từ DB, đổi trạng thái bàn thành OCCUPIED) |
| `GET` | `/api/orders/table/:tableId/active` | Công khai | Lấy đơn đang hoạt động của bàn kèm chi tiết món |
| `GET` | `/api/orders` | Đăng nhập | Xem danh sách đơn (Khách chỉ xem đơn của mình; Bếp/Thu ngân/Quản lý xem tất cả) |
| `GET` | `/api/orders/:id` | Đăng nhập | Chi tiết đơn hàng và hóa đơn |
| `POST` | `/api/orders/:id/request-payment` | Khách / Thu ngân | Yêu cầu tính tiền (Đổi trạng thái bàn & đơn thành PAYMENT_REQUESTED) |
| `PUT` | `/api/orders/:id/status` | CHEF, CASHIER, MANAGER | Chuyển trạng thái đơn (COOKING, READY, SERVED, CANCELLED) |
| `PUT` | `/api/orders/items/:itemId/status` | CHEF, MANAGER | Cập nhật tiến độ từng món ăn cho Bếp |

---

## 5. Thanh Toán & Hóa Đơn (`/api/payments`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/checkout` | CASHIER, MANAGER | Xác nhận thanh toán tiền mặt/chuyển khoản, tạo hóa đơn duy nhất, tính tiền thừa, tự động giải phóng bàn |
| `GET` | `/api/payments/invoices` | CASHIER, MANAGER | Danh sách lịch sử hóa đơn |
| `GET` | `/api/payments/invoices/:id` | CASHIER, MANAGER | Chi tiết hóa đơn phục vụ in ấn |

---

## 6. Quản Trị Hệ Thống (`/api/manager`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/manager/dashboard` | MANAGER | Số liệu KPI doanh thu, đơn hàng, bàn ăn và biểu đồ thời gian thực |
| `GET` | `/api/manager/revenue-report` | MANAGER | Báo cáo doanh thu chi tiết theo khoảng ngày, phương thức thanh toán |
| `GET` | `/api/manager/staff` | MANAGER | Danh sách nhân viên nhà hàng |
| `POST` | `/api/manager/staff` | MANAGER | Tạo tài khoản nhân viên (CHEF, CASHIER, MANAGER) |
| `PUT` | `/api/manager/staff/:id` | MANAGER | Đổi vai trò, khóa/mở khóa tài khoản, đặt lại mật khẩu |
| `GET` | `/api/manager/audit-logs` | MANAGER | Tra cứu nhật ký kiểm toán hệ thống |
| `GET` | `/api/manager/configs` | MANAGER | Đọc cấu hình nhà hàng |
| `PUT` | `/api/manager/configs` | MANAGER | Lưu cài đặt thông tin nhà hàng |
