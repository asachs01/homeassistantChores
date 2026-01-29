/**
 * JWT utilities for token generation and verification
 */

const jwt = require('jsonwebtoken');

// Secret from environment variable with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const TOKEN_EXPIRY = '24h';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id, role, and household_id
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    role: user.role,
    householdId: user.household_id
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken
};
