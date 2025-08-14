// server/src/controllers/auth.controller.js - Updated with Enhanced Email Service
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { validateEmail, validatePassword } from "../utils/validators.js";
import {
  generateResetToken,
  generateVerificationToken,
} from "../utils/tokens.js";
import emailService from "../services/email.service.js"; // Updated import
import logger from "../utils/logger.js";
import { ApiError } from "../utils/errors.js";
import { createAuditLog } from "../services/audit.service.js";

// PostgreSQL connection
import pkg from "pg";
const { Pool } = pkg;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

/** @typedef {import('../types/auth').AuthRequest} AuthRequest */
/** @typedef {import('express').Response} ExpressResponse */
/** @typedef {import('../types/auth').IAuthController} IAuthController */

// Validate JWT secrets
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_VERIFICATION_SECRET = process.env.JWT_VERIFICATION_SECRET;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET;

if (
  !JWT_ACCESS_SECRET ||
  !JWT_REFRESH_SECRET ||
  !JWT_VERIFICATION_SECRET ||
  !JWT_RESET_SECRET
) {
  throw new Error("JWT secrets must be configured");
}

/**
 * Convert database row to auth user
 * @param {any} row - PostgreSQL user row
 * @returns {import('../types/auth').AuthUser}
 */
function toAuthUser(row) {
  return {
    _id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim() || row.username,
    email: row.email,
    role: row.role,
    permissions: [],
    isEmailVerified: row.is_verified || false,
    lastLogin: row.last_login_at,
  };
}

/**
 * Parse full name into first and last names and generate username
 * @param {string} fullName - Full name to parse
 * @returns {{firstName: string, lastName: string, username: string}}
 */
function parseNames(fullName) {
  if (!fullName || typeof fullName !== "string") {
    return { firstName: "", lastName: "", username: "" };
  }

  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Generate username as "first.last" in lowercase
  const username = `${firstName.toLowerCase()}${
    lastName ? "." + lastName.toLowerCase().replace(/\s+/g, ".") : ""
  }`;

  return { firstName, lastName, username };
}

/** @implements {IAuthController} */
class AuthController {
  /**
   * User login (accepts username or email)
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async login(req, res) {
    try {
      const { email, username, password } = req.body;
      const loginIdentifier = username || email; // Accept either username or email

      logger.info("Login attempt for identifier:", loginIdentifier);

      if (!loginIdentifier || !password) {
        logger.info("Missing login identifier or password");
        return res.status(400).json({
          success: false,
          message: "Username/email and password are required",
        });
      }

      // Find user by email OR username in PostgreSQL
      const userQuery = await pool.query(
        "SELECT id, username, first_name, last_name, email, password_hash, role, is_verified, last_login_at FROM users WHERE email = $1 OR username = $1",
        [loginIdentifier.toLowerCase()]
      );

      if (userQuery.rows.length === 0) {
        logger.info("No user found with identifier:", loginIdentifier);
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const user = userQuery.rows[0];
      logger.info("User found:", user.username);

      const isMatch = await bcrypt.compare(password, user.password_hash);
      logger.info("Password match:", isMatch ? "Yes" : "No");

      if (!isMatch) {
        logger.info("Password does not match");
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      if (!user.is_verified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email before logging in",
        });
      }

      const authUser = toAuthUser(user);
      const accessToken = this.generateAccessToken(authUser);
      const refreshToken = this.generateRefreshToken(authUser);

      // Update last login
      await pool.query(
        "UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
        [user.id]
      );

      await createAuditLog({
        action: "LOGIN",
        userId: user.id,
        details: "User logged in successfully",
      });

      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: `${user.first_name} ${user.last_name}`.trim(),
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          permissions: [],
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      logger.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during login",
      });
    }
  }

  /**
   * User registration
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async register(req, res) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Accept both 'name' and 'username' for backward compatibility
      const { email, password, name, username, role } = req.body;

      // Use username if provided, otherwise fall back to name
      const fullName = username || name;

      logger.info("Registration attempt:", { email, fullName, role });

      // Validate required fields
      if (!email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: "Username, email, and password are required",
        });
      }

      // Validate email format
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      // Validate password strength
      if (!validatePassword(password)) {
        return res.status(400).json({
          success: false,
          message: "Password does not meet requirements",
        });
      }

      // Parse full name into first and last names and generate username
      const {
        firstName,
        lastName,
        username: generatedUsername,
      } = parseNames(fullName);

      // Check for existing user by email or username
      const existingUserQuery = await client.query(
        "SELECT id FROM users WHERE email = $1 OR username = $2",
        [email.toLowerCase(), generatedUsername]
      );

      if (existingUserQuery.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Email or username already registered",
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user with parsed names and generated username
      const insertQuery = `
        INSERT INTO users (
          username, first_name, last_name, email, password_hash, role, 
          is_verified, created_at, updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
        RETURNING id, username, first_name, last_name, email, role, created_at
      `;

      const newUserQuery = await client.query(insertQuery, [
        generatedUsername, // Generated username like "idris.alamutu"
        firstName,
        lastName,
        email.toLowerCase(),
        hashedPassword,
        role || "student",
        false, // is_verified = false initially
      ]);

      const newUser = newUserQuery.rows[0];
      logger.info("User created:", {
        userId: newUser.id,
        username: generatedUsername,
        fullName,
        firstName,
        lastName,
      });

      await client.query("COMMIT");

      // Generate verification token
      const verificationToken = generateVerificationToken(newUser.id);

      // Send success response with parsed name data and username
      const successResponse = {
        success: true,
        message:
          "Registration successful. Please check your email for verification and login credentials.",
        userId: newUser.id,
        user: {
          id: newUser.id,
          username: generatedUsername,
          name: fullName,
          firstName: firstName,
          lastName: lastName,
          email: email.toLowerCase(),
          role: role || "student",
        },
      };

      // Send welcome email with username in background using enhanced email service
      setImmediate(async () => {
        try {
          await emailService.sendTemplate(
            "welcomeEmail",
            {
              name: fullName,
              username: generatedUsername, // ✅ Now included
              email: email.toLowerCase(),
              verificationLink: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`,
            },
            email.toLowerCase()
          );
        } catch (emailError) {
          logger.error("Failed to send welcome email:", emailError);
        }
      });

      return res.status(201).json(successResponse);
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Registration error:", error);

      return res.status(500).json({
        success: false,
        message: "Registration failed. Please try again.",
      });
    } finally {
      client.release();
    }
  }

  /**
   * User logout
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async logout(req, res) {
    try {
      const userId = req.user?._id;

      if (userId) {
        await createAuditLog({
          action: "LOGOUT",
          userId: userId,
          details: "User logged out successfully",
        });

        logger.info("User logged out:", userId);
      }

      return res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Logout error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during logout",
      });
    }
  }

  /**
   * Request password reset
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      // Find user by email
      const userQuery = await pool.query(
        "SELECT id, email, first_name, last_name FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (userQuery.rows.length === 0) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: "If the email exists, a password reset link has been sent",
        });
      }

      const user = userQuery.rows[0];
      const resetToken = generateResetToken(user.id);

      // Store reset token in database with expiration
      await pool.query(
        "UPDATE users SET reset_token = $1, reset_token_expires = $2, updated_at = NOW() WHERE id = $3",
        [resetToken, new Date(Date.now() + 3600000), user.id] // 1 hour expiration
      );

      // Send password reset email using enhanced email service
      await emailService.sendTemplate(
        "passwordReset",
        {
          resetLink: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
        },
        user.email
      );

      await createAuditLog({
        action: "PASSWORD_RESET_REQUESTED",
        userId: user.id,
        details: "Password reset requested",
      });

      logger.info("Password reset requested for user:", user.email);

      return res.json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      });
    } catch (error) {
      logger.error("Password reset request error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing your request",
      });
    }
  }

  /**
   * Reset password using token
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async resetPassword(req, res) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Token and new password are required",
        });
      }

      if (!validatePassword(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "Password does not meet requirements",
        });
      }

      // Verify reset token
      const decoded = await this.verifyResetToken(token);

      // Find user with valid reset token
      const userQuery = await client.query(
        "SELECT id, email, reset_token, reset_token_expires FROM users WHERE id = $1 AND reset_token = $2",
        [decoded.userId, token]
      );

      if (userQuery.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      const user = userQuery.rows[0];

      // Check if token has expired
      if (new Date() > new Date(user.reset_token_expires)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Reset token has expired",
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      await client.query(
        "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2",
        [hashedPassword, user.id]
      );

      await client.query("COMMIT");

      await createAuditLog({
        action: "PASSWORD_RESET_COMPLETED",
        userId: user.id,
        details: "Password reset completed successfully",
      });

      logger.info("Password reset completed for user:", user.email);

      return res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Password reset error:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    } finally {
      client.release();
    }
  }

  /**
   * Refresh access token
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      // Verify refresh token
      const decoded = await this.verifyRefreshToken(refreshToken);

      // Find user
      const userQuery = await pool.query(
        "SELECT id, username, first_name, last_name, email, role, is_verified FROM users WHERE id = $1",
        [decoded.userId]
      );

      if (userQuery.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      const user = userQuery.rows[0];

      if (!user.is_verified) {
        return res.status(403).json({
          success: false,
          message: "Account not verified",
        });
      }

      const authUser = toAuthUser(user);
      const newAccessToken = this.generateAccessToken(authUser);
      const newRefreshToken = this.generateRefreshToken(authUser);

      logger.info("Token refreshed for user:", user.username);

      return res.json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      logger.error("Token refresh error:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  }

  /**
   * Get current user profile
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userQuery = await pool.query(
        "SELECT id, username, first_name, last_name, email, role, phone, address, date_of_birth, profile_image_url, is_verified, last_login_at, created_at FROM users WHERE id = $1",
        [userId]
      );

      if (userQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = userQuery.rows[0];

      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: `${user.first_name} ${user.last_name}`.trim(),
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          dateOfBirth: user.date_of_birth,
          profileImageUrl: user.profile_image_url,
          isEmailVerified: user.is_verified,
          lastLogin: user.last_login_at,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      logger.error("Get current user error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching user profile",
      });
    }
  }

  /**
   * Update user profile
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user?._id;
      const {
        firstName,
        lastName,
        phone,
        address,
        dateOfBirth,
        profileImageUrl,
      } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (firstName !== undefined) {
        paramCount++;
        updates.push(`first_name = ${paramCount}`);
        values.push(firstName);
      }

      if (lastName !== undefined) {
        paramCount++;
        updates.push(`last_name = ${paramCount}`);
        values.push(lastName);
      }

      if (phone !== undefined) {
        paramCount++;
        updates.push(`phone = ${paramCount}`);
        values.push(phone);
      }

      if (address !== undefined) {
        paramCount++;
        updates.push(`address = ${paramCount}`);
        values.push(address);
      }

      if (dateOfBirth !== undefined) {
        paramCount++;
        updates.push(`date_of_birth = ${paramCount}`);
        values.push(dateOfBirth);
      }

      if (profileImageUrl !== undefined) {
        paramCount++;
        updates.push(`profile_image_url = ${paramCount}`);
        values.push(profileImageUrl);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields to update",
        });
      }

      // Add updated_at and userId
      paramCount++;
      updates.push(`updated_at = NOW()`);
      values.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updates.join(", ")} 
        WHERE id = ${paramCount} 
        RETURNING id, username, first_name, last_name, email, role, phone, address, date_of_birth, profile_image_url
      `;

      const result = await pool.query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = result.rows[0];

      await createAuditLog({
        action: "PROFILE_UPDATED",
        userId: user.id,
        details: `Profile updated: ${Object.keys(req.body).join(", ")}`,
      });

      logger.info("Profile updated for user:", user.username);

      return res.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user.id,
          username: user.username,
          name: `${user.first_name} ${user.last_name}`.trim(),
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          dateOfBirth: user.date_of_birth,
          profileImageUrl: user.profile_image_url,
        },
      });
    } catch (error) {
      logger.error("Update profile error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating profile",
      });
    }
  }

  /**
   * Change password
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async changePassword(req, res) {
    try {
      const userId = req.user?._id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      if (!validatePassword(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "New password does not meet requirements",
        });
      }

      // Get current password hash
      const userQuery = await pool.query(
        "SELECT id, password_hash FROM users WHERE id = $1",
        [userId]
      );

      if (userQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = userQuery.rows[0];

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await pool.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        [hashedNewPassword, userId]
      );

      await createAuditLog({
        action: "PASSWORD_CHANGED",
        userId: userId,
        details: "Password changed successfully",
      });

      logger.info("Password changed for user:", userId);

      return res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      logger.error("Change password error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while changing password",
      });
    }
  }

  /**
   * Verify authentication status
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async verifyAuth(req, res) {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userQuery = await pool.query(
        "SELECT id, username, first_name, last_name, email, role, is_verified FROM users WHERE id = $1",
        [userId]
      );

      if (userQuery.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      const user = userQuery.rows[0];

      if (!user.is_verified) {
        return res.status(403).json({
          success: false,
          message: "Email not verified",
        });
      }

      return res.json({
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          name: `${user.first_name} ${user.last_name}`.trim(),
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.is_verified,
        },
      });
    } catch (error) {
      logger.error("Verify auth error:", error);
      return res.status(500).json({
        success: false,
        message: "Authentication verification failed",
      });
    }
  }

  /**
   * Resend verification email
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const userQuery = await pool.query(
        "SELECT id, email, first_name, last_name, is_verified FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (userQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = userQuery.rows[0];

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken(user.id);

      // Send verification email using enhanced email service
      await emailService.sendTemplate(
        "welcomeEmail",
        {
          name: `${user.first_name} ${user.last_name}`.trim(),
          verificationLink: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`,
        },
        user.email
      );

      logger.info("Verification email resent to:", user.email);

      return res.json({
        success: true,
        message: "Verification email sent successfully",
      });
    } catch (error) {
      logger.error("Resend verification error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while sending verification email",
      });
    }
  }

  /**
   * Email verification
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      const decoded = await this.verifyEmailToken(token);

      const updateQuery = await pool.query(
        "UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1 RETURNING id, email",
        [decoded.userId]
      );

      if (updateQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = updateQuery.rows[0];

      await createAuditLog({
        action: "VERIFY_EMAIL",
        userId: user.id,
        details: "Email verified successfully",
      });

      return res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      logger.error("Email verification error:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }
  }

  /**
   * Manually verify user email (temporary development route)
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async verifyUserEmail(req, res) {
    try {
      const { email } = req.body;

      const updateQuery = await pool.query(
        "UPDATE users SET is_verified = true, updated_at = NOW() WHERE email = $1 RETURNING id, email",
        [email.toLowerCase()]
      );

      if (updateQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      logger.info(`Manually verified email for user: ${email}`);

      return res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      logger.error("Email verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to verify email",
      });
    }
  }

  /**
   * Check user details
   * @param {AuthRequest} req
   * @param {ExpressResponse} res
   * @returns {Promise<ExpressResponse>}
   */
  async checkUser(req, res) {
    try {
      const { email } = req.params;

      const userQuery = await pool.query(
        "SELECT id, email, is_verified, password_hash FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      const user = userQuery.rows[0];

      return res.json({
        exists: !!user,
        isVerified: user?.is_verified || false,
        email: user?.email,
        hasPassword: !!user?.password_hash,
        passwordLength: user?.password_hash?.length,
      });
    } catch (error) {
      logger.error("Check user error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Generate access token
   * @param {any} user - User object
   * @returns {string}
   * @throws {ApiError}
   */
  generateAccessToken(user) {
    if (!JWT_ACCESS_SECRET) {
      throw new ApiError(500, "JWT access secret not configured");
    }
    return jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );
  }

  /**
   * Generate refresh token
   * @param {any} user - User object
   * @returns {string}
   * @throws {ApiError}
   */
  generateRefreshToken(user) {
    if (!JWT_REFRESH_SECRET) {
      throw new ApiError(500, "JWT refresh secret not configured");
    }
    return jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });
  }

  /**
   * Verify email token
   * @param {string} token
   * @returns {Promise<any>}
   */
  async verifyEmailToken(token) {
    if (!JWT_VERIFICATION_SECRET) {
      throw new ApiError(500, "JWT verification secret not configured");
    }
    return new Promise((resolve, reject) => {
      jwt.verify(token, JWT_VERIFICATION_SECRET, (err, decoded) => {
        if (err) reject(new ApiError(401, "Invalid or expired token"));
        else resolve(decoded);
      });
    });
  }

  /**
   * Verify refresh token
   * @param {string} token
   * @returns {Promise<any>}
   */
  async verifyRefreshToken(token) {
    if (!JWT_REFRESH_SECRET) {
      throw new ApiError(500, "JWT refresh secret not configured");
    }
    return new Promise((resolve, reject) => {
      jwt.verify(token, JWT_REFRESH_SECRET, (err, decoded) => {
        if (err) reject(new ApiError(401, "Invalid or expired token"));
        else resolve(decoded);
      });
    });
  }

  /**
   * Verify password reset token
   * @param {string} token
   * @returns {Promise<any>}
   */
  async verifyResetToken(token) {
    if (!JWT_RESET_SECRET) {
      throw new ApiError(500, "JWT reset secret not configured");
    }
    return new Promise((resolve, reject) => {
      jwt.verify(token, JWT_RESET_SECRET, (err, decoded) => {
        if (err) reject(new ApiError(401, "Invalid or expired token"));
        else resolve(decoded);
      });
    });
  }
}

/** @type {IAuthController} */
const authController = new AuthController();
export default authController;
