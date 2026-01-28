/**
 * E2E tests for health and monitoring endpoints
 * Tests: Health check, database status, cache status
 */

const { test, expect } = require('@playwright/test');
const { createApiClient } = require('./helpers/api-client');

test.describe('Health and Monitoring', () => {
  let api;

  test.beforeEach(async ({ baseURL }) => {
    api = await createApiClient(baseURL);
  });

  test.afterEach(async () => {
    await api.dispose();
  });

  test('should return health status', async () => {
    const response = await api.get('/api/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const health = await response.json();
    expect(health.status).toBe('ok');
    expect(health).toHaveProperty('timestamp');

    // Timestamp should be a valid ISO date
    const timestamp = new Date(health.timestamp);
    expect(timestamp.getTime()).not.toBeNaN();
  });

  test('should return database status', async () => {
    const response = await api.get('/api/db/status');

    expect(response.ok()).toBeTruthy();

    const status = await response.json();
    expect(status).toHaveProperty('connected');
    expect(status).toHaveProperty('timestamp');

    // Pool status should be included
    if (status.pool) {
      expect(status.pool).toHaveProperty('total');
      expect(status.pool).toHaveProperty('idle');
      expect(status.pool).toHaveProperty('waiting');
    }
  });

  test('should return cache status', async () => {
    const response = await api.get('/api/cache/status');

    expect(response.ok()).toBeTruthy();

    const status = await response.json();
    expect(status).toHaveProperty('cache');
    expect(status).toHaveProperty('timestamp');
  });

  test('health endpoints should not require authentication', async () => {
    // These endpoints should be accessible without auth
    const endpoints = ['/api/health', '/api/db/status', '/api/cache/status'];

    for (const endpoint of endpoints) {
      const response = await api.get(endpoint);
      expect(response.ok()).toBeTruthy();
    }
  });
});

test.describe('Error Handling', () => {
  let api;

  test.beforeEach(async ({ baseURL }) => {
    api = await createApiClient(baseURL);
  });

  test.afterEach(async () => {
    await api.dispose();
  });

  test('should return 404 for non-existent API routes', async () => {
    const response = await api.get('/api/nonexistent-endpoint');

    expect(response.status()).toBe(404);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('Not found');
  });

  test('should return proper JSON for errors', async () => {
    const response = await api.get('/api/tasks'); // Without auth

    expect(response.status()).toBe(401);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');

    const error = await response.json();
    expect(error).toHaveProperty('error');
  });

  test('should handle malformed JSON gracefully', async ({ request }) => {
    const response = await request.post('/api/onboarding/household', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: 'not valid json'
    });

    // Should return 400 Bad Request
    expect(response.status()).toBe(400);
  });
});
