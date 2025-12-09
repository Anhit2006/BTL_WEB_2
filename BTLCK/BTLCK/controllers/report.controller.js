// controllers/report.controller.js
const pool = require('../config/db');

// controllers/report.controller.js
exports.getCurrentStock = async (req, res) => {
  try {
    // Thay vì CALL sp_ton_kho(), ta query trực tiếp bảng san_pham
    const [products] = await pool.execute(`
      SELECT ma_sp, ten_sp, so_luong_ton, gia_ban, 
             (so_luong_ton * gia_ban) as gia_tri_ton 
      FROM san_pham 
      ORDER BY so_luong_ton ASC
    `);
    
    const summary = {
      total_products: products.length,
      total_stock_value: products.reduce((sum, p) => sum + (Number(p.gia_tri_ton) || 0), 0),
      low_stock: products.filter(p => p.so_luong_ton < 10 && p.so_luong_ton > 0),
      out_of_stock: products.filter(p => p.so_luong_ton <= 0)
    };
    
    res.json({ success: true, data: { products, summary } });
  } catch (err) {
    // ...
  }
};

exports.getRevenueByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Ngày không hợp lệ (YYYY-MM-DD)' });
    }
    
    const [result] = await pool.execute('CALL sp_doanh_thu_ngay(?)', [date]);
    res.json({ success: true, data: { date, doanh_thu: result[0][0]?.doanh_thu || 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getRevenueByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ success: false, error: 'Tháng/Năm không hợp lệ' });
    }
    
    const [result] = await pool.execute('CALL sp_doanh_thu_thang(?, ?)', [month, year]);
    res.json({ success: true, data: { month, year, doanh_thu: result[0][0]?.doanh_thu || 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};
// Tồn kho theo ngày
exports.getStockByDate = async (req, res) => {
    try {
        const { date } = req.query; // Nhận ngày YYYY-MM-DD từ frontend
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ success: false, error: 'Ngày không hợp lệ (YYYY-MM-DD) hoặc bắt buộc' });
        }

        // T tính toán Tồn Kho Lịch Sử: Tổng Nhập (đến ngày date) - Tổng Xuất (đến ngày date)
        const query = `
            SELECT 
                sp.ma_sp, 
                sp.ten_sp, 
                sp.gia_ban,
                -- Tính tổng số lượng nhập kho trước hoặc bằng ngày được chọn
                COALESCE(SUM(CASE WHEN pn.ngay_nhap <= ? THEN ctpn.so_luong ELSE 0 END), 0) AS total_import,
                -- Tính tổng số lượng bán ra (đơn hàng) trước hoặc bằng ngày được chọn
                COALESCE(SUM(CASE WHEN dh.ngay_dat <= ? THEN ctdh.so_luong ELSE 0 END), 0) AS total_sale
            FROM san_pham sp
            -- LEFT JOIN với chi tiết phiếu nhập (ct_phieu_nhap) và phiếu nhập (phieu_nhap)
            LEFT JOIN ct_phieu_nhap ctpn ON sp.ma_sp = ctpn.ma_sp
            LEFT JOIN phieu_nhap pn ON ctpn.ma_pn = pn.ma_pn
            -- LEFT JOIN với chi tiết đơn hàng (ct_don_hang) và đơn hàng (don_hang)
            LEFT JOIN ct_don_hang ctdh ON sp.ma_sp = ctdh.ma_sp
            LEFT JOIN don_hang dh ON ctdh.ma_dh = dh.ma_dh
            GROUP BY sp.ma_sp, sp.ten_sp, sp.gia_ban
            HAVING (total_import - total_sale) > 0 OR total_import > 0 -- Chỉ lấy sản phẩm đã từng được nhập kho
            ORDER BY sp.ma_sp
        `;
        
        
        const [rows] = await pool.execute(query, [date, date]);

        const stockData = rows.map(row => ({
            ma_sp: row.ma_sp,
            ten_sp: row.ten_sp,
            gia_ban: row.gia_ban,
           
            so_luong_ton: row.total_import - row.total_sale
        }));

        res.json({ success: true, data: stockData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.getTop5BestSelling = async (req, res) => {
  try {
    const [result] = await pool.execute('CALL sp_top_5_ban_chay()');
    res.json({ success: true, data: result[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// TỐI ƯU HIỆU NĂNG QUERY
exports.getCustomerHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Chạy song song query lấy thông tin khách và đơn hàng
    const [customerRows, ordersRows] = await Promise.all([
        pool.execute('SELECT * FROM khach_hang WHERE ma_kh = ?', [customerId]),
        pool.execute(
            `SELECT dh.*, (SELECT COUNT(*) FROM ct_don_hang WHERE ma_dh = dh.ma_dh) as item_count 
             FROM don_hang dh WHERE dh.ma_kh = ? ORDER BY dh.ngay_mua DESC`,
            [customerId]
        )
    ]);

    if (customerRows[0].length === 0) {
      return res.status(404).json({ success: false, error: 'Khách hàng không tồn tại' });
    }
    
    const orders = ordersRows[0];

    // TỐI ƯU: Sử dụng Promise.all để lấy chi tiết song song thay vì tuần tự (N+1 problem)
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
        const [details] = await pool.execute(
            `SELECT ct.*, sp.ten_sp 
             FROM ct_don_hang ct 
             JOIN san_pham sp ON ct.ma_sp = sp.ma_sp 
             WHERE ct.ma_dh = ?`,
            [order.ma_dh]
        );
        return { ...order, items: details };
    }));
    
    const stats = {
      total_orders: orders.length,
      total_spent: orders.reduce((sum, o) => sum + Number(o.tong_tien || 0), 0)
    };
    
    res.json({ success: true, data: { customer: customerRows[0][0], orders: ordersWithDetails, stats } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};