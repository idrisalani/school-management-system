// @ts-nocheck

// server/src/services/auth.service.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "../config/database.js";
import { ApiError } from "../utils/errors.js";
import EmailService from "./email.service.js";
import { createAuditLog } from "./audit.service.js";

/**
 * @typedef {string|number} UserId - User ID can be string (from JWT) or number (from DB)
 */

/**
 * @typedef {Object} TokenPayload
 * @property {string} userId - The user's ID (always string in JWT)
 * @property {string} [role] - The user's role (optional)
 * @property {number} [iat] - Issued at timestamp
 * @property {number} [exp] - Expiration timestamp
 */

/**
 * @typedef {Object} DatabaseUser
 * @property {number|string} id - User ID (number from DB, string from JWT)
 * @property {string} email - User email
 * @property {string} password - Hashed password
 * @property {string} name - User name
 * @property {string} role - User role
 * @property {boolean} is_verified - Email verification status
 * @property {string} phone - Phone number
 * @property {string} address - Address
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Update timestamp
 * @property {Date} last_login - Last login timestamp
 */

// Validate JWT secrets
const validateJWTSecret = (secret, name) => {
  if (!secret) {
    throw new Error(`JWT ${name} secret is not configured`);
  }
  return secret;
};

class AuthService {
  constructor() {
    // Validate all JWT secrets on initialization
    this.JWT_ACCESS_SECRET = validateJWTSecret(process.env.JWT_ACCESS_SECRET, "access");
    this.JWT_REFRESH_SECRET = validateJWTSecret(process.env.JWT_REFRESH_SECRET, "refresh");
    this.JWT_VERIFICATION_SECRET = validateJWTSecret(
      process.env.JWT_VERIFICATION_SECRET,
      "verification"
    );
    this.JWT_RESET_SECRET = validateJWTSecret(process.env.JWT_RESET_SECRET, "reset");
  }

  /**
   * Verify and decode JWT token
   * @template {TokenPayload} T
   * @param {string} token - JWT token to verify
   * @param {string} secret - Secret to use for verification
   * @returns {T} Decoded token payload
   * @throws {ApiError} If token is invalid or malformed
   */
  verifyToken(token, secret) {
    try {
      const decoded = jwt.verify(token, secret);
      if (typeof decoded === "string" || !decoded.userId) {
        throw new Error("Invalid token format");
      }
      return /** @type {T} */ (decoded);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError("Token has expired", 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError("Invalid token", 401);
      }
      throw new ApiError(error instanceof Error ? error.message : "Token verification failed", 401);
    }
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{user: Omit<DatabaseUser, 'password'>, accessToken: string, refreshToken: string}>}
   */
  async authenticateUser(email, password) {
    // Find user by email and get password
    const userQuery = `
      SELECT id, email, password, name, role, is_verified, phone, address, 
             created_at, updated_at, last_login
      FROM users 
      WHERE email = $1
    `;

    const result = await query(userQuery, [email]);

    if (result.rows.length === 0) {
      throw new ApiError("Invalid credentials", 401);
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError("Invalid credentials", 401);
    }

    // Check if email is verified
    if (!user.is_verified) {
      throw new ApiError("Email not verified", 403);
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Update login timestamp
    await this.updateLoginTimestamp(user.id);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.name - User name
   * @param {string} [userData.role] - User role
   * @param {string} [userData.phone] - User phone
   * @param {string} [userData.address] - User address
   * @returns {Promise<DatabaseUser>} Created user object
   */
  async registerUser(userData) {
    const { email, password, name, role, phone, address } = userData;

    // Check if user already exists
    const existingUserQuery = "SELECT id FROM users WHERE email = $1";
    const existingResult = await query(existingUserQuery, [email]);

    if (existingResult.rows.length > 0) {
      throw new ApiError("Email already registered", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const insertQuery = `
      INSERT INTO users (email, password, name, role, phone, address, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, false)
      RETURNING id, email, name, role, phone, address, created_at, is_verified
    `;

    const userResult = await query(insertQuery, [
      email,
      hashedPassword,
      name,
      role || "student",
      phone || null,
      address || null,
    ]);

    const user = userResult.rows[0];

    // Generate verification token and send email
    const verificationToken = this.generateVerificationToken(user.id);
    await this.sendVerificationEmail(user.email, verificationToken);

    // Create audit log
    await createAuditLog({
      action: "USER_REGISTERED",
      userId: user.id,
      details: "New user registration",
    });

    return user;
  }

  /**
   * Verify user email
   * @param {string} token - Verification token
   * @returns {Promise<DatabaseUser>} Verified user object
   */
  async verifyEmail(token) {
    const decoded = this.verifyToken(token, this.JWT_VERIFICATION_SECRET);

    // Find user and update verification status
    const updateQuery = `
      UPDATE users 
      SET is_verified = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, name, role, is_verified
    `;

    const result = await query(updateQuery, [decoded.userId]);

    if (result.rows.length === 0) {
      throw new ApiError("Invalid verification token", 400);
    }

    const user = result.rows[0];

    // Create audit log
    await createAuditLog({
      action: "EMAIL_VERIFIED",
      userId: user.id,
      details: "User email verified",
    });

    return user;
  }

  /**
   * Reset user password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async resetPassword(token, newPassword) {
    const decoded = this.verifyToken(token, this.JWT_RESET_SECRET);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const updateQuery = `
      UPDATE users 
      SET password = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email
    `;

    const result = await query(updateQuery, [decoded.userId, hashedPassword]);

    if (result.rows.length === 0) {
      throw new ApiError("Invalid reset token", 400);
    }

    // Create audit log
    await createAuditLog({
      action: "PASSWORD_RESET",
      userId: decoded.userId,
      details: "Password reset completed",
    });

    return true;
  }

  /**
   * Refresh access tokens
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<{accessToken: string, refreshToken: string}>} New tokens
   */
  async refreshTokens(refreshToken) {
    const decoded = this.verifyToken(refreshToken, this.JWT_REFRESH_SECRET);

    // Find user
    const userQuery = `
      SELECT id, email, name, role, is_verified
      FROM users 
      WHERE id = $1
    `;

    const result = await query(userQuery, [decoded.userId]);

    if (result.rows.length === 0) {
      throw new ApiError("Invalid refresh token", 401);
    }

    const user = result.rows[0];
    return this.generateTokens(user);
  }

  /**
   * Generate JWT tokens for a user
   * @param {DatabaseUser} user - User object from database
   * @returns {{accessToken: string, refreshToken: string}}
   */
  generateTokens(user) {
    /** @type {TokenPayload} */
    const accessPayload = {
      userId: String(user.id),
      role: user.role,
    };

    /** @type {TokenPayload} */
    const refreshPayload = {
      userId: String(user.id),
    };

    const accessToken = jwt.sign(accessPayload, this.JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(refreshPayload, this.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generate email verification token
   * @param {UserId} userId - User ID (accepts both string and number)
   * @returns {string}
   */
  generateVerificationToken(userId) {
    /** @type {TokenPayload} */
    const payload = { userId: String(userId) };

    return jwt.sign(payload, this.JWT_VERIFICATION_SECRET, {
      expiresIn: "24h",
    });
  }

  /**
   * Generate password reset token
   * @param {UserId} userId - User ID (accepts both string and number)
   * @returns {string}
   */
  generateResetToken(userId) {
    /** @type {TokenPayload} */
    const payload = { userId: String(userId) };

    return jwt.sign(payload, this.JWT_RESET_SECRET, {
      expiresIn: "1h",
    });
  }

  /**
   * Send verification email using EmailService templates
   * @param {string} email - User email
   * @param {string} token - Verification token
   * @param {string} [userName] - User name for personalization
   * @returns {Promise<void>}
   */
  async sendVerificationEmail(email, token, userName = "") {
    try {
      await EmailService.sendTemplate(
        "emailVerification",
        {
          verificationLink: `${process.env.CLIENT_URL}/verify-email?token=${token}`,
          name: userName,
          expirationTime: "24 hours",
        },
        email
      );
    } catch (error) {
      // Log but don't throw - email failure shouldn't block registration
      console.error("Failed to send verification email:", error.message);
    }
  }

  /**
   * Send password reset email using EmailService templates
   * @param {string} email - User email
   * @param {string} token - Reset token
   * @param {string} [userName] - User name for personalization
   * @returns {Promise<void>}
   */
  async sendResetEmail(email, token, userName = "") {
    try {
      await EmailService.sendTemplate(
        "passwordReset",
        {
          resetLink: `${process.env.CLIENT_URL}/reset-password?token=${token}`,
          name: userName,
        },
        email
      );
    } catch (error) {
      // Log but don't throw - email failure shouldn't block password reset request
      console.error("Failed to send reset email:", error.message);
    }
  }

  /**
   * Send welcome email after successful verification
   * @param {string} email - User email
   * @param {string} userName - User name
   * @param {string} username - Username for login
   * @param {string} role - User role
   * @returns {Promise<void>}
   */
  async sendWelcomeEmail(email, userName, username, role) {
    try {
      await EmailService.sendTemplate(
        "welcomeEmail",
        {
          name: userName,
          username: username,
          email: email,
          role: role,
          verificationLink: `${process.env.CLIENT_URL}/dashboard`, // Link to dashboard after verification
        },
        email
      );
    } catch (error) {
      console.error("Failed to send welcome email:", error.message);
    }
  }

  /**
   * Update user's last login timestamp
   * @param {UserId} userId - User ID (accepts both string and number)
   */
  async updateLoginTimestamp(userId) {
    const updateQuery = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await query(updateQuery, [userId]);
  }

  /**
   * Validate access token and return user
   * @param {string} token - JWT access token
   * @returns {Promise<DatabaseUser>} User object
   */
  async validateToken(token) {
    try {
      const decoded = this.verifyToken(token, this.JWT_ACCESS_SECRET);

      const userQuery = `
        SELECT id, email, name, role, is_verified, phone, address, 
               created_at, updated_at, last_login
        FROM users 
        WHERE id = $1
      `;

      const result = await query(userQuery, [decoded.userId]);

      if (result.rows.length === 0) {
        throw new ApiError("User not found", 401);
      }

      return result.rows[0];
    } catch (error) {
      throw new ApiError("Invalid token", 401);
    }
  }

  /**
   * Register new user - UPDATED to use EmailService templates
   */
  async registerUser(userData) {
    const { email, password, name, role, phone, address } = userData;

    // Check if user already exists
    const existingUserQuery = "SELECT id FROM users WHERE email = $1";
    const existingResult = await query(existingUserQuery, [email]);

    if (existingResult.rows.length > 0) {
      throw new ApiError("Email already registered", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const insertQuery = `
      INSERT INTO users (email, password, name, role, phone, address, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, false)
      RETURNING id, email, name, role, phone, address, created_at, is_verified
    `;

    const userResult = await query(insertQuery, [
      email,
      hashedPassword,
      name,
      role || "student",
      phone || null,
      address || null,
    ]);

    const user = userResult.rows[0];

    // Generate verification token and send email using EmailService
    const verificationToken = this.generateVerificationToken(user.id);
    await this.sendVerificationEmail(user.email, verificationToken, user.name);

    // Create audit log
    await createAuditLog({
      action: "USER_REGISTERED",
      userId: user.id,
      details: "New user registration",
    });

    return user;
  }

  /**
   * Verify user email - UPDATED to send welcome email
   */
  async verifyEmail(token) {
    const decoded = this.verifyToken(token, this.JWT_VERIFICATION_SECRET);

    // Find user and update verification status
    const updateQuery = `
      UPDATE users 
      SET is_verified = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, name, role, is_verified
    `;

    const result = await query(updateQuery, [decoded.userId]);

    if (result.rows.length === 0) {
      throw new ApiError("Invalid verification token", 400);
    }

    const user = result.rows[0];

    // Send welcome email after successful verification
    await this.sendWelcomeEmail(user.email, user.name, user.email.split("@")[0], user.role);

    // Create audit log
    await createAuditLog({
      action: "EMAIL_VERIFIED",
      userId: user.id,
      details: "User email verified",
    });

    return user;
  }

  /**
   * Request password reset - UPDATED to pass user name
   */
  async requestPasswordReset(email) {
    // Find user by email
    const userQuery = "SELECT id, email, name FROM users WHERE email = $1";
    const result = await query(userQuery, [email]);

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not
      return true;
    }

    const user = result.rows[0];
    const resetToken = this.generateResetToken(user.id);

    // Send reset email with user name for personalization
    await this.sendResetEmail(user.email, resetToken, user.name);

    // Create audit log
    await createAuditLog({
      action: "PASSWORD_RESET_REQUESTED",
      userId: user.id,
      details: "Password reset requested",
    });

    return true;
  }
}

export default new AuthService();
