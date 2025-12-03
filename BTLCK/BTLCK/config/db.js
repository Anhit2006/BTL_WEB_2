// config/db.js - Kết nối MySQL (pool)
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'lienminh9a3',
  database: 'quan_ly_ban_hang', // Thay 'name' bằng tên database thực tế của bạn
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;