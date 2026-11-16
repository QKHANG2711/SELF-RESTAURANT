# SƠ ĐỒ THỰC THỂ QUAN HỆ (ERD) - SELF RESTAURANT

Hệ thống cơ sở dữ liệu của **SELF RESTAURANT** được thiết kế chuẩn hóa, quan hệ chặt chẽ giữa khách hàng, bàn ăn, thực đơn, đơn hàng, hóa đơn thanh toán và nhật ký kiểm toán.

## 1. Sơ Đồ Mermaid ERD

```mermaid
erDiagram
    users ||--o{ orders : "creates/owns"
    users ||--o{ payments : "handles (as cashier)"
    users ||--o{ audit_logs : "triggers"
    
    restaurant_areas ||--|{ restaurant_tables : "contains"
    
    categories ||--|{ menu_items : "classifies"
    
    restaurant_tables ||--o{ orders : "serves"
    
    orders ||--|{ order_items : "contains"
    menu_items ||--o{ order_items : "ordered_in"
    
    orders ||--o{ invoices : "billed_by"
    orders ||--o{ payments : "paid_by"

    users {
        string id PK
        string email UK
        string passwordHash
        string fullName
        string phone
        string role "CUSTOMER | CHEF | CASHIER | MANAGER"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    categories {
        string id PK
        string name
        string slug UK
        string description
        int displayOrder
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    menu_items {
        string id PK
        string categoryId FK
        string name
        string description
        float price
        string imageUrl
        boolean isAvailable
        boolean isFeatured
        int preparationTimeMinutes
        datetime createdAt
        datetime updatedAt
    }

    restaurant_areas {
        string id PK
        string name
        int floor
        string description
        datetime createdAt
        datetime updatedAt
    }

    restaurant_tables {
        string id PK
        string tableCode UK
        string areaId FK
        int capacity
        string status "AVAILABLE | OCCUPIED | SERVING | PAYMENT_REQUESTED | RESERVED"
        string qrCodeToken UK
        datetime createdAt
        datetime updatedAt
    }

    orders {
        string id PK
        string orderNumber UK
        string tableId FK
        string customerId FK
        string status "RECEIVED | COOKING | READY | SERVED | PAYMENT_REQUESTED | COMPLETED | CANCELLED"
        float totalAmount
        string notes
        datetime paymentRequestedAt
        datetime completedAt
        datetime cancelledAt
        string cancelReason
        datetime createdAt
        datetime updatedAt
    }

    order_items {
        string id PK
        string orderId FK
        string menuItemId FK
        int quantity
        float unitPrice "Snapshot price at order time"
        float subtotal
        string notes
        string status "RECEIVED | COOKING | READY | SERVED | CANCELLED"
        datetime startedCookingAt
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }

    payments {
        string id PK
        string orderId FK
        string invoiceId
        float amount
        string paymentMethod "CASH | BANK_TRANSFER | CARD"
        float customerGivenAmount
        float changeReturned
        string status "SUCCESS | PENDING | FAILED"
        string transactionReference
        string cashierId FK
        datetime paidAt
        datetime createdAt
        datetime updatedAt
    }

    invoices {
        string id PK
        string invoiceNumber UK
        string orderId FK
        float totalAmount
        float discountAmount
        float finalAmount
        string paymentMethod
        string cashierId
        string customerName
        string tableCode
        string notes
        datetime createdAt
    }

    audit_logs {
        string id PK
        string userId FK
        string userEmail
        string userRole
        string action
        string entity
        string entityId
        string details
        string ipAddress
        datetime createdAt
    }

    restaurant_configs {
        string id PK
        string key UK
        string value
        string description
        datetime updatedAt
    }
```

## 2. Các Quy Tắc Toàn Vẹn Dữ Liệu Quan Trọng

1. **Bảo tồn giá bán (Price Snapshot):**
   - Trường `order_items.unitPrice` lưu lại chính xác đơn giá của món ăn tại thời điểm khách gọi món.
   - Nếu Quản lý thay đổi giá của món trong `menu_items`, giá lịch sử của các đơn hàng và hóa đơn đã lập trước đó hoàn toàn không bị thay đổi.

2. **Chống lỗi "Bàn có món nhưng thu ngân báo chưa có món":**
   - Quan hệ giữa `restaurant_tables` và `orders` được truy vấn chặt chẽ thông qua API `GET /api/orders/table/:tableId/active`.
   - Backend chỉ lấy các đơn có trạng thái chưa kết thúc (`status NOT IN ('COMPLETED', 'CANCELLED')`) và luôn thực hiện `include: { items: { include: { menuItem: true } } }`.

3. **Tự động giải phóng bàn khi thanh toán:**
   - Khi Thu ngân xác nhận thanh toán (`POST /api/payments/checkout`), hệ thống kiểm tra và tự động cập nhật `restaurant_tables.status = 'AVAILABLE'` trong cùng 1 Prisma Transaction.

4. **Bảo vệ toàn vẹn lịch sử (Soft-deactivate):**
   - Khi Quản lý xóa món ăn đã từng xuất hiện trong `order_items`, hệ thống tự động chuyển món sang `isAvailable = false` thay vì xóa cứng làm hỏng dữ liệu báo cáo doanh thu.
