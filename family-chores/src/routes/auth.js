/**
 * Authentication routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { verifyPin } = require('../utils/pin');
const { generateToken } = require('../auth/jwt');
const { requireAuth } = require('../middleware/auth');
const avatars = require('../data/avatars.json');

/**
 * GET /api/users
 * List all users (id, name, avatar only) for login screen
 */
router.get('/api/users', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, avatar FROM users ORDER BY name'
    );

    // Enrich with avatar data
    const users = result.rows.map(user => {
      const avatarData = avatars.find(a => a.id === user.avatar) || null;
      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        avatarEmoji: avatarData?.emoji || null,
        avatarColor: avatarData?.color || null
      };
    });

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/avatars
 * List all available avatars
 */
router.get('/api/avatars', (req, res) => {
  res.json(avatars);
});

/**
 * POST /api/auth/login
 * Authenticate user with PIN
 * Body: { userId, pin }
 * Returns: { token, user }
 */
router.post('/api/auth/login', async (req, res) => {
  const { userId, pin } = req.body;

  if (!userId || !pin) {
    return res.status(400).json({ error: 'User ID and PIN are required' });
  }

  try {
    // Fetch user with PIN hash
    const result = await query(
      'SELECT id, household_id, name, role, pin_hash, avatar FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // If user has no PIN set, deny login
    if (!user.pin_hash) {
      return res.status(401).json({ error: 'PIN not set for this user' });
    }

    // Verify PIN
    const isValid = await verifyPin(pin, user.pin_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Get avatar data
    const avatarData = avatars.find(a => a.id === user.avatar) || null;

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        householdId: user.household_id,
        avatar: user.avatar,
        avatarEmoji: avatarData?.emoji || null,
        avatarColor: avatarData?.color || null
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Requires: Authorization header with JWT
 */
router.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, household_id, name, role, avatar FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const avatarData = avatars.find(a => a.id === user.avatar) || null;

    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      householdId: user.household_id,
      avatar: user.avatar,
      avatarEmoji: avatarData?.emoji || null,
      avatarColor: avatarData?.color || null
    });
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
