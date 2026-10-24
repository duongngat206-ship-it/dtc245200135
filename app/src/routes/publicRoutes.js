const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');

// Trang chủ & đọc bài viết
router.get('/', postController.getHomePage);
router.get('/posts/:slug', postController.getPostDetail);

// Xác thực tài khoản (Auth)
router.get('/login', authController.getLoginPage);
router.post('/login', authController.handleLogin);
router.get('/logout', authController.handleLogout);

module.exports = router;
