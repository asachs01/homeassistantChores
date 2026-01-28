/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */

async function globalTeardown(config) {
  console.log('\n[Teardown] Global test teardown complete');
}

module.exports = globalTeardown;
