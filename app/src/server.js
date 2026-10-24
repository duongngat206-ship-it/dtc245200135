const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { pool, testConnection } = require('./config/db');
const { initAdminUser } = require('./utils/security');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');
const { optionalAuth } = require('./middleware/auth');

const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Metrics and auth middleware
app.use(metricsMiddleware);
app.use(optionalAuth);

// Health check and metrics endpoints
app.get('/metrics', metricsEndpoint);
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'UP', service: 'blog_cms_app', timestamp: new Date() });
  } catch (err) {
    res.status(503).json({ status: 'DOWN', error: err.message });
  }
});

// App routes
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).send('Internal Server Error: ' + err.message);
});

async function startServer() {
  try {
    console.log('[App] Starting Blog/CMS server...');
    await testConnection();
    await initAdminUser(pool);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening at http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('[Fatal]', err.message);
    process.exit(1);
  }
}

startServer();
