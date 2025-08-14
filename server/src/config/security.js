// src/config/security.js
// @ts-nocheck
import rateLimit from "express-rate-limit";

// Constants
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  AUTH_MAX_ATTEMPTS: 5,
};

const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

const rateLimitOptions = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = Date.now() + RATE_LIMIT.WINDOW_MS;
    res.status(429).json({
      status: "error",
      message: "Too many requests, please try again later.",
      retryAfter: Math.ceil(resetTime / 1000),
    });
  },
});

const authRateLimitOptions = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_ATTEMPTS,
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = Date.now() + RATE_LIMIT.AUTH_WINDOW_MS;
    res.status(429).json({
      status: "error",
      message: "Too many login attempts, please try again after an hour.",
      retryAfter: Math.ceil(resetTime / 1000),
    });
  },
});

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self';
    frame-ancestors 'none';
  `
    .replace(/\s+/g, " ")
    .trim(),
};

export const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.CLIENT_URL
      : ["http://localhost:3000"], // Your React app's URL
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

const passwordValidationOptions = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

const uploadOptions = {
  maxFileSize: FILE_LIMITS.MAX_SIZE,
  allowedMimeTypes: FILE_LIMITS.ALLOWED_TYPES,
};

// Validate environment variables
const validateEnvironment = () => {
  const requiredVars = ["NODE_ENV"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
};

// Run validation
validateEnvironment();

export {
  rateLimitOptions,
  authRateLimitOptions,
  securityHeaders,
  cookieOptions,
  passwordValidationOptions,
  uploadOptions,
};
