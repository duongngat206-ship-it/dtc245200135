const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'e89df0f82f10d22ff5d914d22c6d7ea62df71aa44ca7ceca138440d52fc791a2';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate n random letters
function generateRandomLetters(length = 10) {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += letters[bytes[i] % letters.length];
  }
  return result;
}

// Password hashing
async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

// Password verification
async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Generate JWT token
function generateJwtToken(userPayload) {
  return jwt.sign(
    {
      id: userPayload.id,
      username: userPayload.username,
      role: userPayload.role,
      fullName: userPayload.full_name || userPayload.fullName
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
function verifyJwtToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Seed admin user if not exists
async function initAdminUser(pool) {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@enterprise-blog.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'MgVKloQkOG';

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [adminUsername, adminEmail]);
    if (rows.length === 0) {
      const hashed = await hashPassword(adminPassword);
      await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name, role)
         VALUES (?, ?, ?, ?, ?)`,
        [adminUsername, adminEmail, hashed, 'System Administrator', 'admin']
      );
      console.log(`[Security] Admin user '${adminUsername}' initialized`);
    }
  } catch (err) {
    console.error(`[Security] Admin user init error:`, err.message);
  }
}

module.exports = {
  generateRandomLetters,
  hashPassword,
  comparePassword,
  generateJwtToken,
  verifyJwtToken,
  initAdminUser
};
