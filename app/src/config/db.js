const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'blog_user',
  password: process.env.MYSQL_PASSWORD || 'OyzIVfYrlI',
  database: process.env.MYSQL_DATABASE || 'blog_cms_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

const pool = mysql.createPool(dbConfig);

// Retry connection until database is ready
async function testConnection(maxRetries = 15, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await pool.getConnection();
      console.log(`[Database] Connected successfully (attempt ${attempt})`);
      conn.release();
      return true;
    } catch (err) {
      console.warn(`[Database] Waiting for database (${attempt}/${maxRetries}): ${err.message}`);
      if (attempt === maxRetries) {
        throw new Error(`[Database] Connection failed: ${err.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = {
  pool,
  testConnection
};
