// @ts-nocheck
// server/src/utils/errors.js - Fixed TypeScript Issues

import logger from "./logger.js";

/**
 * @typedef {Object} ErrorDetails
 * @property {string} [field] - Field that caused the error
 * @property {any} [value] - Value that caused the error
 * @property {string} [constraint] - Database constraint that was violated
 * @property {string} [code] - Error code for programmatic handling
 * @property {string} [resource] - Resource type
 * @property {string} [service] - Service name
 * @property {string} [table] - Database table name
 * @property {string} [column] - Database column name
 * @property {string} [originalMessage] - Original error message
 * @property {Date} [expiredAt] - Token expiration date
 * @property {Date} [date] - Generic date field
 * @property {Array} [errors] - Array of validation errors
 * @property {number} [count] - Error count
 * @property {string} [expectedType] - Expected data type
 * @property {any} [mongooseErrors] - Mongoose validation errors
 * @property {string} [originalError] - Original error message
 * @property {any} [location] - Error location
 */

/**
 * @typedef {Object} ValidationErrorItem
 * @property {string} field - Field name
 * @property {string} message - Error message
 * @property {any} value - Invalid value
 * @property {string} [location] - Error location
 */

/**
 * @typedef {Object} DatabaseError
 * @property {string} [code] - PostgreSQL error code
 * @property {string} [constraint] - Constraint name
 * @property {string} [table] - Table name
 * @property {string} [column] - Column name
 * @property {string} [detail] - Error detail
 * @property {string} [schema] - Schema name
 */

/**
 * @typedef {Object} JWTError
 * @property {string} name - Error name
 * @property {Date} [expiredAt] - Expiration date
 * @property {Date} [date] - Not before date
 */

/**
 * Custom API Error class with factory methods and comprehensive error handling
 * @extends Error
 */
export class ApiError extends Error {
  /**
   * Create an API error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {ErrorDetails|null} [details] - Additional error details
   * @param {boolean} [isOperational=true] - Whether this is an operational error
   */
  constructor(statusCode, message, details = null, isOperational = true) {
    super(message);

    /** @type {number} */
    this.statusCode = statusCode;
    /** @type {string} */
    this.name = this.constructor.name;
    /** @type {boolean} */
    this.isOperational = isOperational;
    /** @type {ErrorDetails|null} */
    this.details = details;
    /** @type {Date} */
    this.timestamp = new Date();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // ========================================
  // Factory Methods for Common Error Types
  // ========================================

  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @param {ErrorDetails|null} [details] - Additional error details
   * @returns {ApiError} Bad Request error
   */
  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} [message='Unauthorized access'] - Error message
   * @param {ErrorDetails|null} [details] - Additional error details
   * @returns {ApiError} Unauthorized error
   */
  static unauthorized(message = "Unauthorized access", details = null) {
    return new ApiError(401, message, details);
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} [message='Insufficient permissions'] - Error message
   * @param {ErrorDetails|null} [details] - Additional error details
   * @returns {ApiError} Forbidden error
   */
  static forbidden(message = "Insufficient permissions", details = null) {
    return new ApiError(403, message, details);
  }

  /**
   * Create a 404 Not Found error
   * @param {string} [message='Resource not found'] - Error message
   * @param {string} [resource] - Resource type that wasn't found
   * @returns {ApiError} Not Found error
   */
  static notFound(message = "Resource not found", resource) {
    const errorMessage = resource ? `${resource} not found` : message;
    const details = resource ? { resource } : null;
    return new ApiError(404, errorMessage, details);
  }

  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @param {ErrorDetails|null} [details] - Additional conflict details
   * @returns {ApiError} Conflict error
   */
  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  /**
   * Create a 422 Unprocessable Entity error (validation)
   * @param {string} message - Error message
   * @param {ErrorDetails|null} details - Validation error details
   * @returns {ApiError} Validation error
   */
  static validation(message, details = null) {
    return new ApiError(422, message, details);
  }

  /**
   * Create a 429 Too Many Requests error
   * @param {string} [message='Rate limit exceeded'] - Error message
   * @param {ErrorDetails|null} [details] - Rate limiting details
   * @returns {ApiError} Rate limit error
   */
  static rateLimit(message = "Rate limit exceeded", details = null) {
    return new ApiError(429, message, details);
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} [message='Internal server error'] - Error message
   * @param {ErrorDetails|null} [details] - Additional error details
   * @returns {ApiError} Internal Server Error
   */
  static internal(message = "Internal server error", details = null) {
    return new ApiError(500, message, details, false);
  }

  /**
   * Create a 503 Service Unavailable error
   * @param {string} [message='Service temporarily unavailable'] - Error message
   * @param {string} [service] - Service name that's unavailable
   * @returns {ApiError} Service Unavailable error
   */
  static serviceUnavailable(
    message = "Service temporarily unavailable",
    service
  ) {
    const details = service ? { service } : null;
    return new ApiError(503, message, details);
  }

  // ========================================
  // Specialized Error Types
  // ========================================

  /**
   * Create an authentication error
   * @param {string} [message='Authentication failed'] - Error message
   * @param {ErrorDetails|null} [details] - Additional error details
   * @returns {ApiError} Authentication error
   */
  static authentication(message = "Authentication failed", details = null) {
    return new ApiError(401, message, details);
  }

  /**
   * Create a database error
   * @param {string} [message='Database operation failed'] - Error message
   * @param {ErrorDetails|null} [details] - Additional error details
   * @returns {ApiError} Database error
   */
  static database(message = "Database operation failed", details = null) {
    return new ApiError(500, message, details, false);
  }

  /**
   * Create a duplicate resource error
   * @param {string} resource - Resource type that's duplicate
   * @param {string} [field] - Field that's duplicate
   * @returns {ApiError} Duplicate resource error
   */
  static duplicate(resource, field) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    return new ApiError(409, message, { resource, field });
  }

  /**
   * Create an external service error
   * @param {string} service - Service name
   * @param {string} [message] - Custom error message
   * @returns {ApiError} External service error
   */
  static externalService(service, message) {
    const errorMessage =
      message || `${service} service is currently unavailable`;
    return new ApiError(503, errorMessage, { service });
  }

  // ========================================
  // JSON Serialization
  // ========================================

  /**
   * Convert error to JSON format for API responses
   * @param {boolean} [includeStack=false] - Whether to include stack trace
   * @returns {Object} JSON representation of the error
   */
  toJSON(includeStack = false) {
    const json = {
      success: false,
      statusCode: this.statusCode,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    };

    // Add details if present
    if (this.details) {
      json.details = this.details;
    }

    // Add stack trace in development or when explicitly requested
    if (includeStack || process.env.NODE_ENV === "development") {
      json.stack = this.stack;
    }

    return json;
  }

  /**
   * Get error category for monitoring/alerting
   * @returns {string} Error category
   */
  getCategory() {
    if (this.statusCode >= 400 && this.statusCode < 500) {
      return "client_error";
    } else if (this.statusCode >= 500) {
      return "server_error";
    }
    return "unknown";
  }

  /**
   * Check if error is retryable
   * @returns {boolean} Whether the error is retryable
   */
  isRetryable() {
    const retryableStatusCodes = [429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(this.statusCode);
  }
}

// ========================================
// Database Error Handling
// ========================================

/**
 * Check if error is a database error
 * @param {any} error - Error to check
 * @returns {error is DatabaseError & Error} Type guard for database errors
 */
const isDatabaseError = (error) => {
  return error && typeof error === "object" && "code" in error;
};

/**
 * Handle PostgreSQL errors and convert to ApiError
 * @param {Error & DatabaseError} error - PostgreSQL error
 * @returns {ApiError} Converted API error
 */
export const handleDatabaseError = (error) => {
  // Type-safe access to database error properties
  const dbError = /** @type {DatabaseError & Error} */ (error);

  logger.error("Database error occurred:", {
    code: dbError.code,
    message: dbError.message,
    constraint: dbError.constraint,
    table: dbError.table,
    column: dbError.column,
    detail: dbError.detail,
  });

  // PostgreSQL error codes
  switch (dbError.code) {
    case "23505": // unique_violation
      if (dbError.constraint?.includes("email")) {
        return ApiError.duplicate("User", "email address");
      }
      if (dbError.constraint?.includes("username")) {
        return ApiError.duplicate("User", "username");
      }
      return ApiError.conflict("This record already exists", {
        constraint: dbError.constraint,
        table: dbError.table,
      });

    case "23503": // foreign_key_violation
      return ApiError.validation("Referenced record does not exist", {
        constraint: dbError.constraint,
        table: dbError.table,
        column: dbError.column,
      });

    case "23502": // not_null_violation
      return ApiError.validation(`Field '${dbError.column}' is required`, {
        field: dbError.column,
        constraint: dbError.constraint,
      });

    case "23514": // check_violation
      return ApiError.validation("Data violates database constraints", {
        constraint: dbError.constraint,
        table: dbError.table,
      });

    case "42P01": // undefined_table
      return ApiError.internal("Database table not found", {
        table: dbError.table,
        code: dbError.code,
      });

    case "42703": // undefined_column
      return ApiError.internal("Database column not found", {
        column: dbError.column,
        table: dbError.table,
        code: dbError.code,
      });

    case "28P01": // invalid_password
      return ApiError.authentication("Database authentication failed");

    case "53300": // too_many_connections
      return ApiError.serviceUnavailable(
        "Database connection limit reached",
        "database"
      );

    case "08006": // connection_failure
    case "08001": // sqlclient_unable_to_establish_sqlconnection
      return ApiError.serviceUnavailable(
        "Database connection failed",
        "database"
      );

    case "40001": // serialization_failure
      return ApiError.conflict("Database transaction conflict - please retry");

    case "40P01": // deadlock_detected
      return ApiError.conflict("Database deadlock detected - please retry");

    default:
      return ApiError.database("Database operation failed", {
        code: dbError.code,
        originalMessage: dbError.message,
      });
  }
};

// ========================================
// JWT Error Handling
// ========================================

/**
 * Check if error is a JWT error
 * @param {any} error - Error to check
 * @returns {error is JWTError & Error} Type guard for JWT errors
 */
const isJWTError = (error) => {
  return (
    error &&
    typeof error === "object" &&
    "name" in error &&
    typeof error.name === "string" &&
    error.name.includes("Token")
  );
};

/**
 * Handle JWT errors and convert to ApiError
 * @param {Error & JWTError} error - JWT error
 * @returns {ApiError} Converted API error
 */
export const handleJWTError = (error) => {
  // Type-safe access to JWT error properties
  const jwtError = /** @type {JWTError & Error} */ (error);

  logger.warn("JWT error occurred:", {
    name: jwtError.name,
    message: jwtError.message,
    expiredAt: jwtError.expiredAt,
  });

  switch (jwtError.name) {
    case "TokenExpiredError":
      return ApiError.authentication("Token has expired", {
        expiredAt: jwtError.expiredAt,
        code: "TOKEN_EXPIRED",
      });

    case "JsonWebTokenError":
      return ApiError.authentication("Invalid token", {
        code: "INVALID_TOKEN",
      });

    case "NotBeforeError":
      return ApiError.authentication("Token not active yet", {
        date: jwtError.date,
        code: "TOKEN_NOT_ACTIVE",
      });

    default:
      return ApiError.authentication("Token verification failed", {
        code: "TOKEN_VERIFICATION_FAILED",
      });
  }
};

// ========================================
// Validation Error Handling
// ========================================

/**
 * Handle validation errors from express-validator
 * @param {Array} errors - Validation errors array
 * @returns {ApiError} Validation error
 */
export const handleValidationErrors = (errors) => {
  const formattedErrors = errors.map((error) => ({
    field: error.path || error.param || error.location || "unknown",
    message: error.msg || "Validation failed",
    value: error.value,
    location: error.location || "body",
  }));

  return ApiError.validation("Validation failed", {
    errors: formattedErrors,
    count: formattedErrors.length,
  });
};

/**
 * Create validation error from simple field errors
 * @param {Object} fieldErrors - Object with field names as keys and error messages as values
 * @returns {ApiError} Validation error
 */
export const createValidationError = (fieldErrors) => {
  const errors = Object.entries(fieldErrors).map(([field, message]) => ({
    field,
    message,
    value: null,
    location: "body",
  }));

  return ApiError.validation("Validation failed", {
    errors,
    count: errors.length,
  });
};

// ========================================
// Express Middleware Integration
// ========================================

/**
 * Async error handler wrapper for Express routes
 * @param {Function} fn - Async function
 * @returns {Function} Wrapped function that catches async errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware for Express
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const globalErrorHandler = (error, req, res, next) => {
  let apiError = error;

  // Convert non-API errors to API errors
  if (!(error instanceof ApiError)) {
    if (isDatabaseError(error)) {
      // PostgreSQL error
      apiError = handleDatabaseError(error);
    } else if (isJWTError(error)) {
      // JWT error
      apiError = handleJWTError(error);
    } else if (error.name === "ValidationError") {
      // Mongoose validation error
      const mongooseError = /** @type {any} */ (error);
      apiError = ApiError.validation(error.message, {
        mongooseErrors: mongooseError.errors,
      });
    } else if (error.name === "CastError") {
      // Mongoose cast error
      const castError = /** @type {any} */ (error);
      apiError = ApiError.badRequest("Invalid data format", {
        field: castError.path,
        value: castError.value,
        expectedType: castError.kind,
      });
    } else {
      // Generic error
      apiError = ApiError.internal("Internal server error", {
        originalError: error.message,
      });
    }
  }

  // Ensure apiError is definitely an ApiError instance
  if (!(apiError instanceof ApiError)) {
    apiError = ApiError.internal("Internal server error", {
      originalError: error.message,
    });
  }

  // Now we can safely access ApiError properties
  const logLevel = apiError.statusCode >= 500 ? "error" : "warn";
  logger[logLevel]("API Error occurred:", {
    statusCode: apiError.statusCode,
    message: apiError.message,
    category: apiError.getCategory(),
    isOperational: apiError.isOperational,
    isRetryable: apiError.isRetryable(),
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    userId: req.user?.id || req.user?._id,
    timestamp: apiError.timestamp,
    ...(apiError.details && { details: apiError.details }),
    ...(process.env.NODE_ENV === "development" && { stack: apiError.stack }),
  });

  // Send error response
  const errorResponse = apiError.toJSON(process.env.NODE_ENV === "development");

  // Add request context in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.request = {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    };
  }

  res.status(apiError.statusCode).json(errorResponse);
};

/**
 * 404 handler middleware for unmatched routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  const error = ApiError.notFound(
    `Route ${req.method} ${req.originalUrl} not found`,
    "route"
  );
  next(error);
};

// ========================================
// Utility Functions
// ========================================

/**
 * Create a standardized error response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {ErrorDetails|null} [details] - Additional error details
 * @returns {Object} Error response object
 */
export const createErrorResponse = (statusCode, message, details = null) => {
  const apiError = new ApiError(statusCode, message, details);
  return apiError.toJSON();
};

/**
 * Check if an error is operational (vs programming error)
 * @param {Error} error - Error to check
 * @returns {boolean} Whether the error is operational
 */
export const isOperationalError = (error) => {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Log error with proper categorization
 * @param {Error} error - Error to log
 * @param {Object} [context] - Additional context
 */
export const logError = (error, context = {}) => {
  const apiError = error instanceof ApiError ? error : null;
  const logLevel = apiError && apiError.statusCode < 500 ? "warn" : "error";

  logger[logLevel]("Error logged:", {
    name: error.name,
    message: error.message,
    statusCode: apiError?.statusCode,
    category: apiError?.getCategory() || "unknown",
    isOperational: isOperationalError(error),
    ...context,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

// ========================================
// Convenience Exports
// ========================================

// Named exports for backward compatibility and convenience
export const ValidationError = (message, details) =>
  ApiError.validation(message, details);
export const AuthenticationError = (message, details) =>
  ApiError.authentication(message, details);
export const AuthorizationError = (message, details) =>
  ApiError.forbidden(message, details);
export const NotFoundError = (message, resource) =>
  ApiError.notFound(message, resource);
export const ConflictError = (message, details) =>
  ApiError.conflict(message, details);
export const DatabaseError = (message, details) =>
  ApiError.database(message, details);
export const ExternalServiceError = (service, message) =>
  ApiError.externalService(service, message);

// Default export with all utilities
export default {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  handleDatabaseError,
  handleJWTError,
  handleValidationErrors,
  createValidationError,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
  createErrorResponse,
  isOperationalError,
  logError,
};
