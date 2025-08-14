// server/src/utils/errors.js

/**
 * Custom API Error class for handling application errors
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Create an API error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} [details] - Additional error details
   */
  constructor(statusCode, message, details = null) {
    super(message);

    /** @type {number} */
    this.statusCode = statusCode;
    /** @type {string} */
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    /** @type {boolean} */
    this.isOperational = true;
    /** @type {Object|null} */
    this.details = details;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @param {Object} [details] - Additional error details
   * @returns {ApiError} Bad Request error
   */
  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} [message='Unauthorized'] - Error message
   * @returns {ApiError} Unauthorized error
   */
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} [message='Forbidden'] - Error message
   * @returns {ApiError} Forbidden error
   */
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  /**
   * Create a 404 Not Found error
   * @param {string} [message='Resource not found'] - Error message
   * @param {string} [resource] - Resource type that wasn't found
   * @returns {ApiError} Not Found error
   */
  static notFound(message = "Resource not found", resource = undefined) {
    const errorMessage = resource ? `${resource} not found` : message;
    return new ApiError(404, errorMessage);
  }

  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @param {Object} [details] - Additional conflict details
   * @returns {ApiError} Conflict error
   */
  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  /**
   * Create a 422 Unprocessable Entity error
   * @param {string} message - Error message
   * @param {Object} details - Validation error details
   * @returns {ApiError} Unprocessable Entity error
   */
  static validationError(message, details) {
    return new ApiError(422, message, details);
  }

  /**
   * Create a 429 Too Many Requests error
   * @param {string} [message='Too many requests'] - Error message
   * @param {Object} [details] - Rate limiting details
   * @returns {ApiError} Too Many Requests error
   */
  static tooManyRequests(message = "Too many requests", details = null) {
    return new ApiError(429, message, details);
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} [message='Internal server error'] - Error message
   * @param {Object} [details] - Additional error details
   * @returns {ApiError} Internal Server Error
   */
  static internal(message = "Internal server error", details = null) {
    return new ApiError(500, message, details);
  }

  /**
   * Create a database error
   * @param {string} [message='Database operation failed'] - Error message
   * @param {Object} [details] - Additional error details
   * @returns {ApiError} Database error
   */
  static databaseError(message = "Database operation failed", details = null) {
    return new ApiError(500, message, details);
  }

  /**
   * Create an authentication error
   * @param {string} [message='Authentication failed'] - Error message
   * @param {Object} [details] - Additional error details
   * @returns {ApiError} Authentication error
   */
  static authenticationError(
    message = "Authentication failed",
    details = null
  ) {
    return new ApiError(401, message, details);
  }

  /**
   * Create a duplicate resource error
   * @param {string} resource - Resource type that's duplicate
   * @param {Object} [details] - Additional error details
   * @returns {ApiError} Duplicate resource error
   */
  static duplicateResource(resource, details = null) {
    return new ApiError(409, `${resource} already exists`, details);
  }

  /**
   * Convert error to JSON format
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    const json = {
      status: this.status,
      statusCode: this.statusCode,
      message: this.message,
    };

    if (this.details) {
      json.details = this.details;
    }

    if (process.env.NODE_ENV === "development") {
      json.stack = this.stack;
    }

    return json;
  }
}

// Named exports for specific error types
export const ValidationError = (message, details) =>
  ApiError.validationError(message, details);
export const AuthenticationError = (message) =>
  ApiError.authenticationError(message);
export const AuthorizationError = (message) => ApiError.forbidden(message);
export const NotFoundError = (message) => ApiError.notFound(message);
export const DuplicateError = (resource) =>
  ApiError.duplicateResource(resource);

// Main export
export { ApiError };
