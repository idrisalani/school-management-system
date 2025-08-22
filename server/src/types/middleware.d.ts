// @ts-check
// server/src/types/middleware.d.ts - Middleware Type Definitions

/**
 * @typedef {import('express').Request} ExpressRequest
 * @typedef {import('express').Response} ExpressResponse
 * @typedef {import('express').NextFunction} ExpressNextFunction
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * @typedef {Object} AuthUser
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} role - User role
 * @property {boolean} isVerified - Email verification status
 * @property {string} name - Full name
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 */

/**
 * @typedef {ExpressRequest & {user?: AuthUser, token?: string}} AuthenticatedRequest
 */

/**
 * @typedef {Object} AuthOptions
 * @property {boolean} [requireVerified] - Require email verification
 * @property {string[]} [roles] - Required roles
 */

/**
 * @typedef {Object} RateLimitOptions
 * @property {number} windowMs - Time window in milliseconds
 * @property {number} max - Maximum requests per window
 * @property {string} message - Error message when limit exceeded
 * @property {boolean} standardHeaders - Include standard headers
 * @property {boolean} legacyHeaders - Include legacy headers
 */

/**
 * Authentication middleware function type
 * @typedef {function(AuthOptions): RequestHandler} AuthMiddleware
 */

/**
 * Authorization middleware function type
 * @typedef {function(string[]): RequestHandler} AuthorizeMiddleware
 */

/**
 * Rate limiter middleware function type
 * @typedef {function(RateLimitOptions): RequestHandler} RateLimiterMiddleware
 */

/**
 * Validation middleware function type
 * @typedef {RequestHandler} ValidationMiddleware
 */

/**
 * Error handler middleware function type
 * @typedef {function(Error, ExpressRequest, ExpressResponse, ExpressNextFunction): void} ErrorMiddleware
 */

/**
 * Async handler wrapper function type
 * @typedef {function(RequestHandler): RequestHandler} AsyncHandlerWrapper
 */

export {
  AuthUser,
  AuthenticatedRequest,
  AuthOptions,
  RateLimitOptions,
  AuthMiddleware,
  AuthorizeMiddleware,
  RateLimiterMiddleware,
  ValidationMiddleware,
  ErrorMiddleware,
  AsyncHandlerWrapper,
  ExpressRequest,
  ExpressResponse,
  ExpressNextFunction,
  RequestHandler
};