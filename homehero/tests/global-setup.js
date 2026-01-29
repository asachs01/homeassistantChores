/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */

const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  const { baseURL } = config.projects[0].use;

  console.log('\n[Setup] Starting global test setup...');
  console.log(`[Setup] Base URL: ${baseURL}`);

  // Wait for server to be ready
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let retries = 0;
  const maxRetries = 30;

  while (retries < maxRetries) {
    try {
      const response = await page.goto(`${baseURL}/api/health`, {
        timeout: 5000
      });

      if (response && response.ok()) {
        const health = await response.json();
        console.log(`[Setup] Server is ready: ${health.status}`);
        break;
      }
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error('[Setup] Server failed to start');
        throw new Error('Server did not become ready in time');
      }
      console.log(`[Setup] Waiting for server... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  await browser.close();
  console.log('[Setup] Global setup complete\n');
}

module.exports = globalSetup;
