/**
 * Schedule utilities for task scheduling
 */

/**
 * Check if a task is scheduled for a given date
 * Uses the schedule JSONB array of day numbers (0=Sunday, 6=Saturday)
 *
 * @param {Object} task - The task object with schedule property
 * @param {Date|string} date - The date to check (defaults to today)
 * @returns {boolean} True if task is scheduled for the given date
 */
function isScheduledForDate(task, date = new Date()) {
  // If no schedule defined, task is always available
  if (!task.schedule || !Array.isArray(task.schedule) || task.schedule.length === 0) {
    return true;
  }

  // Ensure we have a Date object
  const checkDate = date instanceof Date ? date : new Date(date);

  // Get day of week (0=Sunday, 6=Saturday)
  const dayOfWeek = checkDate.getDay();

  // Check if the day is in the schedule array
  return task.schedule.includes(dayOfWeek);
}

/**
 * Get the day name for a day number
 * @param {number} dayNumber - Day number (0=Sunday, 6=Saturday)
 * @returns {string} Day name
 */
function getDayName(dayNumber) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber] || 'Unknown';
}

/**
 * Get day numbers from day names
 * @param {string[]} dayNames - Array of day names
 * @returns {number[]} Array of day numbers
 */
function getDayNumbers(dayNames) {
  const dayMap = {
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6
  };

  return dayNames
    .map(name => dayMap[name.toLowerCase()])
    .filter(num => num !== undefined);
}

module.exports = {
  isScheduledForDate,
  getDayName,
  getDayNumbers
};
