// server/src/routes/passwordReset.routes.js - ES6 Version
import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Import email service with error handling
let emailService = null;
let emailServiceError = null;

try {
  const { default: importedEmailService } = await import("../services/email.service.js");
  emailService = importedEmailService;

  // Verify the email service has the methods we need
  const requiredMethods = ["sendPasswordResetEmail", "sendEmail", "getStatus"];
  const missingMethods = requiredMethods.filter(
    (method) => typeof emailService[method] !== "function"
  );

  if (missingMethods.length > 0) {
    console.warn(`Email service missing methods: ${missingMethods.join(", ")}`);
    emailServiceError = `Missing methods: ${missingMethods.join(", ")}`;
  }
} catch (error) {
  console.warn("Could not import email service for password reset:", error.message);
  emailServiceError = error.message;
}

const router = express.Router();

// Create a safe email service wrapper
const safeEmailService = {
  isAvailable: () => !!emailService && !emailServiceError,

  getStatus: () => {
    if (!emailService || typeof emailService.getStatus !== "function") {
      return {
        configured: false,
        mode: "unavailable",
        error: emailServiceError || "Email service not loaded",
        hasApiKey: !!process.env.BREVO_API_KEY,
      };
    }
    return emailService.getStatus();
  },

  sendPasswordResetEmail: async (resetData, to) => {
    const { resetLink, name } = resetData;

    if (!emailService || typeof emailService.sendPasswordResetEmail !== "function") {
      // Fallback to generic sendEmail if available
      if (emailService && typeof emailService.sendEmail === "function") {
        return await emailService.sendEmail({
          to: to,
          subject: "Password Reset - School Management System",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #f56565;">Password Reset Request</h2>
              <p>Hello ${name || "User"},</p>
              <p>You requested to reset your password for your School Management System account.</p>
              <p>Click the link below to reset your password:</p>
              <p><a href="${resetLink}" style="background: #f56565; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
              <p><strong>Important:</strong></p>
              <ul>
                <li>This link expires in 1 hour</li>
                <li>If you didn't request this, ignore this email</li>
              </ul>
              <p>If the button doesn't work, copy this link: ${resetLink}</p>
              <p>Best regards,<br>The School Management Team</p>
            </div>
          `,
          text: `
Password Reset Request - School Management System

Hello ${name || "User"},

You requested to reset your password. To reset your password, visit: ${resetLink}

This link expires in 1 hour. If you didn't request this, ignore this email.

Best regards,
The School Management Team
          `,
        });
      }

      // Complete fallback - mock response
      return {
        success: false,
        error: "Password reset email service not available",
        mode: "mock",
        mockMessage: `Would send password reset email to ${to} with link: ${resetLink}`,
        serviceError: emailServiceError,
      };
    }

    return await emailService.sendPasswordResetEmail(resetData, to);
  },
};

// Simple logging
const log = {
  info: (message, meta = {}) =>
    console.log(`[INFO] ${message}`, Object.keys(meta).length > 0 ? meta : ""),
  error: (message, meta = {}) =>
    console.error(`[ERROR] ${message}`, Object.keys(meta).length > 0 ? meta : ""),
  warn: (message, meta = {}) =>
    console.warn(`[WARN] ${message}`, Object.keys(meta).length > 0 ? meta : ""),
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Helper to get database pool
const getPool = (req) => {
  return req.app.locals.pool;
};

/**
 * Request password reset
 * POST /api/password-reset/forgot-password
 */
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: "error",
          message: "Email is required",
        });
      }

      const pool = getPool(req);
      if (!pool) {
        return res.status(500).json({
          status: "error",
          message: "Database not available",
        });
      }

      log.info("Password reset request", { email });

      // Check if user exists
      const userQuery = `
      SELECT id, email, username, 
             COALESCE(first_name || ' ' || last_name, username) as name 
      FROM users 
      WHERE LOWER(email) = LOWER($1)
    `;
      const userResult = await pool.query(userQuery, [email.toLowerCase()]);

      // Always return success to prevent email enumeration
      if (userResult.rows.length === 0) {
        log.warn("Password reset requested for non-existent email", { email });
        return res.status(200).json({
          status: "success",
          message: "If an account with that email exists, you will receive a password reset link.",
        });
      }

      const user = userResult.rows[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database
      const updateQuery = `
      UPDATE users 
      SET reset_token = $1, reset_token_expiry = $2, updated_at = NOW()
      WHERE id = $3
    `;
      await pool.query(updateQuery, [resetToken, resetTokenExpiry, user.id]);

      // Send password reset email
      if (!safeEmailService.isAvailable()) {
        log.error("Email service not available for password reset");
        return res.status(500).json({
          status: "error",
          message: "Email service temporarily unavailable",
        });
      }

      const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

      const emailResult = await safeEmailService.sendPasswordResetEmail(
        {
          resetLink: resetUrl,
          name: user.name || user.username,
        },
        user.email
      );

      if (!emailResult.success) {
        log.error("Failed to send password reset email", {
          error: emailResult.error,
          email: user.email,
        });

        // Don't fail completely if email fails, but log it
        if (emailResult.mode === "mock") {
          log.info("Password reset email mocked", {
            email: user.email,
            mockMessage: emailResult.mockMessage,
          });
        } else {
          return res.status(500).json({
            status: "error",
            message: "Failed to send password reset email",
          });
        }
      } else {
        log.info("Password reset email sent successfully", {
          email: user.email,
          messageId: emailResult.messageId,
          mode: emailResult.mode,
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Password reset email sent successfully",
      });
    } catch (error) {
      log.error("Forgot password error:", { error: error.message });
      return res.status(500).json({
        status: "error",
        message: "Failed to process password reset request",
      });
    }
  })
);

/**
 * Validate reset token
 * GET /api/password-reset/validate-reset-token/:token
 */
router.get(
  "/validate-reset-token/:token",
  asyncHandler(async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          status: "error",
          message: "Reset token is required",
        });
      }

      const pool = getPool(req);
      if (!pool) {
        return res.status(500).json({
          status: "error",
          message: "Database not available",
        });
      }

      // Check if token exists and is not expired
      const tokenQuery = `
      SELECT id, email FROM users 
      WHERE reset_token = $1 AND reset_token_expiry > NOW()
    `;
      const result = await pool.query(tokenQuery, [token]);

      if (result.rows.length === 0) {
        log.warn("Invalid or expired reset token used", { token: token.substring(0, 8) + "..." });
        return res.status(400).json({
          status: "error",
          message: "Invalid or expired reset token",
        });
      }

      log.info("Valid reset token validated", {
        email: result.rows[0].email,
        token: token.substring(0, 8) + "...",
      });

      return res.status(200).json({
        status: "success",
        message: "Valid reset token",
      });
    } catch (error) {
      log.error("Validate token error:", { error: error.message });
      return res.status(500).json({
        status: "error",
        message: "Failed to validate reset token",
      });
    }
  })
);

/**
 * Reset password
 * POST /api/password-reset/reset-password
 */
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    try {
      const { token, password, confirmPassword } = req.body;

      // Validation
      if (!token || !password || !confirmPassword) {
        return res.status(400).json({
          status: "error",
          message: "Token, password, and confirmation are required",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          status: "error",
          message: "Passwords do not match",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          status: "error",
          message: "Password must be at least 6 characters long",
        });
      }

      const pool = getPool(req);
      if (!pool) {
        return res.status(500).json({
          status: "error",
          message: "Database not available",
        });
      }

      // Validate token and get user
      const userQuery = `
      SELECT id, email FROM users 
      WHERE reset_token = $1 AND reset_token_expiry > NOW()
    `;
      const userResult = await pool.query(userQuery, [token]);

      if (userResult.rows.length === 0) {
        log.warn("Password reset attempted with invalid/expired token", {
          token: token.substring(0, 8) + "...",
        });
        return res.status(400).json({
          status: "error",
          message: "Invalid or expired reset token",
        });
      }

      const user = userResult.rows[0];

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update password and clear reset token
      const updateQuery = `
      UPDATE users 
      SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW()
      WHERE id = $2
    `;
      await pool.query(updateQuery, [hashedPassword, user.id]);

      log.info("Password reset completed successfully", {
        userId: user.id,
        email: user.email,
      });

      return res.status(200).json({
        status: "success",
        message: "Password reset successfully",
      });
    } catch (error) {
      log.error("Reset password error:", { error: error.message });
      return res.status(500).json({
        status: "error",
        message: "Failed to reset password",
      });
    }
  })
);

/**
 * Test password reset email (for development)
 * POST /api/password-reset/test-email
 */
router.post(
  "/test-email",
  asyncHandler(async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: "error",
          message: "Email is required for testing",
        });
      }

      if (!safeEmailService.isAvailable()) {
        return res.status(500).json({
          status: "error",
          message: "Email service not available",
          serviceStatus: safeEmailService.getStatus(),
        });
      }

      // Send test reset email
      const testResetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/test-token-123`;

      const emailResult = await safeEmailService.sendPasswordResetEmail(
        {
          resetLink: testResetUrl,
          name: "Test User",
        },
        email
      );

      return res.json({
        status: emailResult.success ? "success" : "error",
        message: emailResult.success
          ? "Test password reset email sent successfully"
          : "Failed to send test email",
        emailResult: emailResult,
        emailService: safeEmailService.getStatus(),
      });
    } catch (error) {
      log.error("Test email error:", { error: error.message });
      return res.status(500).json({
        status: "error",
        message: "Failed to send test email",
        error: error.message,
      });
    }
  })
);

/**
 * Get password reset service status
 * GET /api/password-reset/status
 */
router.get("/status", (req, res) => {
  try {
    const serviceStatus = safeEmailService.getStatus();

    return res.json({
      status: "success",
      message: "Password reset service status",
      emailService: {
        available: safeEmailService.isAvailable(),
        ...serviceStatus,
        error: emailServiceError,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasBrevoKey: !!process.env.BREVO_API_KEY,
        hasClientUrl: !!process.env.CLIENT_URL,
        clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Status check error:", { error: error.message });
    return res.status(500).json({
      status: "error",
      message: "Failed to get service status",
      error: error.message,
    });
  }
});

export default router;
