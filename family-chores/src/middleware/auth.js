/**
 * Authentication middleware
 */

const { verifyToken } = require('../auth/jwt');

/**
 * Middleware to require authentication
 * Extracts JWT from Authorization header and attaches user to req.user
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  // Expect "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization header format' });
  }

  const token = parts[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach user info to request
  req.user = {
    userId: decoded.userId,
    role: decoded.role,
    householdId: decoded.householdId
  };

  next();
}

/**
 * Middleware to require admin (parent) role
 * Must be used after requireAuth
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
