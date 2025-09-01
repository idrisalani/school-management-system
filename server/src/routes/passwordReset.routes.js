// server/src/routes/passwordReset.routes.js - Fixed Import Issues
import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
// FIX: Import the database module correctly (it exports query function, not pool)
import database from "../config/database.js";
// FIX: Import the default email service export
import emailService from "../services/email.service.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Use the query function from the database module
const { query } = database;

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Request password reset
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

      logger.info("Password reset request", { email });

      // Check if user exists
      const userQuery = "SELECT id, email, name FROM users WHERE email = $1 AND is_verified = true";
      const userResult = await query(userQuery, [email.toLowerCase()]);

      // Always return success to prevent email enumeration
      if (userResult.rows.length === 0) {
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
      SET reset_token = $1, reset_token_expiry = $2 
      WHERE id = $3
    `;
      await query(updateQuery, [resetToken, resetTokenExpiry, user.id]);

      // Send password reset email using the email service
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

      // FIX: Use the email service correctly
      const emailResult = await emailService.sendPasswordResetEmail(
        {
          resetLink: resetUrl,
          name: user.name,
        },
        user.email
      );

      if (!emailResult.success) {
        logger.error("Failed to send password reset email", { error: emailResult.error });
        return res.status(500).json({
          status: "error",
          message: "Failed to send password reset email",
        });
      }

      logger.info("Password reset email sent successfully", {
        email: user.email,
        messageId: emailResult.messageId,
      });

      res.status(200).json({
        status: "success",
        message: "Password reset email sent successfully",
      });
    } catch (error) {
      logger.error("Forgot password error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to process password reset request",
      });
    }
  })
);

// Validate reset token
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

      // Check if token exists and is not expired
      const tokenQuery = `
      SELECT id, email FROM users 
      WHERE reset_token = $1 AND reset_token_expiry > NOW()
    `;
      const result = await query(tokenQuery, [token]);

      if (result.rows.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Invalid or expired reset token",
        });
      }

      res.status(200).json({
        status: "success",
        message: "Valid reset token",
      });
    } catch (error) {
      logger.error("Validate token error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to validate reset token",
      });
    }
  })
);

// Reset password
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    try {
      const { token, password, confirmPassword } = req.body;

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

      // Validate token and get user
      const userQuery = `
      SELECT id, email FROM users 
      WHERE reset_token = $1 AND reset_token_expiry > NOW()
    `;
      const userResult = await query(userQuery, [token]);

      if (userResult.rows.length === 0) {
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
      SET password = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW()
      WHERE id = $2
    `;
      await query(updateQuery, [hashedPassword, user.id]);

      logger.info("Password reset successful", { userId: user.id, email: user.email });

      res.status(200).json({
        status: "success",
        message: "Password reset successfully",
      });
    } catch (error) {
      logger.error("Reset password error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to reset password",
      });
    }
  })
);

export default router;
