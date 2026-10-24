const { pool } = require('../config/db');
const { postsGauge } = require('../middleware/metrics');

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

// Public homepage
async function getHomePage(req, res) {
  try {
    const { category, q } = req.query;
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');

    let sql = `
      SELECT p.*, c.name as category_name, c.color_badge, c.slug as category_slug, u.full_name as author_name, u.avatar as author_avatar
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
    `;
    const params = [];

    if (category) {
      sql += ' AND c.slug = ?';
      params.push(category);
    }

    if (q) {
      sql += ' AND (p.title LIKE ? OR p.summary LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += ' ORDER BY p.created_at DESC';

    const [posts] = await pool.query(sql, params);
    postsGauge.set(posts.length);

    res.render('home', {
      title: 'InsightHub - Tech & System Administration Blog',
      posts,
      categories,
      selectedCategory: category || '',
      searchQuery: q || '',
      featuredPost: posts.length > 0 ? posts[0] : null
    });
  } catch (err) {
    console.error('getHomePage error:', err);
    res.status(500).send('Server Error: ' + err.message);
  }
}

// Single post detail
async function getPostDetail(req, res) {
  try {
    const { slug } = req.params;

    await pool.query('UPDATE posts SET views = views + 1 WHERE slug = ?', [slug]);

    const [posts] = await pool.query(`
      SELECT p.*, c.name as category_name, c.color_badge, c.slug as category_slug, u.full_name as author_name, u.avatar as author_avatar
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.author_id = u.id
      WHERE p.slug = ?
    `, [slug]);

    if (posts.length === 0) {
      return res.status(404).render('404', { title: 'Not Found' });
    }

    const post = posts[0];
    const [relatedPosts] = await pool.query(`
      SELECT p.id, p.title, p.slug, p.cover_image, p.created_at
      FROM posts p
      WHERE p.category_id = ? AND p.id != ? AND p.status = 'published'
      LIMIT 3
    `, [post.category_id, post.id]);

    res.render('post-detail', {
      title: post.title,
      post,
      relatedPosts
    });
  } catch (err) {
    console.error('getPostDetail error:', err);
    res.status(500).send('Server Error: ' + err.message);
  }
}

// Admin: list posts
async function getAdminPosts(req, res) {
  try {
    const [posts] = await pool.query(`
      SELECT p.*, c.name as category_name, u.full_name as author_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.render('admin/posts', {
      title: 'Quản lý Bài viết',
      posts,
      activeMenu: 'posts'
    });
  } catch (err) {
    console.error('getAdminPosts error:', err);
    res.status(500).send('Server Error: ' + err.message);
  }
}

// Admin: new post form
async function getNewPostForm(req, res) {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.render('admin/post-form', {
      title: 'Tạo Bài viết',
      categories,
      post: null,
      activeMenu: 'posts'
    });
  } catch (err) {
    console.error('getNewPostForm error:', err);
    res.status(500).send('Server Error');
  }
}

// Admin: create post
async function createPost(req, res) {
  try {
    const { title, summary, content, category_id, cover_image, status } = req.body;
    let slug = slugify(title);

    const [existing] = await pool.query('SELECT id FROM posts WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      slug += '-' + Date.now().toString().slice(-4);
    }

    const defaultCover = cover_image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';

    await pool.query(`
      INSERT INTO posts (title, slug, summary, content, category_id, author_id, cover_image, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, slug, summary, content, category_id || null, req.user.id, defaultCover, status || 'published']);

    res.redirect('/admin/posts');
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).send('Error: ' + err.message);
  }
}

// Admin: edit post form
async function getEditPostForm(req, res) {
  try {
    const { id } = req.params;
    const [posts] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    if (posts.length === 0) return res.status(404).send('Post not found');

    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.render('admin/post-form', {
      title: 'Chỉnh sửa Bài viết',
      categories,
      post: posts[0],
      activeMenu: 'posts'
    });
  } catch (err) {
    console.error('getEditPostForm error:', err);
    res.status(500).send('Server Error');
  }
}

// Admin: update post
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const { title, summary, content, category_id, cover_image, status } = req.body;

    await pool.query(`
      UPDATE posts 
      SET title = ?, summary = ?, content = ?, category_id = ?, cover_image = ?, status = ?
      WHERE id = ?
    `, [title, summary, content, category_id || null, cover_image, status, id]);

    res.redirect('/admin/posts');
  } catch (err) {
    console.error('updatePost error:', err);
    res.status(500).send('Error: ' + err.message);
  }
}

// Admin: delete post
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    res.redirect('/admin/posts');
  } catch (err) {
    console.error('deletePost error:', err);
    res.status(500).send('Error: ' + err.message);
  }
}

module.exports = {
  getHomePage,
  getPostDetail,
  getAdminPosts,
  getNewPostForm,
  createPost,
  getEditPostForm,
  updatePost,
  deletePost
};
