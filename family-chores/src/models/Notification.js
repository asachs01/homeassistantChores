/**
 * Notification model for database operations
 * Manages in-app notifications for users
 */

const { query } = require('../db/pool');

class Notification {
  /**
   * Create a new notification
   * @param {string} userId - The user UUID
   * @param {string} type - Notification type (task_complete, streak_milestone, streak_broken, balance_update, system)
   * @param {string} message - The notification message
   * @returns {Promise<Object>} The created notification
   */
  static async create(userId, type, message) {
    const result = await query(
      `INSERT INTO notifications (user_id, type, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, type, message]
    );

    return Notification.formatNotification(result.rows[0]);
  }

  /**
   * Find notifications by user with pagination
   * @param {string} userId - The user UUID
   * @param {Object} options - Pagination options { limit, offset, unreadOnly }
   * @returns {Promise<Object>} Notifications and pagination info
   */
  static async findByUser(userId, options = {}) {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    let sql = `
      SELECT *
      FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (unreadOnly) {
      sql += ` AND read = FALSE`;
    }

    sql += ` ORDER BY created_at DESC`;

    // Get total count for pagination
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count) || 0;

    // Add pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    return {
      notifications: result.rows.map(row => Notification.formatNotification(row)),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + result.rows.length < total
      }
    };
  }

  /**
   * Mark a notification as read
   * @param {string} id - The notification UUID
   * @returns {Promise<Object|null>} The updated notification or null
   */
  static async markAsRead(id) {
    const result = await query(
      `UPDATE notifications
       SET read = TRUE
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return Notification.formatNotification(result.rows[0]);
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - The user UUID
   * @returns {Promise<number>} Number of notifications marked as read
   */
  static async markAllAsRead(userId) {
    const result = await query(
      `UPDATE notifications
       SET read = TRUE
       WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    return result.rowCount;
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - The user UUID
   * @returns {Promise<number>} Unread count
   */
  static async getUnreadCount(userId) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    return parseInt(result.rows[0].count) || 0;
  }

  /**
   * Find a notification by ID
   * @param {string} id - The notification UUID
   * @returns {Promise<Object|null>} The notification or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return Notification.formatNotification(result.rows[0]);
  }

  /**
   * Delete old notifications (cleanup job)
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<number>} Number of deleted notifications
   */
  static async deleteOld(daysOld = 30) {
    const result = await query(
      `DELETE FROM notifications
       WHERE created_at < NOW() - INTERVAL '1 day' * $1`,
      [daysOld]
    );

    return result.rowCount;
  }

  /**
   * Format a database row to a notification object
   * @param {Object} row - Database row
   * @returns {Object} Formatted notification object
   */
  static formatNotification(row) {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      message: row.message,
      read: row.read,
      createdAt: row.created_at
    };
  }
}

module.exports = Notification;
