/**
 * API client helper for E2E tests
 * Provides convenient methods for making API calls with proper authentication
 */

const { request } = require('@playwright/test');

/**
 * Create an API client for making authenticated requests
 * @param {string} baseURL - Base URL of the API
 * @returns {Object} API client object
 */
async function createApiClient(baseURL) {
  const context = await request.newContext({
    baseURL
  });

  let authToken = null;
  let currentUser = null;

  return {
    /**
     * Set authentication token for subsequent requests
     * @param {string} token - JWT token
     * @param {Object} user - User object
     */
    setAuth(token, user) {
      authToken = token;
      currentUser = user;
    },

    /**
     * Clear authentication
     */
    clearAuth() {
      authToken = null;
      currentUser = null;
    },

    /**
     * Get current user
     */
    getCurrentUser() {
      return currentUser;
    },

    /**
     * Get auth headers
     */
    getAuthHeaders() {
      return authToken ? { Authorization: `Bearer ${authToken}` } : {};
    },

    /**
     * Make a GET request
     * @param {string} path - API path
     * @param {Object} options - Additional options
     */
    async get(path, options = {}) {
      const response = await context.get(path, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });
      return response;
    },

    /**
     * Make a POST request
     * @param {string} path - API path
     * @param {Object} data - Request body
     * @param {Object} options - Additional options
     */
    async post(path, data, options = {}) {
      const response = await context.post(path, {
        ...options,
        data,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });
      return response;
    },

    /**
     * Make a PUT request
     * @param {string} path - API path
     * @param {Object} data - Request body
     * @param {Object} options - Additional options
     */
    async put(path, data, options = {}) {
      const response = await context.put(path, {
        ...options,
        data,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });
      return response;
    },

    /**
     * Make a DELETE request
     * @param {string} path - API path
     * @param {Object} options - Additional options
     */
    async delete(path, options = {}) {
      const response = await context.delete(path, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });
      return response;
    },

    /**
     * Login a user
     * @param {string} userId - User ID
     * @param {string} pin - User PIN
     */
    async login(userId, pin) {
      const response = await this.post('/api/auth/login', { userId, pin });
      if (response.ok()) {
        const data = await response.json();
        this.setAuth(data.token, data.user);
        return data;
      }
      throw new Error(`Login failed: ${response.status()}`);
    },

    /**
     * Create a household
     * @param {Object} data - Household data
     */
    async createHousehold(data) {
      const response = await this.post('/api/onboarding/household', data);
      if (response.ok()) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(`Create household failed: ${error.error}`);
    },

    /**
     * Create a user
     * @param {Object} data - User data including householdId
     */
    async createUser(data) {
      const response = await this.post('/api/onboarding/user', data);
      if (response.ok()) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(`Create user failed: ${error.error}`);
    },

    /**
     * Create a task
     * @param {Object} data - Task data
     */
    async createTask(data) {
      const response = await this.post('/api/tasks', data);
      if (response.ok()) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(`Create task failed: ${error.error}`);
    },

    /**
     * Create a routine
     * @param {Object} data - Routine data
     */
    async createRoutine(data) {
      const response = await this.post('/api/routines', data);
      if (response.ok()) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(`Create routine failed: ${error.error}`);
    },

    /**
     * Add task to routine
     * @param {string} routineId - Routine ID
     * @param {string} taskId - Task ID
     * @param {number} position - Position in routine
     */
    async addTaskToRoutine(routineId, taskId, position = 0) {
      const response = await this.post(`/api/routines/${routineId}/tasks`, {
        taskId,
        position
      });
      if (response.ok()) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(`Add task to routine failed: ${error.error}`);
    },

    /**
     * Complete a task
     * @param {string} taskId - Task ID
     */
    async completeTask(taskId) {
      const response = await this.post(`/api/dashboard/complete/${taskId}`);
      if (response.ok()) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(`Complete task failed: ${error.error}`);
    },

    /**
     * Get dashboard data
     */
    async getDashboard() {
      const response = await this.get('/api/dashboard');
      if (response.ok()) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(`Get dashboard failed: ${error.error}`);
    },

    /**
     * Dispose the context
     */
    async dispose() {
      await context.dispose();
    }
  };
}

module.exports = { createApiClient };
