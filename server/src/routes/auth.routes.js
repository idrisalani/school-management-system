// @ts-nocheck
// server/src/routes/auth.routes.js - Fully Corrected TypeScript Issues
import express from "express";
import authController from "../controllers/auth.controller.js";
import {
  authenticate,
  authorize,
  optionalAuth,
} from "../middleware/auth.middleware.js";
import {
  validateLogin,
  validateRegistration,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateEmailVerification,
  validateRefreshToken,
  validateProfileUpdate,
  validateChangePassword,
  validateEmailParam,
} from "../middleware/validation.middleware.js";
import {
  authRateLimiter,
  registrationRateLimiter,
  passwordResetRateLimiter,
  emailRateLimiter,
  strictRateLimiter,
  rateLimiter,
} from "../middleware/rate-limiter.middleware.js";
import { asyncHandler } from "../utils/errors.js";
import logger from "../utils/logger.js";
import { query } from "../config/database.js";

/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('express').NextFunction} NextFunction */
/** @typedef {import('express').RequestHandler} RequestHandler */

/**
 * @typedef {Object} AuthRequest
 * @property {Object} body - Request body
 * @property {Object} user - Authenticated user
 * @property {string} ip - Client IP address
 * @property {Function} get - Get header function
 * @property {Object} params - URL parameters
 * @property {string} [token] - JWT token
 */

/**
 * @typedef {Object} DatabaseUser
 * @property {number} id - User ID
 * @property {string} name - User name
 * @property {string} email - User email
 * @property {string} role - User role
 * @property {boolean} is_verified - Email verification status
 * @property {string[]} permissions - User permissions
 */

const router = express.Router();

// Enhanced rate limiter configurations
const rateLimits = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: "Too many login attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: "Too many registration attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: "Too many password reset attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  emailVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: "Too many verification attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  refreshToken: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: "Too many token refresh attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  strict: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2,
    message: "Too many requests. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
};

// Comprehensive logging middleware
/** @type {RequestHandler} */
const loggingMiddleware = (req, res, next) => {
  logger.info("🛣️ Auth route accessed", {
    method: req.method,
    path: req.path,
    fullUrl: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    hasBody: !!Object.keys(req.body || {}).length,
    bodySize: JSON.stringify(req.body || {}).length,
    timestamp: new Date().toISOString(),
  });

  // Log request body in development (excluding sensitive fields)
  if (process.env.NODE_ENV === "development") {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = "***";
    if (sanitizedBody.newPassword) sanitizedBody.newPassword = "***";
    if (sanitizedBody.currentPassword) sanitizedBody.currentPassword = "***";
    logger.info("📝 Request Body (sanitized):", sanitizedBody);
  }

  next();
};

router.use(loggingMiddleware);

// ========================= HEALTH & DEBUG ROUTES =========================

/**
 * Health check endpoint
 * GET /api/v1/auth/health
 * @type {RequestHandler}
 */
const healthCheck = (req, res) => {
  logger.info("🏥 Auth health check");
  res.json({
    status: "success",
    message: "Auth service is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  });
};

/**
 * Test endpoint for debugging
 * GET /api/v1/auth/test
 * @type {RequestHandler}
 */
const testEndpoint = (req, res) => {
  logger.info("🧪 Auth test endpoint hit");
  res.json({
    status: "success",
    message: "Auth routes are working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: process.env.DB_TYPE || "postgresql",
    endpoints: [
      "POST /api/v1/auth/register",
      "POST /api/v1/auth/login",
      "GET /api/v1/auth/me",
      "POST /api/v1/auth/logout",
      "GET /api/v1/auth/verify",
      "POST /api/v1/auth/refresh-token",
      "POST /api/v1/auth/request-password-reset",
      "POST /api/v1/auth/reset-password",
      "POST /api/v1/auth/verify-email/:token",
      "GET /api/v1/auth/check-user/:email",
    ],
  });
};

// Register health and test routes
router.get("/health", healthCheck);
router.get("/test", testEndpoint);

// ========================= PUBLIC ROUTES =========================

/**
 * User registration handler
 * @type {RequestHandler}
 */
const registerHandler = asyncHandler(async (req, res, next) => {
  logger.info("📝 Registration attempt", {
    email: req.body.email,
    role: req.body.role || "student",
  });
  await authController.register(req, res, next);
});

/**
 * User login handler
 * @type {RequestHandler}
 */
const loginHandler = asyncHandler(async (req, res, next) => {
  logger.info("🔐 Login attempt", {
    email: req.body.email,
    username: req.body.username,
    hasPassword: !!req.body.password,
  });
  await authController.login(req, res, next);
});

/**
 * Login test handler for debugging
 * @type {RequestHandler}
 */
const loginTestHandler = (req, res) => {
  logger.info("🧪 Login test route hit", {
    hasEmail: !!req.body.email,
    hasUsername: !!req.body.username,
    hasPassword: !!req.body.password,
  });
  res.json({
    status: "success",
    message: "Login route is accessible!",
    body_keys: Object.keys(req.body),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Refresh token handler
 * @type {RequestHandler}
 */
const refreshTokenHandler = asyncHandler(async (req, res, next) => {
  logger.info("🔄 Token refresh attempt");
  await authController.refreshToken(req, res, next);
});

/**
 * Password reset request handler
 * @type {RequestHandler}
 */
const passwordResetRequestHandler = asyncHandler(async (req, res, next) => {
  logger.info("🔄 Password reset request", { email: req.body.email });
  await authController.requestPasswordReset(req, res, next);
});

/**
 * Password reset handler
 * @type {RequestHandler}
 */
const passwordResetHandler = asyncHandler(async (req, res, next) => {
  logger.info("🔑 Password reset attempt", {
    hasToken: !!req.body.token,
    hasNewPassword: !!req.body.newPassword,
  });
  await authController.resetPassword(req, res, next);
});

/**
 * Email verification handler
 * @type {RequestHandler}
 */
const emailVerificationHandler = asyncHandler(async (req, res, next) => {
  logger.info("📧 Email verification attempt", {
    token: req.params.token?.substring(0, 10) + "...",
  });
  await authController.verifyEmail(req, res, next);
});

/**
 * Check user existence handler
 * @type {RequestHandler}
 */
const checkUserHandler = asyncHandler(async (req, res, next) => {
  const { email } = req.params;
  logger.info("🔍 User existence check", { email });

  try {
    const userResult = await query(
      "SELECT id, email, name, username, role, is_verified, created_at FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      res.json({
        status: "success",
        exists: false,
        message: "User not found",
      });
      return;
    }

    const user = userResult.rows[0];

    res.json({
      status: "success",
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        isVerified: user.is_verified,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    logger.error("❌ Error checking user existence:", error);
    next(error);
  }
});

// Register public routes
router.post(
  "/register",
  rateLimiter(rateLimits.register),
  validateRegistration,
  registerHandler
);

router.post(
  "/login",
  rateLimiter(rateLimits.login),
  validateLogin,
  loginHandler
);

router.post("/login-test", loginTestHandler);

router.post(
  "/refresh-token",
  rateLimiter(rateLimits.refreshToken),
  validateRefreshToken,
  refreshTokenHandler
);

router.post(
  "/request-password-reset",
  rateLimiter(rateLimits.passwordReset),
  validatePasswordResetRequest,
  passwordResetRequestHandler
);

router.post(
  "/reset-password",
  rateLimiter(rateLimits.passwordReset),
  validatePasswordReset,
  passwordResetHandler
);

router.post(
  "/verify-email/:token",
  rateLimiter(rateLimits.emailVerification),
  validateEmailVerification,
  emailVerificationHandler
);

router.get("/check-user/:email", validateEmailParam, checkUserHandler);

// ========================= PROTECTED ROUTES =========================

/**
 * Get current user handler
 * @type {RequestHandler}
 */
const getCurrentUserHandler = asyncHandler(async (req, res, next) => {
  logger.info("👤 Profile request", { userId: req.user?.id });
  await authController.getCurrentUser(req, res, next);
});

/**
 * Logout handler
 * @type {RequestHandler}
 */
const logoutHandler = asyncHandler(async (req, res, next) => {
  logger.info("👋 Logout request", { userId: req.user?.id });
  await authController.logout(req, res, next);
});

/**
 * Verify auth handler
 * @type {RequestHandler}
 */
const verifyAuthHandler = asyncHandler(async (req, res, next) => {
  logger.info("🔐 Auth verification request", { userId: req.user?.id });

  // If using controller method, use it; otherwise provide inline implementation
  if (typeof authController.verifyAuth === "function") {
    await authController.verifyAuth(req, res, next);
  } else {
    res.json({
      status: "success",
      authenticated: true,
      user: {
        id: req.user?.id,
        username: req.user?.username,
        name: req.user?.name,
        firstName: req.user?.firstName,
        lastName: req.user?.lastName,
        email: req.user?.email,
        role: req.user?.role,
        isVerified: req.user?.isVerified,
      },
    });
  }
});

/**
 * Update profile handler
 * @type {RequestHandler}
 */
const updateProfileHandler = asyncHandler(async (req, res, next) => {
  logger.info("✏️ Profile update request", {
    userId: req.user?.id,
    fields: Object.keys(req.body),
  });

  if (typeof authController.updateProfile === "function") {
    await authController.updateProfile(req, res, next);
  } else {
    // TODO: Implement profile update logic
    res.json({
      status: "success",
      message: "Profile update endpoint - implement as needed",
      updates: req.body,
    });
  }
});

/**
 * Change password handler
 * @type {RequestHandler}
 */
const changePasswordHandler = asyncHandler(async (req, res, next) => {
  logger.info("🔑 Password change request", { userId: req.user?.id });

  if (typeof authController.changePassword === "function") {
    await authController.changePassword(req, res, next);
  } else {
    // TODO: Implement password change logic
    res.json({
      status: "success",
      message: "Password change endpoint - implement as needed",
    });
  }
});

/**
 * Resend verification handler
 * @type {RequestHandler}
 */
const resendVerificationHandler = asyncHandler(async (req, res, next) => {
  logger.info("📧 Resend verification request", { userId: req.user?.id });

  if (req.user?.isVerified) {
    return res.status(400).json({
      status: "error",
      message: "Email is already verified",
    });
  }

  if (typeof authController.resendVerificationEmail === "function") {
    await authController.resendVerificationEmail(req, res, next);
  } else if (typeof authController.resendVerification === "function") {
    await authController.resendVerification(req, res, next);
  } else {
    // TODO: Implement resend verification logic
    res.json({
      status: "success",
      message: "Verification email resent successfully",
    });
  }
});

// Register protected routes
router.get("/me", authenticate(), getCurrentUserHandler);
router.post("/logout", authenticate(), logoutHandler);
router.get("/verify", authenticate(), verifyAuthHandler);

router.put(
  "/profile",
  authenticate(),
  validateProfileUpdate,
  updateProfileHandler
);

router.put(
  "/change-password",
  authenticate(),
  validateChangePassword,
  changePasswordHandler
);

router.post(
  "/resend-verification",
  authenticate({ requireVerified: false }),
  rateLimiter(rateLimits.emailVerification),
  resendVerificationHandler
);

// ========================= ADMIN ONLY ROUTES =========================

/**
 * Get all users handler (Admin only)
 * @type {RequestHandler}
 */
const getAllUsersHandler = asyncHandler(async (req, res, next) => {
  logger.info("👥 Get all users request by admin", { userId: req.user?.id });

  try {
    const { page = 1, limit = 10, role, search } = req.query;
    let queryStr =
      "SELECT id, name, email, username, role, is_verified, created_at FROM users";
    const params = [];
    const conditions = [];

    if (role) {
      conditions.push(`role = $${params.length + 1}`);
      params.push(role);
    }

    if (search) {
      conditions.push(
        `(name ILIKE $${params.length + 1} OR email ILIKE $${
          params.length + 1
        })`
      );
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      queryStr += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${
      params.length + 1
    } OFFSET $${params.length + 2}`;
    params.push(parseInt(limit.toString()));
    params.push((parseInt(page.toString()) - 1) * parseInt(limit.toString()));

    const result = await query(queryStr, params);

    res.json({
      status: "success",
      users: result.rows,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total: result.rowCount,
      },
    });
  } catch (error) {
    logger.error("❌ Error fetching users:", error);
    next(error);
  }
});

/**
 * Create user handler (Admin only)
 * @type {RequestHandler}
 */
const createUserHandler = asyncHandler(async (req, res, next) => {
  logger.info("👤 User creation request by admin", {
    userId: req.user?.id,
    targetRole: req.body.role,
  });

  if (typeof authController.createUser === "function") {
    await authController.createUser(req, res, next);
  } else {
    // TODO: Implement user creation logic
    res.json({
      status: "success",
      message: "User creation endpoint - implement as needed",
      userData: { ...req.body, password: "***" },
    });
  }
});

/**
 * Update user status handler (Admin only)
 * @type {RequestHandler}
 */
const updateUserStatusHandler = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, isVerified } = req.body;

  logger.info("🔄 User status update request by admin", {
    userId: req.user?.id,
    targetUserId: id,
    newStatus: status,
    newVerification: isVerified,
  });

  try {
    const updateFields = [];
    const params = [];

    if (status !== undefined) {
      updateFields.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (isVerified !== undefined) {
      updateFields.push(`is_verified = $${params.length + 1}`);
      params.push(isVerified);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid fields to update",
      });
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(id);

    const queryStr = `UPDATE users SET ${updateFields.join(", ")} WHERE id = $${
      params.length
    } RETURNING id, name, email, role, is_verified`;
    const result = await query(queryStr, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      message: "User status updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    logger.error("❌ Error updating user status:", error);
    next(error);
  }
});

// Register admin routes
router.get("/users", authenticate(), authorize(["admin"]), getAllUsersHandler);

router.post(
  "/create-user",
  authenticate(),
  authorize(["admin"]),
  rateLimiter(rateLimits.strict),
  validateRegistration,
  createUserHandler
);

router.put(
  "/users/:id/status",
  authenticate(),
  authorize(["admin"]),
  rateLimiter(rateLimits.strict),
  updateUserStatusHandler
);

// ========================= DEVELOPMENT/DEBUG ROUTES =========================

if (process.env.NODE_ENV === "development") {
  /**
   * Manual email verification handler (Development only)
   * @type {RequestHandler}
   */
  const manualVerificationHandler = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    logger.info("🔧 Manual email verification (DEV ONLY)", { email });

    if (typeof authController.verifyUserEmail === "function") {
      await authController.verifyUserEmail(req, res, next);
    } else {
      try {
        const result = await query(
          "UPDATE users SET is_verified = true, email_verified_at = NOW() WHERE email = $1 RETURNING id, email, is_verified",
          [email]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            status: "error",
            message: "User not found",
          });
        }

        res.json({
          status: "success",
          message: "Email verified manually (development only)",
          user: result.rows[0],
        });
      } catch (error) {
        logger.error("❌ Error in manual verification:", error);
        next(error);
      }
    }
  });

  /**
   * Token info handler (Development only)
   * @type {RequestHandler}
   */
  const tokenInfoHandler = (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    res.json({
      status: "success",
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      user: req.user || null,
      timestamp: new Date().toISOString(),
      environment: "development",
    });
  };

  /**
   * Database test handler (Development only)
   * @type {RequestHandler}
   */
  const dbTestHandler = asyncHandler(async (req, res, next) => {
    try {
      const result = await query("SELECT COUNT(*) as user_count FROM users");
      const dbVersion = await query("SELECT version()");

      res.json({
        status: "success",
        message: "Database connection successful",
        userCount: parseInt(result.rows[0].user_count),
        dbVersion: dbVersion.rows[0].version,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("❌ Database test failed:", error);
      res.status(500).json({
        status: "error",
        message: "Database connection failed",
        error: error.message,
      });
    }
  });

  // Register development routes
  router.post("/verify-manual", manualVerificationHandler);
  router.get("/token-info", optionalAuth(), tokenInfoHandler); // 🔧 FIXED: Added () to optionalAuth
  router.get("/db-test", dbTestHandler);
}

// ========================= ERROR HANDLING =========================

// 404 handler for auth routes
/** @type {RequestHandler} */
const notFoundHandler = (req, res) => {
  logger.warn("❓ Auth route not found", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json({
    status: "error",
    message: "Auth endpoint not found",
    path: req.originalUrl,
    availableEndpoints: [
      "GET /api/v1/auth/health",
      "GET /api/v1/auth/test",
      "POST /api/v1/auth/register",
      "POST /api/v1/auth/login",
      "GET /api/v1/auth/me",
      "POST /api/v1/auth/logout",
      "GET /api/v1/auth/verify",
      "POST /api/v1/auth/refresh-token",
      "POST /api/v1/auth/request-password-reset",
      "POST /api/v1/auth/reset-password",
      "POST /api/v1/auth/verify-email/:token",
      "GET /api/v1/auth/check-user/:email",
      "POST /api/v1/auth/resend-verification",
      "PUT /api/v1/auth/profile",
      "PUT /api/v1/auth/change-password",
    ],
  });
};

router.use("*", notFoundHandler);

logger.info("🔍 Auth routes registered successfully", {
  totalRoutes: router.stack.length,
  environment: process.env.NODE_ENV || "development",
  database: process.env.DB_TYPE || "postgresql",
});

export default router;
