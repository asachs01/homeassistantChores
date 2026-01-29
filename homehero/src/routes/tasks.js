/**
 * Task routes
 * All endpoints require authentication. Non-GET require admin role.
 */

const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { validateTask } = require('../validators/task');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/**
 * POST /api/tasks
 * Create a new task (admin only)
 * Body: { name, type, description?, icon?, dollarValue?, schedule?, assignedUsers? }
 */
router.post('/api/tasks', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = validateTask(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const task = await Task.create(req.user.householdId, req.body);

    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * GET /api/tasks
 * List all tasks for the household
 * Query params: type?, userId?
 */
router.get('/api/tasks', requireAuth, async (req, res) => {
  try {
    const filters = {};

    if (req.query.type) {
      filters.type = req.query.type;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId;
    }

    const tasks = await Task.findAll(req.user.householdId, filters);

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 */
router.get('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify task belongs to user's household
    if (task.householdId !== req.user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * PUT /api/tasks/:id
 * Update a task (admin only)
 * Body: { name?, type?, description?, icon?, dollarValue?, schedule?, assignedUsers? }
 */
router.put('/api/tasks/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Verify task exists and belongs to user's household
    const existingTask = await Task.findById(req.params.id);

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (existingTask.householdId !== req.user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate update data
    const validation = validateTask(req.body, true);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const task = await Task.update(req.params.id, req.body);

    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task (admin only)
 */
router.delete('/api/tasks/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Verify task exists and belongs to user's household
    const householdId = await Task.getHouseholdId(req.params.id);

    if (!householdId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (householdId !== req.user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Task.delete(req.params.id);

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

/**
 * GET /api/tasks/user/:userId
 * Get tasks assigned to a specific user for a date
 * Query params: date? (ISO date string, defaults to today)
 */
router.get('/api/tasks/user/:userId', requireAuth, async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();

    // Validate date
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const tasks = await Task.getTasksForUser(req.params.userId, date);

    // Filter to only return tasks from user's household
    const filteredTasks = tasks.filter(task => task.householdId === req.user.householdId);

    res.json(filteredTasks);
  } catch (err) {
    console.error('Error fetching user tasks:', err);
    res.status(500).json({ error: 'Failed to fetch user tasks' });
  }
});

module.exports = router;
