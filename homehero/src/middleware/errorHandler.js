/**
 * Error handling middleware for Express
 * Provides structured error responses and prevents stack trace leaks in production
 */

/**
 * Custom error class with HTTP status code support
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distinguishes operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error factory functions
 */
const errors = {
  badRequest: (message = 'Bad request', code = 'BAD_REQUEST') =>
    new AppError(message, 400, code),

  unauthorized: (message = 'Unauthorized', code = 'UNAUTHORIZED') =>
    new AppError(message, 401, code),

  forbidden: (message = 'Access denied', code = 'FORBIDDEN') =>
    new AppError(message, 403, code),

  notFound: (message = 'Resource not found', code = 'NOT_FOUND') =>
    new AppError(message, 404, code),

  conflict: (message = 'Resource conflict', code = 'CONFLICT') =>
    new AppError(message, 409, code),

  validation: (message = 'Validation failed', details = null) => {
    const error = new AppError(message, 400, 'VALIDATION_ERROR');
    error.details = details;
    return error;
  },

  internal: (message = 'Internal server error', code = 'INTERNAL_ERROR') =>
    new AppError(message, 500, code),

  serviceUnavailable: (message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE') =>
    new AppError(message, 503, code)
};

/**
 * Determine if running in development/test mode
 */
function isDevelopment() {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' || env === 'test';
}

/**
 * Format error response for client
 * @param {Error} err - The error object
 * @param {boolean} includeStack - Whether to include stack trace
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(err, includeStack = false) {
  const response = {
    error: err.message || 'An unexpected error occurred',
    code: err.code || 'UNKNOWN_ERROR'
  };

  // Include validation details if present
  if (err.details) {
    response.details = err.details;
  }

  // Include stack trace in development only
  if (includeStack && err.stack) {
    response.stack = err.stack.split('\n').map(line => line.trim());
  }

  return response;
}

/**
 * Log error with appropriate level
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 */
function logError(err, req) {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || null,
    statusCode: err.statusCode || 500,
    message: err.message,
    code: err.code || null
  };

  // Log full stack for server errors
  if (!err.statusCode || err.statusCode >= 500) {
    console.error('Server Error:', logData, '\nStack:', err.stack);
  } else if (err.statusCode >= 400) {
    // Log client errors at warning level
    console.warn('Client Error:', logData);
  }
}

/**
 * Main error handling middleware
 * Must be registered after all routes
 */
function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log the error
  logError(err, req);

  // Determine status code
  let statusCode = err.statusCode || 500;

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    err.message = 'Invalid token';
    err.code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    err.message = 'Token expired';
    err.code = 'TOKEN_EXPIRED';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    err.code = 'VALIDATION_ERROR';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    err.message = 'Database connection failed';
    err.code = 'DATABASE_UNAVAILABLE';
  }

  // Don't expose internal error details in production
  const includeStack = isDevelopment();
  const response = formatErrorResponse(err, includeStack);

  // In production, replace internal error messages with generic one
  if (!isDevelopment() && statusCode >= 500) {
    response.error = 'Internal server error';
    delete response.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler for API routes
 * Should be registered after all routes but before error handler
 */
function notFoundHandler(req, res) {
  const response = {
    error: 'Not found',
    code: 'NOT_FOUND',
    path: req.path
  };

  // Don't include path in production
  if (!isDevelopment()) {
    delete response.path;
  }

  res.status(404).json(response);
}

/**
 * Async wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function that catches errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  errors,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  formatErrorResponse,
  isDevelopment
};
