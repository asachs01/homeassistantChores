/**
 * Completion model for database operations
 * Tracks task completions and provides streak data
 */

const { query } = require('../db/pool');

// Time window in minutes for undo functionality
const UNDO_WINDOW_MINUTES = 5;

class Completion {
  /**
   * Create a new completion record
   * @param {string} taskId - The task UUID
   * @param {string} userId - The user UUID
   * @param {Date|string} date - The completion date (defaults to today)
   * @returns {Promise<Object>} The created completion
   */
  static async create(taskId, userId, date = new Date()) {
    const completionDate = date instanceof Date
      ? date.toISOString().split('T')[0]
      : date;

    const result = await query(
      `INSERT INTO completions (task_id, user_id, completion_date)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, userId, completionDate]
    );

    const completion = Completion.formatCompletion(result.rows[0]);

    // Update balance for the user based on task dollar value
    await Completion.updateBalance(taskId, userId);

    return completion;
  }

  /**
   * Update user balance when task is completed
   * @param {string} taskId - The task UUID
   * @param {string} userId - The user UUID
   */
  static async updateBalance(taskId, userId) {
    // Get task dollar value
    const taskResult = await query(
      'SELECT dollar_value, name FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) return;

    const dollarValue = parseFloat(taskResult.rows[0].dollar_value) || 0;
    const taskName = taskResult.rows[0].name;

    if (dollarValue <= 0) return;

    // Ensure balance record exists
    await query(
      `INSERT INTO balances (user_id, current_balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    // Update balance
    await query(
      `UPDATE balances SET current_balance = current_balance + $1 WHERE user_id = $2`,
      [dollarValue, userId]
    );

    // Record transaction
    await query(
      `INSERT INTO balance_transactions (user_id, amount, type, description)
       VALUES ($1, $2, 'earned', $3)`,
      [userId, dollarValue, `Completed: ${taskName}`]
    );
  }

  /**
   * Find completions by user and date
   * @param {string} userId - The user UUID
   * @param {Date|string} date - The date to check (defaults to today)
   * @returns {Promise<Object[]>} Array of completions
   */
  static async findByUserAndDate(userId, date = new Date()) {
    const completionDate = date instanceof Date
      ? date.toISOString().split('T')[0]
      : date;

    const result = await query(
      `SELECT c.*, t.name as task_name, t.icon as task_icon
       FROM completions c
       JOIN tasks t ON c.task_id = t.id
       WHERE c.user_id = $1 AND c.completion_date = $2
       ORDER BY c.completed_at DESC`,
      [userId, completionDate]
    );

    return result.rows.map(row => ({
      ...Completion.formatCompletion(row),
      taskName: row.task_name,
      taskIcon: row.task_icon
    }));
  }

  /**
   * Find completions by task and date
   * @param {string} taskId - The task UUID
   * @param {Date|string} date - The date to check (defaults to today)
   * @returns {Promise<Object[]>} Array of completions
   */
  static async findByTaskAndDate(taskId, date = new Date()) {
    const completionDate = date instanceof Date
      ? date.toISOString().split('T')[0]
      : date;

    const result = await query(
      `SELECT c.*, u.name as user_name
       FROM completions c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1 AND c.completion_date = $2
       ORDER BY c.completed_at DESC`,
      [taskId, completionDate]
    );

    return result.rows.map(row => ({
      ...Completion.formatCompletion(row),
      userName: row.user_name
    }));
  }

  /**
   * Find a completion by ID
   * @param {string} id - The completion UUID
   * @returns {Promise<Object|null>} The completion or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM completions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return Completion.formatCompletion(result.rows[0]);
  }

  /**
   * Undo a completion (soft delete within time window)
   * @param {string} id - The completion UUID
   * @returns {Promise<{success: boolean, error?: string}>} Result of undo operation
   */
  static async undo(id) {
    // Find the completion
    const completion = await Completion.findById(id);

    if (!completion) {
      return { success: false, error: 'Completion not found' };
    }

    // Check if within undo window
    const completedAt = new Date(completion.completedAt);
    const now = new Date();
    const minutesElapsed = (now - completedAt) / (1000 * 60);

    if (minutesElapsed > UNDO_WINDOW_MINUTES) {
      return {
        success: false,
        error: `Undo window expired (${UNDO_WINDOW_MINUTES} minutes)`
      };
    }

    // Get task dollar value to reverse
    const taskResult = await query(
      'SELECT dollar_value, name FROM tasks WHERE id = $1',
      [completion.taskId]
    );

    if (taskResult.rows.length > 0) {
      const dollarValue = parseFloat(taskResult.rows[0].dollar_value) || 0;
      const taskName = taskResult.rows[0].name;

      if (dollarValue > 0) {
        // Reverse the balance
        await query(
          `UPDATE balances SET current_balance = current_balance - $1 WHERE user_id = $2`,
          [dollarValue, completion.userId]
        );

        // Record reversal transaction
        await query(
          `INSERT INTO balance_transactions (user_id, amount, type, description)
           VALUES ($1, $2, 'adjustment', $3)`,
          [completion.userId, -dollarValue, `Undone: ${taskName}`]
        );
      }
    }

    // Delete the completion
    await query('DELETE FROM completions WHERE id = $1', [id]);

    return { success: true };
  }

  /**
   * Check if a task is completed by user for a date
   * @param {string} taskId - The task UUID
   * @param {string} userId - The user UUID
   * @param {Date|string} date - The date to check
   * @returns {Promise<Object|null>} The completion if exists, null otherwise
   */
  static async isCompleted(taskId, userId, date = new Date()) {
    const completionDate = date instanceof Date
      ? date.toISOString().split('T')[0]
      : date;

    const result = await query(
      `SELECT * FROM completions
       WHERE task_id = $1 AND user_id = $2 AND completion_date = $3
       LIMIT 1`,
      [taskId, userId, completionDate]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return Completion.formatCompletion(result.rows[0]);
  }

  /**
   * Get streak data for a user and routine
   * @param {string} userId - The user UUID
   * @param {string} routineId - The routine UUID
   * @returns {Promise<Object>} Streak data { currentCount, bestCount, lastCompletionDate }
   */
  static async getStreakData(userId, routineId) {
    // Ensure streak record exists
    await query(
      `INSERT INTO streaks (user_id, routine_id, current_count, best_count)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (user_id, routine_id) DO NOTHING`,
      [userId, routineId]
    );

    const result = await query(
      `SELECT current_count, best_count, last_completion_date
       FROM streaks
       WHERE user_id = $1 AND routine_id = $2`,
      [userId, routineId]
    );

    if (result.rows.length === 0) {
      return { currentCount: 0, bestCount: 0, lastCompletionDate: null };
    }

    const row = result.rows[0];
    return {
      currentCount: row.current_count,
      bestCount: row.best_count,
      lastCompletionDate: row.last_completion_date
    };
  }

  /**
   * Update streak for a user and routine (call when routine is completed)
   * @param {string} userId - The user UUID
   * @param {string} routineId - The routine UUID
   * @param {Date|string} date - The completion date
   * @returns {Promise<Object>} Updated streak data
   */
  static async updateStreak(userId, routineId, date = new Date()) {
    const completionDate = date instanceof Date
      ? date.toISOString().split('T')[0]
      : date;

    // Get current streak data
    const currentStreak = await Completion.getStreakData(userId, routineId);

    // Calculate if this continues the streak
    let newCount = 1;
    if (currentStreak.lastCompletionDate) {
      const lastDate = new Date(currentStreak.lastCompletionDate);
      const currentDate = new Date(completionDate);
      const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day, increment streak
        newCount = currentStreak.currentCount + 1;
      } else if (daysDiff === 0) {
        // Same day, keep current count
        newCount = currentStreak.currentCount;
      }
      // If daysDiff > 1, streak resets to 1
    }

    const newBest = Math.max(newCount, currentStreak.bestCount);

    await query(
      `UPDATE streaks
       SET current_count = $1, best_count = $2, last_completion_date = $3
       WHERE user_id = $4 AND routine_id = $5`,
      [newCount, newBest, completionDate, userId, routineId]
    );

    return {
      currentCount: newCount,
      bestCount: newBest,
      lastCompletionDate: completionDate
    };
  }

  /**
   * Get user's total streak count (sum of all routine streaks)
   * @param {string} userId - The user UUID
   * @returns {Promise<number>} Total streak count
   */
  static async getTotalStreakCount(userId) {
    const result = await query(
      `SELECT COALESCE(SUM(current_count), 0) as total_streak
       FROM streaks
       WHERE user_id = $1`,
      [userId]
    );

    return parseInt(result.rows[0].total_streak) || 0;
  }

  /**
   * Get user's current balance
   * @param {string} userId - The user UUID
   * @returns {Promise<number>} Current balance
   */
  static async getBalance(userId) {
    // Ensure balance record exists
    await query(
      `INSERT INTO balances (user_id, current_balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    const result = await query(
      'SELECT current_balance FROM balances WHERE user_id = $1',
      [userId]
    );

    return parseFloat(result.rows[0]?.current_balance) || 0;
  }

  /**
   * Check if completion is within undo window
   * @param {string} id - The completion UUID
   * @returns {Promise<boolean>} True if can be undone
   */
  static async canUndo(id) {
    const completion = await Completion.findById(id);

    if (!completion) return false;

    const completedAt = new Date(completion.completedAt);
    const now = new Date();
    const minutesElapsed = (now - completedAt) / (1000 * 60);

    return minutesElapsed <= UNDO_WINDOW_MINUTES;
  }

  /**
   * Format a database row to a completion object
   * @param {Object} row - Database row
   * @returns {Object} Formatted completion object
   */
  static formatCompletion(row) {
    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      completedAt: row.completed_at,
      completionDate: row.completion_date
    };
  }
}

module.exports = Completion;
