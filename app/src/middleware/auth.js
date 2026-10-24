const { verifyJwtToken } = require('../utils/security');

// Require authentication for admin routes
function requireAuth(req, res, next) {
  let token = req.cookies && req.cookies.jwt_token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    return res.redirect('/login?error=' + encodeURIComponent('Vui lòng đăng nhập để tiếp tục.'));
  }

  const decoded = verifyJwtToken(token);
  if (!decoded) {
    res.clearCookie('jwt_token');
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ success: false, message: 'Session expired' });
    }
    return res.redirect('/login?error=' + encodeURIComponent('Phiên đăng nhập đã hết hạn.'));
  }

  req.user = decoded;
  res.locals.currentUser = decoded;
  next();
}

// Attach user to res.locals if logged in
function optionalAuth(req, res, next) {
  const token = req.cookies && req.cookies.jwt_token;
  if (token) {
    const decoded = verifyJwtToken(token);
    if (decoded) {
      req.user = decoded;
      res.locals.currentUser = decoded;
    } else {
      res.locals.currentUser = null;
    }
  } else {
    res.locals.currentUser = null;
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
