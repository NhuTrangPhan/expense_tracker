# Quản lý chi tiêu (Expense Tracker)

Ứng dụng web quản lý thu chi cá nhân — HTML/CSS/JavaScript thuần, không cần cài đặt dependency.

## Tính năng

- Ghi lại giao dịch **thu nhập** và **chi tiêu** (mô tả, số tiền, danh mục, ngày)
- Tổng quan theo tháng: **tổng thu, tổng chi, số dư**
- Biểu đồ **chi tiêu theo danh mục** (Ăn uống, Di chuyển, Mua sắm, Hóa đơn, Giải trí, Sức khỏe, Giáo dục, Khác)
- Lọc giao dịch theo tháng, xóa giao dịch
- Dữ liệu lưu trên trình duyệt (**localStorage**) — không cần server hay database
- Hỗ trợ **dark mode** theo cài đặt hệ điều hành
- Định dạng tiền tệ VND

## Chạy ứng dụng

Cách 1 — mở trực tiếp: mở file `index.html` bằng trình duyệt.

Cách 2 — chạy qua web server (khuyến nghị):

```bash
# Python
python3 -m http.server 8080

# hoặc Node.js
npx serve .
```

Sau đó mở http://localhost:8080 trong trình duyệt.

## Cấu trúc project

```
├── index.html      # Giao diện chính
├── css/style.css   # Style + design tokens (light/dark)
└── js/app.js       # Logic ứng dụng + lưu trữ localStorage
```
