/**
 * Notification routes
 * All endpoints require authentication
 */

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/notifications
 * List user's notifications with pagination
 * Query params: limit?, offset?, unreadOnly?
 */
router.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      unreadOnly: req.query.unreadOnly === 'true'
    };

    // Validate limit
    if (options.limit > 100) {
      options.limit = 100;
    }

    const result = await Notification.findByUser(req.user.userId, options);

    res.json(result);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read
 */
router.post('/api/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    // Verify notification exists and belongs to user
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await Notification.markAsRead(req.params.id);

    res.json(updated);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all user's notifications as read
 */
router.post('/api/notifications/read-all', requireAuth, async (req, res) => {
  try {
    const count = await Notification.markAllAsRead(req.user.userId);

    res.json({
      success: true,
      markedAsRead: count
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/api/notifications/unread-count', requireAuth, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.userId);

    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

module.exports = router;
