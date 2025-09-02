// server/src/routes/passwordReset.routes.js - CommonJS Version
const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Import services with fallback handling
let emailService;
try {
  emailService = require("../services/email.service");
} catch (error) {
  console.warn("Could not import email service for password reset");
  emailService = null;
}

// Simple logging
const log = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

const router = express.Router();

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
      if (!emailService) {
        log.error("Email service not available for password reset");
        return res.status(500).json({
          status: "error",
          message: "Email service temporarily unavailable",
        });
      }

      const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

      let emailResult;

      // Try to use sendPasswordResetEmail method, fallback to generic sendEmail
      if (typeof emailService.sendPasswordResetEmail === "function") {
        emailResult = await emailService.sendPasswordResetEmail(
          {
            resetLink: resetUrl,
            name: user.name || user.username,
          },
          user.email
        );
      } else {
        // Fallback to generic sendEmail method
        log.warn("sendPasswordResetEmail method not found, using generic sendEmail");
        emailResult = await emailService.sendEmail({
          to: user.email,
          subject: "Password Reset - School Management System",
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f56565;">Password Reset Request</h2>
            <p>Hello ${user.name || user.username},</p>
            <p>You requested to reset your password for your School Management System account.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetUrl}" style="background: #f56565; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link expires in 1 hour</li>
              <li>If you didn't request this, ignore this email</li>
            </ul>
            <p>If the button doesn't work, copy this link: ${resetUrl}</p>
            <p>Best regards,<br>The School Management Team</p>
          </div>
        `,
          text: `
Password Reset Request - School Management System

Hello ${user.name || user.username},

You requested to reset your password. To reset your password, visit: ${resetUrl}

This link expires in 1 hour. If you didn't request this, ignore this email.

Best regards,
The School Management Team
        `,
        });
      }

      if (!emailResult.success) {
        log.error("Failed to send password reset email", {
          error: emailResult.error,
          email: user.email,
        });
        return res.status(500).json({
          status: "error",
          message: "Failed to send password reset email",
        });
      }

      log.info("Password reset email sent successfully", {
        email: user.email,
        messageId: emailResult.messageId,
        mode: emailResult.mode,
      });

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

      if (!emailService) {
        return res.status(500).json({
          status: "error",
          message: "Email service not available",
        });
      }

      // Send test reset email
      const testResetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/test-token-123`;

      let emailResult;

      // Try to use sendPasswordResetEmail method, fallback to generic sendEmail
      if (typeof emailService.sendPasswordResetEmail === "function") {
        emailResult = await emailService.sendPasswordResetEmail(
          {
            resetLink: testResetUrl,
            name: "Test User",
          },
          email
        );
      } else {
        // Fallback to generic sendEmail method
        emailResult = await emailService.sendEmail({
          to: email,
          subject: "Test Password Reset - School Management System",
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f56565;">Test Password Reset Request</h2>
            <p>Hello Test User,</p>
            <p>This is a test password reset email from your School Management System.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${testResetUrl}" style="background: #f56565; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
            <p><strong>Note:</strong> This is a test email with a test token.</p>
            <p>Best regards,<br>The School Management Team</p>
          </div>
        `,
          text: `Test Password Reset - School Management System\n\nThis is a test password reset email.\n\nReset link: ${testResetUrl}\n\nBest regards,\nThe School Management Team`,
        });
      }

      return res.json({
        status: emailResult.success ? "success" : "error",
        message: emailResult.success
          ? "Test password reset email sent successfully"
          : "Failed to send test email",
        emailResult: emailResult,
        emailService: emailService.getStatus(),
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

module.exports = router;
