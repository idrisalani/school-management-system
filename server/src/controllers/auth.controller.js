// @ts-nocheck
// server/src/controllers/auth.controller.js - Fixed TypeScript Issues
import bcrypt from "bcryptjs";
import { query } from "../config/database.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  generateResetToken,
  verifyRefreshToken,
  verifyResetToken,
  verifyVerificationToken,
} from "../utils/tokens.js";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../utils/validators.js";
import logger from "../utils/logger.js";
import emailService from "../services/email.service.js";
import { createAuditLog, AUDIT_ACTIONS } from "../services/audit.service.js";
import {
  ApiError,
  AuthenticationError,
  ValidationError,
  ConflictError,
} from "../utils/errors.js";

/**
 * @typedef {import('express').Request} ExpressRequest
 * @typedef {import('express').Response} ExpressResponse
 * @typedef {import('express').NextFunction} ExpressNextFunction
 */

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
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} first_name - First name
 * @property {string} last_name - Last name
 * @property {string} email - Email address
 * @property {string} role - User role
 * @property {boolean} is_verified - Email verification status
 * @property {string} status - Account status
 * @property {Date} last_login - Last login timestamp
 * @property {Date} created_at - Account creation timestamp
 * @property {string} [phone] - Phone number
 * @property {string} [address] - Address
 * @property {Date} [date_of_birth] - Date of birth
 * @property {string} [profile_image_url] - Profile image URL
 * @property {string} [password] - Hashed password
 * @property {number} [login_attempts] - Failed login attempts
 * @property {Date} [locked_until] - Account lock expiration
 * @property {string} [reset_token] - Password reset token
 * @property {Date} [reset_token_expires] - Reset token expiration
 */

/**
 * Simple token blacklisting for logout (in-memory for now)
 */
const blacklistedTokens = new Set();

/**
 * Blacklist a token
 * @param {string} token - Token to blacklist
 */
const blacklistToken = (token) => {
  blacklistedTokens.add(token);
  // Clean up old tokens periodically (simple implementation)
  if (blacklistedTokens.size > 10000) {
    const tokensArray = Array.from(blacklistedTokens);
    blacklistedTokens.clear();
    // Keep only the last 5000 tokens
    tokensArray.slice(-5000).forEach((t) => blacklistedTokens.add(t));
  }
};

/**
 * Parse full name into first and last names and generate username
 * @param {string} fullName - Full name to parse
 * @param {string} [email] - Email for fallback username generation
 * @returns {{firstName: string, lastName: string, username: string}}
 */
const parseNames = (fullName, email = "") => {
  if (!fullName || typeof fullName !== "string") {
    // Fallback to email-based username if no name provided
    const emailUsername = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ".");
    return { firstName: "", lastName: "", username: emailUsername || "user" };
  }

  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Generate username as "first.last" in lowercase, sanitized
  let username = firstName.toLowerCase();
  if (lastName) {
    username += "." + lastName.toLowerCase().replace(/[^a-z0-9]/g, ".");
  }

  // Remove consecutive dots and trim dots from ends
  username = username.replace(/\.+/g, ".").replace(/^\.+|\.+$/g, "");

  // Ensure minimum length
  if (username.length < 3) {
    const emailFallback = email.split("@")[0].toLowerCase();
    username = emailFallback.length >= 3 ? emailFallback : `user.${Date.now()}`;
  }

  return { firstName, lastName, username };
};

/**
 * Generate unique username by checking database
 * @param {string} baseUsername - Base username to check
 * @param {number} [attempt=0] - Attempt number for uniqueness
 * @returns {Promise<string>} Unique username
 */
const generateUniqueUsername = async (baseUsername, attempt = 0) => {
  const username = attempt === 0 ? baseUsername : `${baseUsername}.${attempt}`;

  const existingUser = await query("SELECT id FROM users WHERE username = $1", [
    username,
  ]);

  if (existingUser.rows.length > 0) {
    return generateUniqueUsername(baseUsername, attempt + 1);
  }

  return username;
};

/**
 * Create standardized user response object
 * @param {User} user - Database user object
 * @returns {Object} Formatted user object
 */
const formatUserResponse = (user) => ({
  id: user.id,
  username: user.username,
  name: `${user.first_name} ${user.last_name}`.trim() || user.username,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  role: user.role,
  isVerified: user.is_verified,
  status: user.status,
  lastLogin: user.last_login,
  createdAt: user.created_at,
  phone: user.phone || null,
  address: user.address || null,
  dateOfBirth: user.date_of_birth || null,
  profileImageUrl: user.profile_image_url || null,
});

// ========================= CORE AUTHENTICATION =========================

/**
 * User Registration with enhanced validation and security
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const register = async (req, res, next) => {
  try {
    logger.info("🚀 Registration attempt", {
      email: req.body.email,
      role: req.body.role,
      ip: req.ip,
    });

    const {
      email,
      password,
      name,
      username,
      firstName,
      lastName,
      role = "student",
      phone,
      dateOfBirth,
    } = req.body;

    // Flexible name handling - support multiple input formats
    const fullName =
      name || username || `${firstName || ""} ${lastName || ""}`.trim();

    // Validate required fields
    if (!email || !password || !fullName) {
      throw ValidationError("Email, password, and name are required");
    }

    // Enhanced validation
    if (!validateEmail(email)) {
      throw ValidationError("Please provide a valid email address");
    }

    if (!validatePassword(password)) {
      throw ValidationError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      );
    }

    // Parse and generate names
    const {
      firstName: parsedFirstName,
      lastName: parsedLastName,
      username: generatedUsername,
    } = parseNames(fullName, email);

    // Generate unique username
    const uniqueUsername = await generateUniqueUsername(generatedUsername);

    logger.debug("Generated user data", {
      firstName: parsedFirstName,
      lastName: parsedLastName,
      username: uniqueUsername,
      email: email.toLowerCase(),
    });

    // Check for existing user by email
    const existingUser = await query(
      "SELECT id, email, username FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw ConflictError("Email address is already registered");
    }

    // Enhanced password hashing
    logger.debug("🔐 Hashing password...");
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user with comprehensive data
    const result = await query(
      `INSERT INTO users (
        username, first_name, last_name, email, password, role, 
        phone, date_of_birth, is_verified, status, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) 
      RETURNING id, username, first_name, last_name, email, role, created_at`,
      [
        uniqueUsername,
        parsedFirstName || null,
        parsedLastName || null,
        email.toLowerCase(),
        hashedPassword,
        role,
        phone || null,
        dateOfBirth || null,
        false, // is_verified = false initially
        "active",
      ]
    );

    const newUser = result.rows[0];
    logger.info("✅ User created successfully", {
      userId: newUser.id,
      username: uniqueUsername,
      email: email.toLowerCase(),
    });

    // Generate verification token
    const verificationToken = generateVerificationToken(newUser.id);

    // Create comprehensive audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.USER_CREATED,
      userId: newUser.id,
      details: `User registered with email: ${email.toLowerCase()}, role: ${role}`,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        registrationSource: "web",
        role: role,
        hasPhone: !!phone,
      },
    });

    // Send welcome email with enhanced template
    setImmediate(async () => {
      try {
        await emailService.sendTemplate(
          "welcomeEmail",
          {
            name: fullName,
            username: uniqueUsername,
            email: email.toLowerCase(),
            role: role,
            verificationLink: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`,
            loginLink: `${process.env.CLIENT_URL}/login`,
            supportEmail: process.env.SUPPORT_EMAIL || "support@schoolms.com",
          },
          email.toLowerCase()
        );
        logger.info("📧 Welcome email sent successfully", {
          email: email.toLowerCase(),
        });
      } catch (emailError) {
        logger.error("❌ Failed to send welcome email", {
          email: email.toLowerCase(),
          error: emailError.message,
        });
      }
    });

    // Return success response
    res.status(201).json({
      status: "success",
      message:
        "Registration successful. Please check your email for verification instructions.",
      data: {
        user: formatUserResponse({
          ...newUser,
          first_name: parsedFirstName,
          last_name: parsedLastName,
          is_verified: false,
          status: "active",
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
        }),
      },
    });
  } catch (error) {
    logger.error("💥 Registration error", {
      email: req.body?.email,
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * User Login with enhanced security features
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const loginIdentifier = email || username;

    logger.info("🔐 Login attempt", {
      identifier: loginIdentifier,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    if (!loginIdentifier || !password) {
      throw ValidationError("Email/username and password are required");
    }

    // Enhanced user lookup with security fields
    const userResult = await query(
      `SELECT id, username, first_name, last_name, email, password, role, 
              is_verified, status, last_login, login_attempts, locked_until,
              phone, address, date_of_birth, profile_image_url, created_at
       FROM users 
       WHERE (email = $1 OR username = $1) AND status != 'deleted'`,
      [loginIdentifier.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      logger.warn("❌ User not found", {
        identifier: loginIdentifier,
        ip: req.ip,
      });

      // Create audit log for failed login attempt
      await createAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        userId: null,
        details: `Login failed - user not found: ${loginIdentifier}`,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      throw AuthenticationError("Invalid credentials");
    }

    const user = userResult.rows[0];

    // Check account status
    if (user.status !== "active") {
      logger.warn("🚫 Account not active", {
        userId: user.id,
        status: user.status,
        ip: req.ip,
      });

      await createAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        userId: user.id,
        details: `Login blocked - account status: ${user.status}`,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      throw AuthenticationError(`Account is ${user.status}`);
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      logger.warn("🔒 Account is locked", {
        userId: user.id,
        lockedUntil: user.locked_until,
        ip: req.ip,
      });

      const unlockTime = new Date(user.locked_until).toLocaleString();
      throw AuthenticationError(
        `Account is temporarily locked until ${unlockTime}`
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn("❌ Invalid password", { userId: user.id, ip: req.ip });

      // Enhanced account locking mechanism
      const newAttempts = (user.login_attempts || 0) + 1;
      let lockUntil = null;

      if (newAttempts >= 5) {
        lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      }

      await query(
        `UPDATE users 
         SET login_attempts = $1,
             locked_until = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [newAttempts, lockUntil, user.id]
      );

      await createAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        userId: user.id,
        details: `Invalid password attempt ${newAttempts}/5`,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        metadata: { loginAttempts: newAttempts, accountLocked: !!lockUntil },
      });

      throw AuthenticationError("Invalid credentials");
    }

    // Check email verification
    if (!user.is_verified) {
      logger.warn("📧 Email not verified", {
        userId: user.id,
        email: user.email,
      });

      await createAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        userId: user.id,
        details: "Login blocked - email not verified",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      throw AuthenticationError("Please verify your email before logging in");
    }

    logger.debug("✅ Password verified, generating tokens...");

    // Generate tokens with enhanced payload
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.is_verified,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update login success data
    await query(
      `UPDATE users 
       SET last_login = NOW(), 
           login_attempts = 0, 
           locked_until = NULL, 
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    // Create comprehensive audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.LOGIN,
      userId: user.id,
      details: "User logged in successfully",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        loginMethod: email ? "email" : "username",
        deviceInfo: req.get("User-Agent"),
      },
    });

    logger.info("🎉 Login successful", {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Return comprehensive response
    res.json({
      status: "success",
      message: "Login successful",
      data: {
        user: formatUserResponse(user),
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes
        tokenType: "Bearer",
      },
    });
  } catch (error) {
    logger.error("💥 Login error", {
      identifier: req.body?.email || req.body?.username,
      error: error.message,
      ip: req.ip,
    });
    next(error);
  }
};

/**
 * Enhanced user logout with token blacklisting
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const token = req.token;

    if (userId) {
      // Blacklist the current token
      if (token) {
        blacklistToken(token);
      }

      await createAuditLog({
        action: AUDIT_ACTIONS.LOGOUT,
        userId: userId,
        details: "User logged out successfully",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      logger.info("👋 User logged out", { userId });
    }

    res.json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("💥 Logout error", {
      userId: req.user?.id,
      error: error.message,
    });
    next(error);
  }
};

/**
 * Get current user with comprehensive profile data
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.role, 
              u.phone, u.address, u.date_of_birth, u.profile_image_url, 
              u.is_verified, u.status, u.last_login, u.created_at, u.updated_at,
              u.department_id, u.employee_id, u.student_id, u.metadata,
              d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw AuthenticationError("User not found");
    }

    const user = userResult.rows[0];

    res.json({
      status: "success",
      data: {
        user: {
          ...formatUserResponse(user),
          departmentId: user.department_id,
          departmentName: user.department_name,
          employeeId: user.employee_id,
          studentId: user.student_id,
          metadata: user.metadata ? JSON.parse(user.metadata) : {},
          updatedAt: user.updated_at,
        },
      },
    });
  } catch (error) {
    logger.error("💥 Get current user error", {
      userId: req.user?.id,
      error: error.message,
    });
    next(error);
  }
};

// ========================= TOKEN MANAGEMENT =========================

/**
 * Enhanced token refresh with security checks
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw AuthenticationError("Refresh token is required");
    }

    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);

    // Find user with status check
    const userResult = await query(
      `SELECT id, username, first_name, last_name, email, role, is_verified, status
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      throw AuthenticationError("Invalid refresh token");
    }

    const user = userResult.rows[0];

    // Security checks
    if (user.status !== "active") {
      throw AuthenticationError("Account is not active");
    }

    if (!user.is_verified) {
      throw AuthenticationError("Account not verified");
    }

    // Generate new tokens
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.is_verified,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    logger.info("🔄 Token refreshed", { userId: user.id });

    res.json({
      status: "success",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
        tokenType: "Bearer",
      },
    });
  } catch (error) {
    logger.error("💥 Token refresh error", { error: error.message });
    next(error);
  }
};

// ========================= PASSWORD MANAGEMENT =========================

/**
 * Enhanced password reset request with security measures
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw ValidationError("Please provide a valid email address");
    }

    // Find user by email
    const userResult = await query(
      `SELECT id, email, first_name, last_name, is_verified, status
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    // Always return success message for security (don't reveal if email exists)
    const successMessage =
      "If the email exists and is verified, a password reset link has been sent";

    if (userResult.rows.length === 0) {
      logger.info("Password reset requested for non-existent email", {
        email: email.toLowerCase(),
        ip: req.ip,
      });

      return res.json({
        status: "success",
        message: successMessage,
      });
    }

    const user = userResult.rows[0];

    // Additional security checks
    if (user.status !== "active") {
      logger.warn("Password reset requested for inactive account", {
        userId: user.id,
        status: user.status,
        ip: req.ip,
      });

      return res.json({
        status: "success",
        message: successMessage,
      });
    }

    if (!user.is_verified) {
      logger.warn("Password reset requested for unverified account", {
        userId: user.id,
        ip: req.ip,
      });

      return res.json({
        status: "success",
        message: "Please verify your email address first",
      });
    }

    const resetToken = generateResetToken(user.id);

    // Store reset token with expiration
    await query(
      `UPDATE users 
       SET reset_token = $1, 
           reset_token_expires = NOW() + INTERVAL '1 hour', 
           updated_at = NOW() 
       WHERE id = $2`,
      [resetToken, user.id]
    );

    // Send enhanced password reset email
    await emailService.sendTemplate(
      "passwordReset",
      {
        name: `${user.first_name} ${user.last_name}`.trim() || "User",
        resetLink: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
        expirationTime: "1 hour",
        supportEmail: process.env.SUPPORT_EMAIL || "support@schoolms.com",
        securityNotice:
          "If you didn't request this reset, please ignore this email",
      },
      user.email
    );

    await createAuditLog({
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      userId: user.id,
      details: "Password reset requested",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    logger.info("📧 Password reset email sent", {
      email: user.email,
      userId: user.id,
    });

    return res.json({
      status: "success",
      message: successMessage,
    });
  } catch (error) {
    logger.error("💥 Password reset request error", {
      email: req.body?.email,
      error: error.message,
    });
    next(error);
  }
};

/**
 * Enhanced password reset with comprehensive validation
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw ValidationError("Token and new password are required");
    }

    if (!validatePassword(newPassword)) {
      throw ValidationError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      );
    }

    // Verify reset token
    const decoded = await verifyResetToken(token);

    // Find user with valid reset token
    const userResult = await query(
      `SELECT id, email, password, reset_token, reset_token_expires 
       FROM users 
       WHERE id = $1 AND reset_token = $2 AND reset_token_expires > NOW() AND status = 'active'`,
      [decoded.userId, token]
    );

    if (userResult.rows.length === 0) {
      throw AuthenticationError("Invalid or expired reset token");
    }

    const user = userResult.rows[0];

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw ValidationError(
        "New password must be different from current password"
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await query(
      `UPDATE users 
       SET password = $1, 
           reset_token = NULL, 
           reset_token_expires = NULL, 
           login_attempts = 0,
           locked_until = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    await createAuditLog({
      action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
      userId: user.id,
      details: "Password reset completed successfully",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Send confirmation email
    setImmediate(async () => {
      try {
        await emailService.sendTemplate(
          "passwordResetConfirmation",
          {
            timestamp: new Date().toLocaleString(),
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
            supportEmail: process.env.SUPPORT_EMAIL || "support@schoolms.com",
          },
          user.email
        );
      } catch (emailError) {
        logger.error("Failed to send password reset confirmation email", {
          userId: user.id,
          error: emailError.message,
        });
      }
    });

    logger.info("🔑 Password reset completed", { userId: user.id });

    res.json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    logger.error("💥 Password reset error", { error: error.message });
    next(error);
  }
};

// ========================= EMAIL VERIFICATION =========================

/**
 * Enhanced email verification
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw ValidationError("Verification token is required");
    }

    // Verify email token
    const decoded = await verifyVerificationToken(token);

    // Update user verification status
    const result = await query(
      `UPDATE users 
       SET is_verified = true, 
           email_verified_at = NOW(),
           updated_at = NOW() 
       WHERE id = $1 AND is_verified = false
       RETURNING id, email, first_name, last_name`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      // Check if user exists but is already verified
      const userCheck = await query(
        "SELECT is_verified FROM users WHERE id = $1",
        [decoded.userId]
      );

      if (userCheck.rows.length > 0 && userCheck.rows[0].is_verified) {
        return res.json({
          status: "success",
          message: "Email is already verified",
        });
      }

      throw AuthenticationError("Invalid verification token or user not found");
    }

    const user = result.rows[0];

    await createAuditLog({
      action: AUDIT_ACTIONS.EMAIL_VERIFIED,
      userId: user.id,
      details: "Email verified successfully",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Send welcome confirmation email
    setImmediate(async () => {
      try {
        await emailService.sendTemplate(
          "emailVerificationSuccess",
          {
            name: `${user.first_name} ${user.last_name}`.trim() || "User",
            loginLink: `${process.env.CLIENT_URL}/login`,
            dashboardLink: `${process.env.CLIENT_URL}/dashboard`,
          },
          user.email
        );
      } catch (emailError) {
        logger.error("Failed to send verification success email", {
          userId: user.id,
          error: emailError.message,
        });
      }
    });

    logger.info("📧 Email verified successfully", { userId: user.id });

    res.json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    logger.error("💥 Email verification error", { error: error.message });
    next(error);
  }
};

/**
 * Resend verification email
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw ValidationError("Please provide a valid email address");
    }

    const userResult = await query(
      `SELECT id, email, first_name, last_name, is_verified, status
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({
        status: "success",
        message: "If the email exists, a verification link has been sent",
      });
    }

    const user = userResult.rows[0];

    if (user.status !== "active") {
      return res.json({
        status: "success",
        message: "If the email exists, a verification link has been sent",
      });
    }

    if (user.is_verified) {
      return res.json({
        status: "success",
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken(user.id);

    // Send verification email
    await emailService.sendTemplate(
      "emailVerification",
      {
        name: `${user.first_name} ${user.last_name}`.trim() || "User",
        verificationLink: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`,
        supportEmail: process.env.SUPPORT_EMAIL || "support@schoolms.com",
      },
      user.email
    );

    await createAuditLog({
      action: "EMAIL_VERIFICATION_RESENT",
      userId: user.id,
      details: "Verification email resent",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    logger.info("📧 Verification email resent", {
      email: user.email,
      userId: user.id,
    });

    return res.json({
      status: "success",
      message: "Verification email sent successfully",
    });
  } catch (error) {
    logger.error("💥 Resend verification error", { error: error.message });
    next(error);
  }
};

// ========================= UTILITY ENDPOINTS =========================

/**
 * Check if user exists (enhanced for security)
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const checkUser = async (req, res, next) => {
  try {
    const { email } = req.params;

    if (!validateEmail(email)) {
      throw ValidationError("Please provide a valid email address");
    }

    const userResult = await query(
      `SELECT id, email, username, is_verified, status, role, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = userResult.rows[0];

    res.json({
      status: "success",
      data: {
        exists: !!user,
        isVerified: user?.is_verified || false,
        isActive: user?.status === "active",
        email: user?.email,
        username: user?.username,
        role: user?.role,
        memberSince: user?.created_at,
      },
    });
  } catch (error) {
    logger.error("💥 Check user error", { error: error.message });
    next(error);
  }
};

/**
 * Verify authentication status (for middleware checks)
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const verifyAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      throw AuthenticationError("User not authenticated");
    }

    const userResult = await query(
      `SELECT id, username, first_name, last_name, email, role, is_verified, status
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      throw AuthenticationError("User not found");
    }

    const user = userResult.rows[0];

    if (user.status !== "active") {
      throw AuthenticationError("Account is not active");
    }

    if (!user.is_verified) {
      throw AuthenticationError("Email not verified");
    }

    res.json({
      status: "success",
      authenticated: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    logger.error("💥 Verify auth error", { error: error.message });
    next(error);
  }
};

/**
 * Manual email verification (development only)
 * @param {ExpressRequest & AuthRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @param {ExpressNextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const verifyUserEmail = async (req, res, next) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === "production") {
      throw AuthenticationError("This endpoint is not available in production");
    }

    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw ValidationError("Please provide a valid email address");
    }

    const result = await query(
      `UPDATE users 
       SET is_verified = true, 
           email_verified_at = NOW(),
           updated_at = NOW() 
       WHERE email = $1 
       RETURNING id, email, first_name, last_name`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw ValidationError("User not found");
    }

    const user = result.rows[0];

    await createAuditLog({
      action: "MANUAL_EMAIL_VERIFICATION",
      userId: user.id,
      details: "Email manually verified (development)",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    logger.info("🔧 Email manually verified (DEV ONLY)", {
      email: user.email,
      userId: user.id,
    });

    return res.json({
      status: "success",
      message: "Email verified successfully (development mode)",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`.trim(),
        },
      },
    });
  } catch (error) {
    logger.error("💥 Manual email verification error", {
      error: error.message,
    });
    next(error);
  }
};

// ========================= EXPORTS =========================

const authController = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification,
  checkUser,
  verifyAuth,
  verifyUserEmail,
  // Optional methods that might be implemented later
  updateProfile: undefined,
  changePassword: undefined,
  createUser: undefined,
  resendVerificationEmail: resendVerification, // Alias
};

export default authController;
