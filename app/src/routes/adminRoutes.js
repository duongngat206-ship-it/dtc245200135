const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const postController = require('../controllers/postController');
const categoryController = require('../controllers/categoryController');
const authController = require('../controllers/authController');

// Mọi route trong admin đều phải qua requireAuth (xác thực JWT)
router.use(requireAuth);

// 1. Dashboard tổng quan
router.get('/', authController.getAdminDashboard);

// 2. Quản lý Bài viết (Posts CRUD)
router.get('/posts', postController.getAdminPosts);
router.get('/posts/new', postController.getNewPostForm);
router.post('/posts', postController.createPost);
router.get('/posts/:id/edit', postController.getEditPostForm);
router.post('/posts/:id/edit', postController.updatePost);
router.post('/posts/:id/delete', postController.deletePost);

// 3. Quản lý Danh mục (Categories CRUD)
router.get('/categories', categoryController.getAdminCategories);
router.post('/categories', categoryController.createCategory);
router.post('/categories/:id/delete', categoryController.deleteCategory);

// 4. Quản lý Người dùng (Users CRUD)
router.get('/users', authController.getAdminUsers);
router.post('/users', authController.createUser);

module.exports = router;
