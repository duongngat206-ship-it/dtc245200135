const { pool } = require('../config/db');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Admin: list categories
async function getAdminCategories(req, res) {
  try {
    const [categories] = await pool.query(`
      SELECT c.*, COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.render('admin/categories', {
      title: 'Quản lý Danh mục',
      categories,
      activeMenu: 'categories',
      message: req.query.msg || null,
      error: req.query.err || null
    });
  } catch (err) {
    console.error('getAdminCategories error:', err);
    res.status(500).send('Server Error: ' + err.message);
  }
}

// Admin: create category
async function createCategory(req, res) {
  try {
    const { name, description, color_badge } = req.body;
    if (!name || name.trim() === '') {
      return res.redirect('/admin/categories?err=' + encodeURIComponent('Tên danh mục không được để trống.'));
    }

    let slug = slugify(name);
    const [existing] = await pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      slug += '-' + Date.now().toString().slice(-4);
    }

    await pool.query(`
      INSERT INTO categories (name, slug, description, color_badge)
      VALUES (?, ?, ?, ?)
    `, [name.trim(), slug, description || null, color_badge || '#2563eb']);

    res.redirect('/admin/categories?msg=' + encodeURIComponent('Đã thêm danh mục thành công.'));
  } catch (err) {
    console.error('createCategory error:', err);
    res.redirect('/admin/categories?err=' + encodeURIComponent('Lỗi thêm danh mục: ' + err.message));
  }
}

// Admin: delete category
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.redirect('/admin/categories?msg=' + encodeURIComponent('Đã xóa danh mục thành công.'));
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.redirect('/admin/categories?err=' + encodeURIComponent('Lỗi xóa danh mục: ' + err.message));
  }
}

module.exports = {
  getAdminCategories,
  createCategory,
  deleteCategory
};
