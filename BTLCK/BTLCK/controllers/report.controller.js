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