const { pool } = require('../config/db');
const {
  comparePassword,
  hashPassword,
  generateJwtToken,
  generateRandomLetters
} = require('../utils/security');

// Login page
function getLoginPage(req, res) {
  if (res.locals.currentUser) {
    return res.redirect('/admin');
  }

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'MgVKloQkOG';

  res.render('login', {
    title: 'Đăng nhập Quản trị',
    error: req.query.error || null,
    demoCredentials: {
      username: adminUser,
      password: adminPass,
      role: 'Administrator'
    }
  });
}

// Handle login and issue JWT token
async function handleLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.redirect('/login?error=' + encodeURIComponent('Vui lòng nhập đầy đủ tài khoản và mật khẩu.'));
    }

    const [rows] = await pool.query(
      'SELECT id, username, email, password_hash, full_name, role FROM users WHERE username = ? OR email = ?',
      [username.trim(), username.trim()]
    );

    if (rows.length === 0) {
      return res.redirect('/login?error=' + encodeURIComponent('Tài khoản hoặc mật khẩu không chính xác.'));
    }

    const user = rows[0];
    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) {
      return res.redirect('/login?error=' + encodeURIComponent('Tài khoản hoặc mật khẩu không chính xác.'));
    }

    const token = generateJwtToken(user);

    res.cookie('jwt_token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000
    });

    console.log(`[Auth] User '${user.username}' logged in successfully`);
    res.redirect('/admin');
  } catch (err) {
    console.error('handleLogin error:', err);
    res.redirect('/login?error=' + encodeURIComponent('Lỗi xác thực hệ thống.'));
  }
}

// Logout
function handleLogout(req, res) {
  res.clearCookie('jwt_token');
  res.redirect('/login?error=' + encodeURIComponent('Đã đăng xuất.'));
}

// Admin dashboard summary
async function getAdminDashboard(req, res) {
  try {
    const [[postStats]] = await pool.query('SELECT COUNT(*) as total_posts, SUM(views) as total_views FROM posts');
    const [[catStats]] = await pool.query('SELECT COUNT(*) as total_categories FROM categories');
    const [[userStats]] = await pool.query('SELECT COUNT(*) as total_users FROM users');

    const [recentPosts] = await pool.query(`
      SELECT p.id, p.title, p.views, p.created_at, p.status, c.name as category_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    res.render('admin/dashboard', {
      title: 'Dashboard Quản trị',
      activeMenu: 'dashboard',
      stats: {
        totalPosts: postStats.total_posts || 0,
        totalViews: postStats.total_views || 0,
        totalCategories: catStats.total_categories || 0,
        totalUsers: userStats.total_users || 0
      },
      recentPosts
    });
  } catch (err) {
    console.error('getAdminDashboard error:', err);
    res.status(500).send('Server Error: ' + err.message);
  }
}

// Admin: list users
async function getAdminUsers(req, res) {
  try {
    const [users] = await pool.query('SELECT id, username, email, full_name, role, created_at FROM users ORDER BY id ASC');
    res.render('admin/users', {
      title: 'Quản lý Người dùng',
      users,
      activeMenu: 'users',
      createdUser: req.query.new_user ? JSON.parse(decodeURIComponent(req.query.new_user)) : null,
      error: req.query.err || null
    });
  } catch (err) {
    console.error('getAdminUsers error:', err);
    res.status(500).send('Server Error: ' + err.message);
  }
}

// Admin: create user with random password
async function createUser(req, res) {
  try {
    const { username, email, full_name, role } = req.body;
    if (!username || !email || !full_name) {
      return res.redirect('/admin/users?err=' + encodeURIComponent('Vui lòng điền đầy đủ thông tin.'));
    }

    const generatedPassword = generateRandomLetters(10);
    const hashedPassword = await hashPassword(generatedPassword);

    await pool.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?, ?)
    `, [username.trim(), email.trim(), hashedPassword, full_name.trim(), role || 'author']);

    const newUserData = {
      username: username.trim(),
      email: email.trim(),
      generatedPassword,
      role: role || 'author'
    };

    console.log(`[User] Created user '${username}'`);
    res.redirect('/admin/users?new_user=' + encodeURIComponent(JSON.stringify(newUserData)));
  } catch (err) {
    console.error('createUser error:', err);
    res.redirect('/admin/users?err=' + encodeURIComponent('Lỗi tạo người dùng: ' + err.message));
  }
}

module.exports = {
  getLoginPage,
  handleLogin,
  handleLogout,
  getAdminDashboard,
  getAdminUsers,
  createUser
};
