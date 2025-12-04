// config/db.js - Kết nối MySQL (pool)
require('dotenv').config();
const mysql = require('mysql2/promise');

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME,
  DB_PORT = '3306'
} = process.env;

if (!DB_NAME) {
  console.warn('Warning: DB_NAME is not set. Please set DB_NAME in your .env file');
}

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT) || 3306,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;