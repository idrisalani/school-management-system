// @ts-check
// server/src/middleware/rate-limiter.middleware.js - Enhanced Rate Limiting Middleware
import rateLimit from "express-rate-limit";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/errors.js";

/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('express').NextFunction} NextFunction */

/**
 * @typedef {function(Request, Response): string} KeyGeneratorFunction
 */

/**
 * @typedef {function(Request, Response): boolean} SkipFunction
 */

/**
 * @typedef {function(Request, Response): void} HandlerFunction
 */

/**
 * @typedef {Object} RateLimitOptions
 * @property {number} [windowMs] - Time window in milliseconds
 * @property {number} [max] - Maximum number of requests per window
 * @property {string} [message] - Error message when limit exceeded
 * @property {boolean} [skipSuccessfulRequests] - Skip successful requests from rate limiting
 * @property {boolean} [skipFailedRequests] - Skip failed requests from rate limiting
 * @property {KeyGeneratorFunction} [keyGenerator] - Function to generate rate limit key
 * @property {SkipFunction} [skip] - Function to skip rate limiting
 * @property {HandlerFunction} [handler] - Custom handler for rate limit exceeded
 */

/**
 * @typedef {Object} RateLimitInfo
 * @property {number} [remaining] - Remaining requests in window
 * @property {number} [limit] - Total requests allowed in window
 * @property {Date} [resetTime] - When the window resets
 * @property {number} [used] - Number of requests used
 */

/**
 * @typedef {Request & {rateLimit?: RateLimitInfo, user?: {id: string, role: string}}} EnhancedRequest
 */

/**
 * Default rate limit configurations
 */
const RATE_LIMITS = {
  // Authentication related
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: "Too many login attempts from this IP, please try again later",
  },

  REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per window
    message:
      "Too many registration attempts from this IP, please try again later",
  },

  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per window
    message: "Too many password reset attempts, please try again later",
  },

  EMAIL_VERIFICATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts per window
    message: "Too many email verification attempts, please try again later",
  },

  REFRESH_TOKEN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: "Too many token refresh attempts, please try again later",
  },

  // General API usage
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: "Too many API requests from this IP, please try again later",
  },

  // Specific operations
  FILE_UPLOAD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 uploads per window
    message: "Too many file upload attempts, please try again later",
  },

  SEARCH: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: "Too many search requests, please slow down",
  },

  EMAIL_SEND: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 emails per hour
    message: "Too many email requests, please try again later",
  },

  REPORT_GENERATION: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 reports per 10 minutes
    message: "Too many report generation requests, please try again later",
  },

  // Security sensitive
  STRICT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour
    message:
      "Too many requests for this sensitive operation, please try again later",
  },
};

/**
 * Role-based rate limit configurations
 */
const ROLE_LIMITS = {
  admin: { max: 1000, windowMs: 15 * 60 * 1000 },
  teacher: { max: 300, windowMs: 15 * 60 * 1000 },
  student: { max: 150, windowMs: 15 * 60 * 1000 },
  parent: { max: 100, windowMs: 15 * 60 * 1000 },
  guest: { max: 50, windowMs: 15 * 60 * 1000 },
  default: { max: 50, windowMs: 15 * 60 * 1000 },
};

/**
 * Enhanced error handler for rate limiting
 * @param {string} operation - The operation being rate limited
 * @param {RateLimitOptions} options - Rate limit options
 * @returns {HandlerFunction} Express error handler
 */
const createRateLimitHandler = (operation, options) => {
  /**
   * @param {Request} req
   * @param {Response} res
   */
  return (req, res) => {
    const retryAfter = Math.ceil((options.windowMs || 900000) / 1000);

    logger.warn(`Rate limit exceeded for ${operation}`, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      operation,
      retryAfter,
    });

    // Use simplified error structure for rate limiting
    res.status(429).json({
      status: "error",
      message: options.message || `Too many requests for ${operation}`,
      error: {
        type: "RATE_LIMIT_EXCEEDED",
        operation,
        retryAfter,
        windowMs: options.windowMs,
        maxRequests: options.max,
      },
      retryAfter,
    });
  };
};

/**
 * Smart key generator that considers user authentication
 * @type {KeyGeneratorFunction}
 */
const smartKeyGenerator = (req, res) => {
  // Use user ID for authenticated users, IP for guests
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${req.ip}`;
};

/**
 * IP-only key generator for security-sensitive operations
 * @type {KeyGeneratorFunction}
 */
const ipOnlyKeyGenerator = (req, res) => {
  return `ip:${req.ip}`;
};

/**
 * Development skip function
 * @type {SkipFunction}
 */
const developmentSkip = (req, res) => {
  // Skip rate limiting for admin users in development
  return process.env.NODE_ENV === "development" && req.user?.role === "admin";
};

// /**
//  * Never skip function for security-sensitive operations
//  * @type {SkipFunction}
//  */
// const neverSkip = (req, res) => false;

/**
 * Create rate limiter with enhanced options
 * @param {string} operation - Name of the operation being rate limited
 * @param {RateLimitOptions} options - Rate limiting options
 * @returns {Function} Express middleware
 */
export const createRateLimiter = (operation, options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: smartKeyGenerator,
    skip: developmentSkip,
    handler: createRateLimitHandler(operation, options),
  };

  const mergedOptions = { ...defaultOptions, ...options };

  logger.info(`Rate limiter created for ${operation}`, {
    windowMs: mergedOptions.windowMs,
    max: mergedOptions.max,
    operation,
  });

  return rateLimit(mergedOptions);
};

/**
 * Generic rate limiter factory (backward compatibility)
 * @param {RateLimitOptions} options - Rate limiting options
 * @returns {Function} Express middleware
 */
export const rateLimiter = (options = {}) => {
  return createRateLimiter("generic", options);
};

// ========================= PRE-CONFIGURED RATE LIMITERS =========================

/**
 * Never skip function for security-sensitive operations
 * @type {SkipFunction}
 */
const neverSkip = (req, res) => false;

/**
 * Authentication rate limiter - very restrictive
 */
export const authRateLimiter = createRateLimiter("authentication", {
  ...RATE_LIMITS.LOGIN,
  keyGenerator: ipOnlyKeyGenerator, // Always use IP for auth
  skip: neverSkip, // Never skip auth rate limiting
});

/**
 * Registration rate limiter - extremely restrictive
 */
export const registrationRateLimiter = createRateLimiter("registration", {
  ...RATE_LIMITS.REGISTER,
  keyGenerator: ipOnlyKeyGenerator,
  skip: neverSkip,
});

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimiter = createRateLimiter("passwordReset", {
  ...RATE_LIMITS.PASSWORD_RESET,
  keyGenerator: ipOnlyKeyGenerator,
  skip: neverSkip,
});

/**
 * Email verification rate limiter
 */
export const emailVerificationRateLimiter = createRateLimiter(
  "emailVerification",
  {
    ...RATE_LIMITS.EMAIL_VERIFICATION,
    keyGenerator: ipOnlyKeyGenerator,
    skip: neverSkip,
  }
);

/**
 * Token refresh rate limiter
 */
export const refreshTokenRateLimiter = createRateLimiter("refreshToken", {
  ...RATE_LIMITS.REFRESH_TOKEN,
  keyGenerator: smartKeyGenerator,
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = createRateLimiter("api", {
  ...RATE_LIMITS.API,
  keyGenerator: smartKeyGenerator,
});

/**
 * Strict rate limiter for sensitive operations
 */
export const strictRateLimiter = createRateLimiter("sensitive", {
  ...RATE_LIMITS.STRICT,
  keyGenerator: ipOnlyKeyGenerator,
  skip: neverSkip,
});

/**
 * File upload rate limiter
 */
export const uploadRateLimiter = createRateLimiter("fileUpload", {
  ...RATE_LIMITS.FILE_UPLOAD,
  keyGenerator: smartKeyGenerator,
});

/**
 * Search rate limiter
 */
export const searchRateLimiter = createRateLimiter("search", {
  ...RATE_LIMITS.SEARCH,
  keyGenerator: smartKeyGenerator,
});

/**
 * Email sending rate limiter
 */
export const emailRateLimiter = createRateLimiter("emailSend", {
  ...RATE_LIMITS.EMAIL_SEND,
  keyGenerator: smartKeyGenerator,
});

/**
 * Report generation rate limiter
 */
export const reportRateLimiter = createRateLimiter("reportGeneration", {
  ...RATE_LIMITS.REPORT_GENERATION,
  keyGenerator: smartKeyGenerator,
});

// ========================= ADVANCED RATE LIMITERS =========================

/**
 * Role-based rate limiter
 * Applies different limits based on user role
 * @param {Object} customRoleLimits - Custom role-based limits
 * @returns {Function} Express middleware
 */
export const roleBasedRateLimiter = (customRoleLimits = {}) => {
  const roleLimits = { ...ROLE_LIMITS, ...customRoleLimits };

  return (req, res, next) => {
    const userRole = req.user?.role || "guest";
    const roleLimit = roleLimits[userRole] || roleLimits.default;

    const limiter = createRateLimiter(`role:${userRole}`, {
      windowMs: roleLimit.windowMs,
      max: roleLimit.max,
      message: `Rate limit exceeded for ${userRole} role. Please try again later.`,
      keyGenerator: smartKeyGenerator,
    });

    limiter(req, res, next);
  };
};

/**
 * Conditional rate limiter
 * Applies different limits based on dynamic conditions
 * @param {Function} conditionFn - Function that returns rate limit options or null
 * @returns {Function} Express middleware
 */
export const conditionalRateLimiter = (conditionFn) => {
  return (req, res, next) => {
    try {
      const condition = conditionFn(req);

      if (!condition) {
        // No rate limiting applied
        return next();
      }

      const limiter = createRateLimiter("conditional", condition);
      limiter(req, res, next);
    } catch (error) {
      logger.error("Error in conditional rate limiter:", error);
      next(error);
    }
  };
};

/**
 * Whitelist rate limiter
 * Skips rate limiting for whitelisted IPs or users
 * @param {string[]} whitelist - Array of IPs or user IDs to whitelist
 * @param {RateLimitOptions} options - Rate limiting options
 * @returns {Function} Express middleware
 */
export const whitelistRateLimiter = (whitelist = [], options = {}) => {
  /**
   * @type {SkipFunction}
   */
  const whitelistSkip = (req, res) => {
    const ip = req.ip;
    const userId = req.user?.id;

    const isWhitelisted =
      whitelist.includes(ip) ||
      whitelist.includes(userId) ||
      whitelist.includes(`user:${userId}`) ||
      whitelist.includes(`ip:${ip}`);

    if (isWhitelisted) {
      logger.debug("Rate limiting skipped for whitelisted entity", {
        ip,
        userId,
        whitelist: whitelist.length,
      });
    }

    return isWhitelisted;
  };

  return createRateLimiter("whitelist", {
    ...options,
    skip: whitelistSkip,
  });
};

/**
 * Burst rate limiter
 * Allows short bursts of activity but limits sustained usage
 * @param {Object} burstOptions - Burst configuration
 * @param {number} burstOptions.burstMax - Maximum burst requests
 * @param {number} burstOptions.burstWindowMs - Burst window
 * @param {number} burstOptions.sustainedMax - Sustained rate limit
 * @param {number} burstOptions.sustainedWindowMs - Sustained window
 * @returns {Function} Express middleware
 */
export const burstRateLimiter = (burstOptions) => {
  const {
    burstMax = 10,
    burstWindowMs = 1000, // 1 second
    sustainedMax = 100,
    sustainedWindowMs = 15 * 60 * 1000, // 15 minutes
  } = burstOptions;

  const burstLimiter = createRateLimiter("burst", {
    windowMs: burstWindowMs,
    max: burstMax,
    message: "Too many requests in a short burst, please slow down",
  });

  const sustainedLimiter = createRateLimiter("sustained", {
    windowMs: sustainedWindowMs,
    max: sustainedMax,
    message: "Too many requests over time, please try again later",
  });

  return (req, res, next) => {
    // Apply burst limiter first
    burstLimiter(req, res, (err) => {
      if (err) return next(err);

      // Then apply sustained limiter
      sustainedLimiter(req, res, next);
    });
  };
};

/**
 * Sliding window rate limiter
 * Implements a sliding window for more precise rate limiting
 * @param {Object} slidingOptions - Sliding window configuration
 * @returns {Function} Express middleware
 */
export const slidingWindowRateLimiter = (slidingOptions = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = "Rate limit exceeded in sliding window",
  } = slidingOptions;

  /**
   * @type {KeyGeneratorFunction}
   */
  const slidingKeyGenerator = (req, res) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const window = Math.floor(timestamp / (windowMs / 1000));
    return `${smartKeyGenerator(req, res)}:${window}`;
  };

  return createRateLimiter("slidingWindow", {
    windowMs,
    max,
    message,
    // Use a more precise sliding window implementation
    keyGenerator: slidingKeyGenerator,
  });
};

// ========================= UTILITY FUNCTIONS =========================

/**
 * Create custom rate limiter for specific routes
 * @param {string} routeName - Name of the route
 * @param {RateLimitOptions} options - Rate limiting options
 * @returns {Function} Express middleware
 */
export const createCustomRateLimiter = (routeName, options) => {
  return createRateLimiter(routeName, {
    ...options,
    handler: createRateLimitHandler(routeName, options),
  });
};

/**
 * Rate limiter middleware factory for backward compatibility
 */
export const rateLimiters = {
  login: authRateLimiter,
  register: registrationRateLimiter,
  passwordReset: passwordResetRateLimiter,
  emailVerification: emailVerificationRateLimiter,
  refreshToken: refreshTokenRateLimiter,
  api: apiRateLimiter,
  strict: strictRateLimiter,
  upload: uploadRateLimiter,
  search: searchRateLimiter,
  email: emailRateLimiter,
  report: reportRateLimiter,
};

/**
 * Get rate limit status for monitoring
 * @param {EnhancedRequest} req - Express request object with rate limit info
 * @returns {Object} Rate limit status
 */
export const getRateLimitStatus = (req) => {
  const rateLimitInfo = {
    remaining: req.rateLimit?.remaining || null,
    total: req.rateLimit?.limit || null,
    resetTime: req.rateLimit?.resetTime || null,
    used: req.rateLimit?.used || null,
    key: smartKeyGenerator(req, null), // Pass null as response since we only need the key
  };

  return rateLimitInfo;
};

// Default export with all rate limiters
export default {
  // Core functions
  rateLimiter,
  createRateLimiter,
  createCustomRateLimiter,

  // Pre-configured limiters
  authRateLimiter,
  registrationRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
  refreshTokenRateLimiter,
  apiRateLimiter,
  strictRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  emailRateLimiter,
  reportRateLimiter,

  // Advanced limiters
  roleBasedRateLimiter,
  conditionalRateLimiter,
  whitelistRateLimiter,
  burstRateLimiter,
  slidingWindowRateLimiter,

  // Utilities
  rateLimiters,
  getRateLimitStatus,

  // Constants
  RATE_LIMITS,
  ROLE_LIMITS,
};
