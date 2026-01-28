/**
 * Test data fixtures for E2E tests
 */

// Generate unique identifiers for test isolation
const testId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

/**
 * Generate test household data
 */
function generateHousehold(suffix = '') {
  return {
    name: `Test Household ${suffix || testId()}`
  };
}

/**
 * Generate test parent user data
 */
function generateParent(suffix = '') {
  return {
    name: `Test Parent ${suffix || testId()}`,
    role: 'parent',
    pin: '1234',
    avatar: 'robot'
  };
}

/**
 * Generate test child user data
 */
function generateChild(suffix = '') {
  return {
    name: `Test Child ${suffix || testId()}`,
    role: 'child',
    pin: '5678',
    avatar: 'unicorn'
  };
}

/**
 * Generate test task data
 */
function generateTask(suffix = '', type = 'recurring') {
  return {
    name: `Test Task ${suffix || testId()}`,
    type,
    description: 'Test task description',
    icon: 'star',
    dollarValue: 1.50,
    schedule: type === 'recurring' ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] : []
  };
}

/**
 * Generate test routine data
 */
function generateRoutine(suffix = '') {
  return {
    name: `Morning Routine ${suffix || testId()}`
  };
}

/**
 * Common test PIN values
 */
const TEST_PINS = {
  parent: '1234',
  child: '5678',
  invalid: '0000'
};

/**
 * Avatar IDs that should exist in the system
 */
const AVATARS = {
  robot: 'robot',
  unicorn: 'unicorn',
  dinosaur: 'dinosaur',
  cat: 'cat'
};

module.exports = {
  testId,
  generateHousehold,
  generateParent,
  generateChild,
  generateTask,
  generateRoutine,
  TEST_PINS,
  AVATARS
};
