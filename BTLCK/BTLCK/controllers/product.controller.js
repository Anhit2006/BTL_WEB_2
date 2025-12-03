// controllers/product.controller.js
const pool = require('../config/db');
const generateId = require('../utils/generateId');

exports.getProducts = async (req, res) => {
  try {
    const { search, showHidden } = req.query;
    let query = 'SELECT * FROM san_pham WHERE 1=1';
    const params = [];
    
    if (showHidden !== 'true') query += ' AND trang_thai = 1';
    
    if (search) {
      query += ' AND (ten_sp LIKE ? OR ma_sp LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY ten_sp ASC';
    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const [product] = await pool.execute('SELECT * FROM san_pham WHERE ma_sp = ?', [req.params.id]);
    if (product.length === 0) return res.status(404).json({ success: false, error: 'Sản phẩm không tồn tại' });
    res.json({ success: true, data: product[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { ten_sp, gia_ban, so_luong_ton = 0, mo_ta = '', anh = '' } = req.body;
    
    if (!ten_sp?.trim()) return res.status(400).json({ success: false, error: 'Tên sản phẩm bắt buộc' });
    if (!gia_ban || Number(gia_ban) <= 0) return res.status(400).json({ success: false, error: 'Giá bán phải > 0' });
    if (Number(so_luong_ton) < 0) return res.status(400).json({ success: false, error: 'Tồn kho không được âm' });

    const ma_sp = generateId('SP');
    const params = [ma_sp, ten_sp.trim(), Number(gia_ban), Number(so_luong_ton), mo_ta.trim(), anh.trim()];
    
    await pool.execute(
      'INSERT INTO san_pham (ma_sp, ten_sp, gia_ban, so_luong_ton, mo_ta, anh, trang_thai) VALUES (?, ?, ?, ?, ?, ?, 1)',
      params
    );
    
    res.status(201).json({ success: true, data: { ma_sp, ...req.body, trang_thai: 1 } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // ... code lấy existing ...

    const body = req.body;
    
    const updateData = {
      ten_sp: body.ten_sp !== undefined ? body.ten_sp.trim() : current.ten_sp,
      gia_ban: body.gia_ban !== undefined ? Number(body.gia_ban) : current.gia_ban,
      // XÓA DÒNG NÀY: so_luong_ton: ... -> Không cho phép update tồn kho ở đây để tránh ghi đè sai
      mo_ta: body.mo_ta !== undefined ? body.mo_ta.trim() : current.mo_ta,
      anh: body.anh !== undefined ? body.anh.trim() : current.anh
    };

    // ... validation ...

    // Bỏ so_luong_ton ra khỏi câu lệnh UPDATE
    await pool.execute(
      'UPDATE san_pham SET ten_sp = ?, gia_ban = ?, mo_ta = ?, anh = ? WHERE ma_sp = ?',
      [updateData.ten_sp, updateData.gia_ban, updateData.mo_ta, updateData.anh, id]
    );
    
    res.json({ success: true, message: 'Cập nhật thành công', data: { ma_sp: id, ...updateData } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const status = Number(req.body.trang_thai);
    
    if (![0, 1].includes(status)) return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' });

    const [result] = await pool.execute('UPDATE san_pham SET trang_thai = ? WHERE ma_sp = ?', [status, id]);
    
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Sản phẩm không tồn tại' });

    res.json({ success: true, message: status === 1 ? 'Đã hiện sản phẩm' : 'Đã ẩn sản phẩm' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra ràng buộc song song
    const [check] = await pool.execute(`
        SELECT 
            (SELECT COUNT(*) FROM ct_don_hang WHERE ma_sp = ?) as order_count,
            (SELECT COUNT(*) FROM ct_phieu_nhap WHERE ma_sp = ?) as import_count,
            (SELECT COUNT(*) FROM san_pham WHERE ma_sp = ?) as exists_count
    `, [id, id, id]);

    const { order_count, import_count, exists_count } = check[0];

    if (exists_count === 0) return res.status(404).json({ success: false, error: 'Sản phẩm không tồn tại' });
    if (order_count > 0) return res.status(400).json({ success: false, error: `Đã có ${order_count} đơn hàng liên quan.` });
    if (import_count > 0) return res.status(400).json({ success: false, error: `Đã có ${import_count} phiếu nhập liên quan.` });

    await pool.execute('DELETE FROM san_pham WHERE ma_sp = ?', [id]);
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};