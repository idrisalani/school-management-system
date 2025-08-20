// server/src/middleware/error.middleware.js
import logger from "../utils/logger.js";

/**
 * @typedef {Object} MongooseValidationError
 * @property {string} name - Error name
 * @property {string} message - Error message
 * @property {Object} errors - Validation errors object
 */

/**
 * @typedef {Object} MongoCastError
 * @property {string} name - Error name
 * @property {string} message - Error message
 * @property {string} path - Field path that caused error
 * @property {any} value - Invalid value
 */

/**
 * @typedef {Object} MongoDuplicateError
 * @property {string} name - Error name
 * @property {string} message - Error message
 * @property {number} code - Error code (11000 for duplicate)
 * @property {Object} keyValue - Duplicate key-value pair
 */

/**
 * @typedef {Object} MulterError
 * @property {string} name - Error name
 * @property {string} message - Error message
 * @property {string} code - Multer error code
 */

/**
 * @typedef {Object} PayloadError
 * @property {string} name - Error name
 * @property {string} message - Error message
 * @property {string} type - Error type
 */

/**
 * @typedef {Object} ExtendedRequest
 * @property {Object} [rateLimit] - Rate limit information
 * @property {string} [rateLimit.resetTime] - Reset time for rate limit
 */

/**
 * Custom Application Error class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    //this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.code = undefined;
    this.errors = undefined;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create standardized error response
 * @param {AppError} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {Object} Error response
 */
const createErrorResponse = (err, req, res) => {
  const isDevelopment = process.env.NODE_ENV === "development";

  const errorResponse = {
    success: false,
    status: err.statusCode || "error",
    message: err.message || "Something went wrong",
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add stack trace in development
  if (isDevelopment) {
    errorResponse.stack = err.stack;
    errorResponse.error = err;
  }

  // Add error code if available
  if (err.code) {
    errorResponse.code = err.code;
  }

  // Add validation errors if available
  if (err.errors) {
    errorResponse.errors = err.errors;
  }

  return errorResponse;
};

/**
 * Handle cast errors (invalid ObjectId, etc.)
 * @param {MongoCastError} err - Cast error
 * @returns {AppError} Formatted error
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle duplicate field errors
 * @param {MongoDuplicateError} err - Duplicate error
 * @returns {AppError} Formatted error
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists`;
  return new AppError(message, 400);
};

/**
 * Handle validation errors
 * @param {MongooseValidationError} err - Validation error
 * @returns {AppError} Formatted error
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT errors
 * @returns {AppError} Formatted error
 */
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

/**
 * Handle JWT expiration errors
 * @returns {AppError} Formatted error
 */
const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

/**
 * Send error response in development
 * @param {AppError} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {import('express').Response} Error response
 */
const sendErrorDev = (err, req, res) => {
  const errorResponse = createErrorResponse(err, req, res);
  return res.status(err.statusCode || 500).json(errorResponse);
};

/**
 * Send error response in production
 * @param {AppError} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {import('express').Response} Error response
 */
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const errorResponse = createErrorResponse(err, req, res);
    delete errorResponse.stack;
    delete errorResponse.error;

    return res.status(err.statusCode).json(errorResponse);
  }

  // Programming or other unknown error: don't leak error details
  console.error("ERROR 💥", err);
  logger.error("Unexpected error", { error: err, url: req.originalUrl });

  return res.status(500).json({
    success: false,
    status: "error",
    message: "Something went wrong!",
    timestamp: new Date().toISOString(),
  });
};

/**
 * Handle payload too large errors
 * @param {PayloadError} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Next middleware
 * @returns {import('express').Response|void} Error response or next
 */
const payloadTooLargeHandler = (err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request payload too large",
      maxSize: "10MB",
    });
  }
  return next(err);
};

/**
 * Handle database connection errors
 * @param {Error} err - Database error
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Next middleware
 * @returns {import('express').Response|void} Error response or next
 */
const databaseErrorHandler = (err, req, res, next) => {
  // MongoDB connection errors
  if (err.name === "MongoNetworkError" || err.name === "MongoTimeoutError") {
    return res.status(503).json({
      success: false,
      message: "Database connection error. Please try again later.",
      code: "DATABASE_UNAVAILABLE",
    });
  }

  // MongoDB server selection error
  if (err.name === "MongoServerSelectionError") {
    return res.status(503).json({
      success: false,
      message: "Database server unavailable. Please try again later.",
      code: "DATABASE_UNAVAILABLE",
    });
  }

  return next(err);
};

/**
 * Handle file upload errors
 * @param {MulterError} err - File upload error
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Next middleware
 * @returns {import('express').Response|void} Error response or next
 */
const fileUploadErrorHandler = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File too large. Maximum size is 10MB.",
      code: "FILE_TOO_LARGE",
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Too many files. Maximum is 5 files.",
      code: "TOO_MANY_FILES",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Unexpected file field.",
      code: "UNEXPECTED_FILE",
    });
  }

  return next(err);
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Next middleware
 * @returns {import('express').Response} Error response
 */
const globalErrorHandler = (err, req, res, next) => {
  // Safely extract properties with fallbacks using bracket notation
  const statusCode = err["statusCode"] || 500;
  const status = err["status"] || "error";

  if (process.env.NODE_ENV === "development") {
    // Create AppError-like object for development
    const devError = new AppError(err.message, statusCode);
    devError.stack = err.stack;
    return sendErrorDev(devError, req, res);
  } else {
    // Create a copy of the error with proper typing
    let error = new AppError(err.message, statusCode);

    // Copy relevant properties
    if (err.name) error.name = err.name;
    if (err.stack) error.stack = err.stack;

    // Handle specific error types with proper type checking
    if (
      error.name === "CastError" &&
      err["path"] &&
      err["value"] !== undefined
    ) {
      const message = `Invalid ${err["path"]}: ${err["value"]}`;
      error = new AppError(message, 400);
    }
    if (err["code"] === 11000 && err["keyValue"]) {
      const keyValue = err["keyValue"];
      const field = Object.keys(keyValue)[0];
      const value = keyValue[field];
      const message = `${field} '${value}' already exists`;
      error = new AppError(message, 400);
    }
    if (error.name === "ValidationError" && err["errors"]) {
      const errors = Object.values(err["errors"]).map((el) => el["message"]);
      const message = `Invalid input data: ${errors.join(". ")}`;
      error = new AppError(message, 400);
    }
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    return sendErrorProd(error, req, res);
  }
};

/**
 * Handle 404 errors for undefined routes
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Next middleware
 * @returns {void}
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(err);
};

/**
 * Async error wrapper to catch async function errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Create error for specific HTTP status codes
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {AppError} App error instance
 */
const createError = (message, statusCode) => {
  return new AppError(message, statusCode);
};

/**
 * Validation error handler
 * @param {Array} errors - Array of validation errors
 * @returns {AppError} Formatted validation error
 */
const handleValidationError = (errors) => {
  const errorMessages = errors.map((error) => error.msg).join(", ");
  return new AppError(`Validation Error: ${errorMessages}`, 400);
};

/**
 * Rate limiting error handler
 * @param {import('express').Request & ExtendedRequest} req - Express request with rate limit info
 * @param {import('express').Response} res - Express response
 * @returns {import('express').Response} Rate limit error response
 */
const rateLimitHandler = (req, res) => {
  return res.status(429).json({
    success: false,
    message: "Too many requests from this IP. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: req.rateLimit?.resetTime || "15 minutes",
  });
};

module.exports = {
  AppError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
  createError,
  handleValidationError,
  rateLimitHandler,
  payloadTooLargeHandler,
  databaseErrorHandler,
  fileUploadErrorHandler,
  createErrorResponse,
};
