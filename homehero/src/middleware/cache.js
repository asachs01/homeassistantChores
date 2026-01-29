/**
 * Simple in-memory cache middleware with TTL
 * Provides caching for API responses to reduce database load
 */

// In-memory cache store
const cache = new Map();

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {*} data - The cached data
 * @property {number} expiry - Unix timestamp when entry expires
 */

/**
 * Default TTL values (in seconds)
 */
const TTL = {
  DASHBOARD: 30,      // Dashboard data - 30 seconds
  USER_LIST: 60,      // User lists - 60 seconds
  FAMILY_DASHBOARD: 30 // Family dashboard - 30 seconds
};

/**
 * Generate a cache key from request parameters
 * @param {string} prefix - Cache key prefix (e.g., 'dashboard', 'users')
 * @param {Object} params - Parameters to include in key
 * @returns {string} Cache key
 */
function generateKey(prefix, params = {}) {
  const paramStr = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return paramStr ? `${prefix}:${paramStr}` : prefix;
}

/**
 * Get an item from cache
 * @param {string} key - Cache key
 * @returns {*|null} Cached data or null if not found/expired
 */
function get(key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set an item in cache
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} ttlSeconds - Time to live in seconds
 */
function set(key, data, ttlSeconds) {
  cache.set(key, {
    data,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
}

/**
 * Delete an item from cache
 * @param {string} key - Cache key
 */
function del(key) {
  cache.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix
 * @param {string} prefix - Prefix to match (e.g., 'dashboard', 'users')
 */
function invalidatePrefix(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate cache entries for a specific user
 * @param {string} userId - User ID
 */
function invalidateUser(userId) {
  invalidatePrefix(`dashboard:userId:${userId}`);
}

/**
 * Invalidate cache entries for a specific household
 * @param {string} householdId - Household ID
 */
function invalidateHousehold(householdId) {
  invalidatePrefix(`family-dashboard:householdId:${householdId}`);
  invalidatePrefix(`dashboard:householdId:${householdId}`);
}

/**
 * Invalidate all user list caches
 */
function invalidateUserList() {
  invalidatePrefix('users');
}

/**
 * Clear entire cache
 */
function clearAll() {
  cache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
function getStats() {
  let validCount = 0;
  let expiredCount = 0;
  const now = Date.now();

  for (const entry of cache.values()) {
    if (now > entry.expiry) {
      expiredCount++;
    } else {
      validCount++;
    }
  }

  return {
    totalEntries: cache.size,
    validEntries: validCount,
    expiredEntries: expiredCount
  };
}

/**
 * Cleanup expired entries (call periodically)
 */
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiry) {
      cache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

/**
 * Express middleware factory for caching GET requests
 * @param {string} prefix - Cache key prefix
 * @param {number} ttlSeconds - Time to live in seconds
 * @param {Function} keyGenerator - Optional function to generate cache key from request
 * @returns {Function} Express middleware
 */
function cacheMiddleware(prefix, ttlSeconds, keyGenerator) {
  return function(req, res, next) {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    let key;
    if (keyGenerator) {
      key = generateKey(prefix, keyGenerator(req));
    } else {
      key = prefix;
    }

    // Check cache
    const cached = get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to cache the response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        set(key, data, ttlSeconds);
      }
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Middleware for caching user dashboard (per user)
 */
const cacheDashboard = cacheMiddleware(
  'dashboard',
  TTL.DASHBOARD,
  (req) => ({ userId: req.user?.userId })
);

/**
 * Middleware for caching family dashboard (per household)
 */
const cacheFamilyDashboard = cacheMiddleware(
  'family-dashboard',
  TTL.FAMILY_DASHBOARD,
  (req) => ({ householdId: req.user?.householdId })
);

/**
 * Middleware for caching user list (global)
 */
const cacheUserList = cacheMiddleware(
  'users',
  TTL.USER_LIST
);

module.exports = {
  // Core functions
  get,
  set,
  del,
  generateKey,
  clearAll,
  cleanup,
  getStats,

  // Invalidation functions
  invalidatePrefix,
  invalidateUser,
  invalidateHousehold,
  invalidateUserList,

  // TTL constants
  TTL,

  // Middleware
  cacheMiddleware,
  cacheDashboard,
  cacheFamilyDashboard,
  cacheUserList
};
