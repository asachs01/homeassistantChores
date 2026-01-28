/**
 * Rate limiting middleware using express-rate-limit
 * Provides protection against brute force attacks and API abuse
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-7', // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  // Skip rate limiting for health and status endpoints
  skip: (req) => {
    const skipPaths = ['/api/health', '/api/db/status', '/api/cache/status'];
    return skipPaths.includes(req.path);
  },
  // Use IP address as the key
  keyGenerator: (req) => {
    // Support for proxies (X-Forwarded-For header)
    return req.ip || req.connection.remoteAddress;
  },
  // Handler for when rate limit is exceeded
  handler: (req, res, next, options) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json(options.message);
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 attempts per minute per IP
 * Helps prevent brute force PIN attacks
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts',
    message: 'Too many login attempts. Please wait a minute before trying again.',
    retryAfter: 60 // seconds
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res, next, options) => {
    console.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

/**
 * Rate limiter for onboarding endpoints
 * Limits: 10 requests per minute per IP
 * Prevents abuse during household setup
 */
const onboardingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Too many onboarding requests. Please slow down.',
    retryAfter: 60
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res, next, options) => {
    console.warn(`Onboarding rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

/**
 * Rate limiter for write operations (POST, PUT, DELETE)
 * Limits: 30 requests per minute per IP
 */
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many write operations',
    message: 'You are making too many changes. Please slow down.',
    retryAfter: 60
  },
  // Only apply to write methods
  skip: (req) => {
    return req.method === 'GET';
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res, next, options) => {
    console.warn(`Write rate limit exceeded for IP: ${req.ip}, method: ${req.method}`);
    res.status(429).json(options.message);
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  onboardingLimiter,
  writeLimiter
};
