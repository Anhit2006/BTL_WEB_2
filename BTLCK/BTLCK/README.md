# BTLCK - Backend API Documentation

## 📋 Tổng Quan Hệ Thống

Hệ thống quản lý bán hàng toàn diện với các chức năng: quản lý sản phẩm, khách hàng, đơn hàng, nhập kho, và báo cáo.

---

## 🎯 Chức Năng Chính

### 1️⃣ Quản Lý Sản Phẩm (Product Management)

#### Dữ liệu sản phẩm:
- **Mã sản phẩm** (ma_sp): ID tự động sinh ra
- **Tên sản phẩm** (ten_sp): Text, bắt buộc
- **Giá bán** (gia_ban): Number, > 0, bắt buộc
- **Số lượng tồn kho** (so_luong_ton): Number, >= 0
- **Mô tả** (mo_ta): Text, tùy chọn
- **Ảnh sản phẩm** (anh): URL, tùy chọn
- **Trạng thái** (trang_thai): 1 = Hiển thị, 0 = Ẩn

#### Chức năng:
| Chức năng | Method | Endpoint | Mô tả |
|-----------|--------|----------|-------|
| Lấy danh sách | GET | `/api/products` | Lấy sản phẩm (filter trang_thai, search) |
| Thêm sản phẩm | POST | `/api/products` | Tạo sản phẩm mới với validation |
| Sửa sản phẩm | PUT | `/api/products/:id` | Cập nhật thông tin sản phẩm |
| Ẩn/Hiện sản phẩm | PUT | `/api/products/:id/toggle` | Thay đổi trạng thái hiển thị |
| Xóa sản phẩm | DELETE | `/api/products/:id` | Xóa sản phẩm (nếu chưa có giao dịch) |

#### Validation & Logic:
✅ Kiểm tra tên sản phẩm không trống  
✅ Kiểm tra giá bán > 0  
✅ Kiểm tra số lượng >= 0  
✅ Prevent xóa nếu sản phẩm có trong đơn hàng  
✅ Prevent xóa nếu sản phẩm có trong phiếu nhập  
✅ Cho phép ẩn sản phẩm thay vì xóa (best practice)

---

### 2️⃣ Quản Lý Khách Hàng (Customer Management)

#### Dữ liệu khách hàng:
- **Mã khách hàng** (ma_kh): ID tự động sinh ra
- **Họ tên** (ho_ten): Text, bắt buộc
- **Năm sinh** (nam_sinh): Year, tùy chọn
- **Địa chỉ** (dia_chi): Text, tùy chọn

#### Chức năng:
| Chức năng | Method | Endpoint | Mô tả |
|-----------|--------|----------|-------|
| Lấy danh sách | GET | `/api/customers` | Lấy tất cả khách hàng, có search |
| Thêm khách hàng | POST | `/api/customers` | Tạo khách hàng mới |
| Sửa khách hàng | PUT | `/api/customers/:id` | Cập nhật thông tin |
| Xóa khách hàng | DELETE | `/api/customers/:id` | Xóa khách hàng (nếu chưa có đơn hàng) |

#### Validation & Logic:
✅ Kiểm tra họ tên không trống  
✅ Prevent xóa khách hàng có lịch sử mua hàng  
✅ Check affectedRows để confirm success

---

### 3️⃣ Quản Lý Đơn Hàng (Order Management)

#### Dữ liệu đơn hàng:
- **Mã đơn hàng** (ma_dh): ID tự động sinh ra
- **Mã khách hàng** (ma_kh): Foreign key
- **Ngày mua** (ngay_mua): DateTime tự động
- **Tổng tiền** (tong_tien): Calculated
- **Chi tiết**: Danh sách sản phẩm kèm số lượng, giá, thành tiền

#### Chức năng:
| Chức năng | Method | Endpoint | Mô tả |
|-----------|--------|----------|-------|
| Lấy tất cả | GET | `/api/orders` | Lấy đơn hàng, filter theo keyword/date |
| Lấy chi tiết | GET | `/api/orders/:id` | Lấy chi tiết 1 đơn hàng + items |
| Lấy theo khách | GET | `/api/orders/customer/:customerId` | Lấy đơn hàng của 1 khách |
| Tạo đơn hàng | POST | `/api/orders` | Tạo đơn hàng mới |
| Cập nhật trạng thái | PUT | `/api/orders/:id` | Placeholder (có thể mở rộng) |
| Xóa đơn hàng | DELETE | `/api/orders/:id` | Hủy đơn, hoàn lại kho |

#### Validation & Logic:
✅ **Transaction**: BEGIN/COMMIT/ROLLBACK  
✅ **Row Locking**: SELECT ... FOR UPDATE (tránh race condition)  
✅ **Kiểm tra tồn kho**: Trước khi tạo đơn  
✅ **Tự động trừ kho**: Khi đơn hàng được tạo  
✅ **Hoàn kho**: Khi xóa/hủy đơn hàng  
✅ **Calculate tổng tiền**: Tự động từ các items

---

### 4️⃣ Quản Lý Nhập Kho (Stock Import)

#### Dữ liệu phiếu nhập:
- **Mã phiếu nhập** (ma_pn): ID tự động sinh ra
- **Ngày nhập** (ngay_nhap): DateTime tự động
- **Đơn vị nhập** (don_vi_nhap): Text (tên nhà cung cấp/kho)
- **Tổng tiền** (tong_tien): Calculated
- **Chi tiết**: Danh sách sản phẩm kèm số lượng, đơn giá, thành tiền

#### Chức năng:
| Chức năng | Method | Endpoint | Mô tả |
|-----------|--------|----------|-------|
| Lấy lịch sử | GET | `/api/stock/imports` | Lấy tất cả phiếu nhập + details |
| Tạo phiếu nhập | POST | `/api/stock/imports` | Nhập kho sản phẩm mới |

#### Validation & Logic:
✅ **Transaction**: BEGIN/COMMIT/ROLLBACK  
✅ **Row Locking**: SELECT ... FOR UPDATE  
✅ **Kiểm tra sản phẩm**: Phải tồn tại trong CSDL  
✅ **Kiểm tra số lượng**: > 0  
✅ **Kiểm tra đơn giá**: > 0  
✅ **Tự động cộng kho**: Cập nhật so_luong_ton sản phẩm  
✅ **Calculate tổng tiền**: Tự động từ các items

---

### 5️⃣ Báo Cáo & Thống Kê (Reports)

#### A. Báo Cáo Tồn Kho Hiện Tại
| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/reports/stock/current` | GET | Lấy tình trạng tồn kho hiện tại |

**Response bao gồm:**
- Danh sách sản phẩm với tồn kho hiện tại
- Tổng giá trị tồn kho (số lượng × giá)
- Sản phẩm tồn kho thấp (< 10 cái)
- Sản phẩm hết hàng (= 0 cái)

#### B. Báo Cáo Doanh Thu
| Endpoint | Method | Query Params | Mô tả |
|----------|--------|--------------|-------|
| `/api/reports/revenue/date` | GET | `date=YYYY-MM-DD` | Doanh thu theo ngày |
| `/api/reports/revenue/month` | GET | `month=M&year=YYYY` | Doanh thu theo tháng |

#### C. Top 5 Sản Phẩm Bán Chạy
| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/reports/top-selling` | GET | Lấy 5 sản phẩm bán nhiều nhất |

#### D. Lịch Sử Mua Hàng Khách Hàng
| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/reports/customer/:customerId` | GET | Lịch sử mua + thống kê |

**Response bao gồm:**
- Thông tin khách hàng
- Danh sách đơn hàng
- Tổng tiền chi tiêu
- Số lần mua hàng

---

## 🔍 Tìm Kiếm & Lọc

### Sản Phẩm
```
GET /api/products?search=iPhone&showHidden=false
```
- `search`: Tìm theo tên hoặc mã sản phẩm
- `showHidden`: true = hiển thị cả sản phẩm ẩn, false = chỉ sản phẩm đang bán

### Khách Hàng
```
GET /api/customers?search=Nguyễn
```
- `search`: Tìm theo tên hoặc mã khách hàng

### Đơn Hàng
```
GET /api/orders?keyword=DH001&startDate=2024-01-01&endDate=2024-12-31
```
- `keyword`: Tìm theo mã đơn hoặc tên khách
- `startDate`, `endDate`: Lọc theo ngày (format: YYYY-MM-DD)

---

## 📊 Cập Nhật Tồn Kho

### Luồng Tự Động:
1. **Khi tạo đơn hàng**: `so_luong_ton -= so_luong_mua`
2. **Khi xóa đơn hàng**: `so_luong_ton += so_luong_mua` (hoàn lại)
3. **Khi nhập kho**: `so_luong_ton += so_luong_nhap`

### Bảo Vệ Dữ Liệu:
- ✅ Kiểm tra tồn kho trước tạo đơn
- ✅ Ngăn chặn tồn kho âm
- ✅ Transaction để đảm bảo tính nhất quán
- ✅ Row lock để tránh concurrency issues

---

## 🛡️ Xử Lý Lỗi & Validation

### Input Validation:
```javascript
// Sản phẩm
- ten_sp: required, not empty
- gia_ban: required, > 0
- so_luong_ton: >= 0

// Khách hàng
- ho_ten: required, not empty

// Đơn hàng
- ma_kh: required
- items: required, not empty, valid format

// Nhập kho
- don_vi_nhap: required, not empty
- items: required, valid format
```

### Error Response:
```json
{
  "success": false,
  "error": "Thông báo lỗi chi tiết"
}
```

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Thao tác thành công"
}
```

---

## 📁 Cấu Trúc Thư Mục

```
BTLCK/
├── app.js                 # Main Express app
├── package.json
├── config/
│   └── db.js             # Database connection
├── controllers/
│   ├── customer.controller.js
│   ├── order.controller.js
│   ├── product.controller.js
│   ├── report.controller.js
│   └── stock.controller.js
├── routes/
│   ├── customer.routes.js
│   ├── order.routes.js
│   ├── product.routes.js
│   ├── report.routes.js
│   └── stock.routes.js
└── utils/
    └── generateId.js     # Auto ID generator
```

---

## 🚀 Khởi Chạy Server

```bash
npm install
node app.js
```

Server sẽ chạy trên `http://localhost:5000`

---

## 📌 Ghi Chú Kỹ Thuật

### Database Constraints:
- ✅ Foreign keys: Tránh xóa sản phẩm/khách hàng có giao dịch
- ✅ CHECK constraints: Đảm bảo giá > 0, số lượng >= 0

### Performance:
- ✅ Row locking (FOR UPDATE) trong transactions
- ✅ Pagination tùy chọn cho reports
- ✅ Index trên ma_kh, ma_sp, ma_dh để tối ưu query

### Security:
- ✅ Input validation trước xử lý
- ✅ Error messages không leak thông tin nhạy cảm
- ✅ Transaction rollback khi có lỗi

---

## ✅ Trạng Thái Phát Triển

- ✅ Quản lý sản phẩm (CRUD + toggle visibility)
- ✅ Quản lý khách hàng (CRUD)
- ✅ Quản lý đơn hàng (CRUD + transaction)
- ✅ Quản lý nhập kho (Create + list + transaction)
- ✅ Báo cáo tồn kho (Current + by date)
- ✅ Báo cáo doanh thu (Daily + monthly)
- ✅ Top sản phẩm bán chạy
- ✅ Lịch sử khách hàng
- ✅ Tìm kiếm & lọc
- ✅ Validation & error handling
- ✅ Transaction & row locking
