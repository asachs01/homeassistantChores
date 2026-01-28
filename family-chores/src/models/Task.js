/**
 * Task model for database operations
 */

const { query } = require('../db/pool');
const { isScheduledForDate } = require('../utils/schedule');

class Task {
  /**
   * Create a new task
   * @param {string} householdId - The household UUID
   * @param {Object} data - Task data
   * @returns {Promise<Object>} The created task
   */
  static async create(householdId, data) {
    const {
      name,
      description = null,
      icon = null,
      type,
      dollarValue = 0,
      schedule = null,
      timeWindow = null,
      assignedUsers = []
    } = data;

    const result = await query(
      `INSERT INTO tasks (household_id, name, description, icon, type, dollar_value, schedule, time_window)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [householdId, name, description, icon, type, dollarValue, JSON.stringify(schedule), JSON.stringify(timeWindow)]
    );

    const task = Task.formatTask(result.rows[0]);

    // Assign users if provided
    if (assignedUsers.length > 0) {
      await Task.assignUsers(task.id, assignedUsers);
      task.assignedUsers = assignedUsers;
    }

    return task;
  }

  /**
   * Find all tasks for a household with optional filters
   * @param {string} householdId - The household UUID
   * @param {Object} filters - Optional filters { type, userId }
   * @returns {Promise<Object[]>} Array of tasks
   */
  static async findAll(householdId, filters = {}) {
    let sql = `
      SELECT DISTINCT t.*
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      WHERE t.household_id = $1
    `;
    const params = [householdId];
    let paramIndex = 2;

    if (filters.type) {
      sql += ` AND t.type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.userId) {
      sql += ` AND ta.user_id = $${paramIndex}`;
      params.push(filters.userId);
      paramIndex++;
    }

    sql += ' ORDER BY t.created_at DESC';

    const result = await query(sql, params);

    // Fetch assigned users for each task
    const tasks = await Promise.all(
      result.rows.map(async (row) => {
        const task = Task.formatTask(row);
        task.assignedUsers = await Task.getAssignedUsers(task.id);
        return task;
      })
    );

    return tasks;
  }

  /**
   * Find a task by ID
   * @param {string} id - The task UUID
   * @returns {Promise<Object|null>} The task or null if not found
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const task = Task.formatTask(result.rows[0]);
    task.assignedUsers = await Task.getAssignedUsers(task.id);
    return task;
  }

  /**
   * Update a task
   * @param {string} id - The task UUID
   * @param {Object} data - Fields to update
   * @returns {Promise<Object|null>} The updated task or null if not found
   */
  static async update(id, data) {
    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      name: 'name',
      description: 'description',
      icon: 'icon',
      type: 'type',
      dollarValue: 'dollar_value',
      schedule: 'schedule',
      timeWindow: 'time_window'
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        let value = data[key];
        // JSON stringify schedule and timeWindow
        if (key === 'schedule' || key === 'timeWindow') {
          value = JSON.stringify(value);
        }
        updates.push(`${column} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0 && !data.assignedUsers) {
      // Nothing to update
      return Task.findById(id);
    }

    let task = null;

    if (updates.length > 0) {
      params.push(id);
      const result = await query(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        return null;
      }

      task = Task.formatTask(result.rows[0]);
    } else {
      task = await Task.findById(id);
      if (!task) return null;
    }

    // Update assigned users if provided
    if (data.assignedUsers !== undefined) {
      await Task.assignUsers(id, data.assignedUsers);
      task.assignedUsers = data.assignedUsers;
    } else {
      task.assignedUsers = await Task.getAssignedUsers(id);
    }

    return task;
  }

  /**
   * Delete a task
   * @param {string} id - The task UUID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  }

  /**
   * Assign users to a task (replaces existing assignments)
   * @param {string} taskId - The task UUID
   * @param {string[]} userIds - Array of user UUIDs
   * @returns {Promise<void>}
   */
  static async assignUsers(taskId, userIds) {
    // Remove existing assignments
    await query(
      'DELETE FROM task_assignments WHERE task_id = $1',
      [taskId]
    );

    // Add new assignments
    if (userIds.length > 0) {
      const values = userIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await query(
        `INSERT INTO task_assignments (task_id, user_id) VALUES ${values}`,
        [taskId, ...userIds]
      );
    }
  }

  /**
   * Get all users assigned to a task
   * @param {string} taskId - The task UUID
   * @returns {Promise<string[]>} Array of user UUIDs
   */
  static async getAssignedUsers(taskId) {
    const result = await query(
      'SELECT user_id FROM task_assignments WHERE task_id = $1',
      [taskId]
    );

    return result.rows.map(row => row.user_id);
  }

  /**
   * Get tasks assigned to a user for a specific date
   * @param {string} userId - The user UUID
   * @param {Date|string} date - The date to check (defaults to today)
   * @returns {Promise<Object[]>} Array of tasks scheduled for the date
   */
  static async getTasksForUser(userId, date = new Date()) {
    const result = await query(
      `SELECT t.*
       FROM tasks t
       JOIN task_assignments ta ON t.id = ta.task_id
       WHERE ta.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    // Filter tasks by schedule
    const tasks = result.rows
      .map(row => Task.formatTask(row))
      .filter(task => isScheduledForDate(task, date));

    // Fetch assigned users for each task
    for (const task of tasks) {
      task.assignedUsers = await Task.getAssignedUsers(task.id);
    }

    return tasks;
  }

  /**
   * Get the household ID for a task
   * @param {string} taskId - The task UUID
   * @returns {Promise<string|null>} The household UUID or null
   */
  static async getHouseholdId(taskId) {
    const result = await query(
      'SELECT household_id FROM tasks WHERE id = $1',
      [taskId]
    );

    return result.rows.length > 0 ? result.rows[0].household_id : null;
  }

  /**
   * Format a database row to a task object
   * @param {Object} row - Database row
   * @returns {Object} Formatted task object
   */
  static formatTask(row) {
    return {
      id: row.id,
      householdId: row.household_id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      type: row.type,
      dollarValue: parseFloat(row.dollar_value) || 0,
      schedule: row.schedule || [],
      timeWindow: row.time_window,
      createdAt: row.created_at
    };
  }
}

module.exports = Task;
