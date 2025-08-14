// server/src/routes/auth.routes.js
import express from "express";
import authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  validateLogin,
  validateRegistration,
  validatePasswordReset,
  validateEmailVerification,
} from "../middleware/validation.middleware.js";
import { rateLimiter } from "../middleware/rate-limiter.middleware.js";
import logger from "../utils/logger.js";
import { query } from "../config/database.js";

/** @typedef {import('../controllers/auth.controller.js').IAuthController} IAuthController */
/** @typedef {import('../controllers/auth.controller.js').AuthRequest} AuthRequest */

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

/** @type {IAuthController} */
const controller = authController;

// Rate limiter configurations
const rateLimits = {
  login: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  register: {
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: "Too many registration attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: "Too many password reset attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  emailVerification: {
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Too many verification attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  refreshToken: {
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many token refresh attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
};

// Middleware to log requests
const logRequest = (req, res, next) => {
  logger.info(`Auth Route: ${req.method} ${req.path}`);
  logger.info("Request Body:", req.body);
  next();
};

router.use(logRequest);

// Modified route handlers to properly handle Promise returns
router.post(
  "/login",
  rateLimiter(rateLimits.login),
  validateLogin,
  async (req, res, next) => {
    try {
      await controller.login(/** @type {AuthRequest} */ (req), res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/register",
  rateLimiter(rateLimits.register),
  validateRegistration,
  async (req, res, next) => {
    try {
      await controller.register(/** @type {AuthRequest} */ (req), res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/verify-email/:token",
  rateLimiter(rateLimits.emailVerification),
  validateEmailVerification,
  async (req, res, next) => {
    try {
      await controller.verifyEmail(/** @type {AuthRequest} */ (req), res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/request-password-reset",
  rateLimiter(rateLimits.passwordReset),
  async (req, res, next) => {
    try {
      await controller.requestPasswordReset(
        /** @type {AuthRequest} */ (req),
        res
      );
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/reset-password",
  rateLimiter(rateLimits.passwordReset),
  validatePasswordReset,
  async (req, res, next) => {
    try {
      await controller.resetPassword(/** @type {AuthRequest} */ (req), res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/refresh-token",
  rateLimiter(rateLimits.refreshToken),
  async (req, res, next) => {
    try {
      await controller.refreshToken(/** @type {AuthRequest} */ (req), res);
    } catch (error) {
      next(error);
    }
  }
);

router.post("/verify-manual", (req, res) =>
  controller.verifyUserEmail(/** @type {AuthRequest} */ (req), res)
);

// Check if user exists by email (PostgreSQL version)
router.get("/check-user/:email", async (req, res, next) => {
  try {
    const { email } = req.params;

    const userResult = await query(
      "SELECT id, email, name, is_verified FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      res.json({
        exists: false,
        message: "User not found",
      });
      return;
    }

    const user = userResult.rows[0];

    res.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.is_verified,
      },
    });
  } catch (error) {
    logger.error("Error checking user:", error);
    next(error);
  }
});

// Protected routes
router.post("/logout", authenticate(), async (req, res, next) => {
  try {
    await controller.logout(/** @type {AuthRequest} */ (req), res);
  } catch (error) {
    next(error);
  }
});

router.get("/verify", authenticate(), async (req, res, next) => {
  try {
    await controller.verifyAuth(/** @type {AuthRequest} */ (req), res);
  } catch (error) {
    next(error);
  }
});

// Optional routes with type checking
// Routes that don't require email verification
if (typeof controller.resendVerificationEmail === "function") {
  router.post(
    "/resend-verification",
    authenticate({ requireVerified: false }),
    rateLimiter(rateLimits.emailVerification),
    /** @type {import('express').RequestHandler} */
    (req, res) => {
      if (controller.resendVerificationEmail) {
        controller.resendVerificationEmail(
          /** @type {AuthRequest} */ (req),
          res
        );
        return;
      }
      res.status(404).json({ message: "Feature not available" });
    }
  );
}

export default router;
