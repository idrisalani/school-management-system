// src/middleware/rate-limiter.middleware.js
import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/errors.js";

// Base rate limiter configuration
const baseRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // Default: 15 minutes
    max: options.max || 100, // Default: 100 requests per windowMs
    message: options.message || "Too many requests, please try again later",
    handler: (req, res) => {
      throw new ApiError(429, options.message || "Too many requests", {
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    ...options,
  });
};

// Pre-configured rate limiters
export const rateLimiters = {
  // Auth rate limiters
  login: baseRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: "Too many login attempts, please try again later",
  }),

  register: baseRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registration attempts per hour
    message: "Too many registration attempts, please try again later",
  }),

  passwordReset: baseRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: "Too many password reset attempts, please try again later",
  }),

  emailVerification: baseRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 verification attempts per hour
    message: "Too many verification attempts, please try again later",
  }),

  refreshToken: baseRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 refresh attempts per 15 minutes
    message: "Too many token refresh attempts, please try again later",
  }),
};

// Generic rate limiter factory
export const rateLimiter = (options = {}) => baseRateLimiter(options);
