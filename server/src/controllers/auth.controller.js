// @ts-check
// server/src/controllers/auth.controller.js - TypeScript-Fixed Production Version
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query } from "../config/database.js";
import logger from "../utils/logger.js";
import sgMail from "@sendgrid/mail";
import emailService from "../services/email.service.js";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  logger.info("SendGrid initialized successfully");
} else {
  logger.warn("SendGrid API key not found - email features will be mocked");
}

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
 * @typedef {Object} JwtPayload
 * @property {number} id - User ID
 * @property {number} [userId] - Alternative user ID field
 * @property {string} email - User email
 * @property {string} role - User role
 * @property {boolean} isVerified - Email verification status
 * @property {string} [purpose] - Token purpose (for special tokens)
 * @property {number} iat - Issued at
 * @property {number} exp - Expiration time
 */

// ========================= CUSTOM ERROR CLASSES =========================

class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

class ValidationError extends ApiError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

class AuthenticationError extends ApiError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

class ConflictError extends ApiError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message, 409);
    this.name = "ConflictError";
  }
}

// ========================= AUDIT LOGGING SYSTEM =========================

const AUDIT_ACTIONS = {
  USER_CREATED: "USER_CREATED",
  LOGIN: "LOGIN",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
  EMAIL_VERIFICATION_RESENT: "EMAIL_VERIFICATION_RESENT",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED: "ACCOUNT_UNLOCKED",
  PROFILE_UPDATED: "PROFILE_UPDATED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  TOKEN_REFRESHED: "TOKEN_REFRESHED",
};

/**
 * Create audit log with proper TypeScript type handling
 * @param {Object} auditData - Audit log data
 * @param {string} auditData.action - Action performed
 * @param {number|string|null} auditData.userId - User ID (can be number, string, or null)
 * @param {string} auditData.details - Detailed description
 * @param {string|null} [auditData.ipAddress] - Client IP address
 * @param {string|null} [auditData.userAgent] - Client user agent
 * @param {Object} [auditData.metadata] - Additional metadata
 * @returns {Promise<Object|null>}
 */
const createAuditLog = async ({
  action,
  userId = null,
  details,
  ipAddress = null,
  userAgent = null,
  metadata = {},
}) => {
  try {
    // TYPESCRIPT FIX: Proper type conversion and validation
    let validatedUserId = null;

    if (userId !== null && userId !== undefined) {
      // Convert to integer regardless of input type
      const numericUserId = typeof userId === "number" ? userId : parseInt(String(userId));

      if (!isNaN(numericUserId) && numericUserId > 0) {
        validatedUserId = numericUserId;
      } else {
        logger.warn("Invalid userId format in audit log:", {
          userId,
          type: typeof userId,
          converted: numericUserId,
        });
        validatedUserId = null;
      }
    }

    // TYPESCRIPT FIX: Ensure all parameters match expected types
    const auditQuery = `
      INSERT INTO audit_logs (
        action, user_id, details, ip_address, user_agent, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, created_at
    `;

    // TYPESCRIPT FIX: Explicit type conversion for all parameters
    const auditValues = [
      String(action), // Ensure string
      validatedUserId, // Integer or null
      String(details), // Ensure string
      ipAddress ? String(ipAddress) : null, // String or null
      userAgent ? String(userAgent) : null, // String or null
      JSON.stringify(metadata || {}), // JSON string
    ];

    logger.debug("Creating audit log with validated values:", {
      action: String(action),
      userId: validatedUserId,
      userIdType: typeof validatedUserId,
      details: String(details).substring(0, 100) + "...",
      ipAddress: ipAddress ? String(ipAddress) : null,
    });

    const result = await query(auditQuery, auditValues);

    if (result.rows && result.rows.length > 0) {
      logger.debug("Audit log created successfully:", {
        auditId: result.rows[0].id,
        action: String(action),
        userId: validatedUserId,
        createdAt: result.rows[0].created_at,
      });
      return result.rows[0];
    }

    return null;
  } catch (error) {
    // Enhanced error logging with type information
    logger.error("AUDIT LOG CREATION FAILED:", {
      action: String(action),
      userId,
      userIdOriginalType: typeof userId,
      error: error.message,
      errorCode: error.code,
      sqlState: error.sqlState,
      details: details ? String(details).substring(0, 100) : null,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    // Don't throw - let the main operation continue
    return null;
  }
};

// ========================= EMAIL SERVICE INTEGRATION =========================

/**
 * Enhanced token blacklisting system
 */
class TokenBlacklist {
  constructor() {
    this.blacklistedTokens = new Set();
    this.cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.startCleanup();
  }

  /**
   * @param {string} token
   */
  blacklist(token) {
    this.blacklistedTokens.add(token);
    logger.debug("🚫 Token blacklisted", { tokenPrefix: token.substring(0, 10) + "..." });
  }

  /**
   * @param {string} token
   */
  isBlacklisted(token) {
    return this.blacklistedTokens.has(token);
  }

  startCleanup() {
    setInterval(() => {
      if (this.blacklistedTokens.size > 10000) {
        const tokensArray = Array.from(this.blacklistedTokens);
        this.blacklistedTokens.clear();
        // Keep only the last 5000 tokens
        tokensArray.slice(-5000).forEach((t) => this.blacklistedTokens.add(t));
        logger.info("🧹 Token blacklist cleaned up", { remaining: this.blacklistedTokens.size });
      }
    }, this.cleanupInterval);
  }
}

const tokenBlacklist = new TokenBlacklist();

/**
 * Generate secure tokens with different purposes
 * @param {Object} payload
 * @returns {string}
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "15m",
    issuer: "school-management-system",
    audience: "sms-client",
  });
};

/**
 * @param {Object} payload
 * @returns {string}
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || "your-refresh-secret", {
    expiresIn: "7d",
    issuer: "school-management-system",
    audience: "sms-client",
  });
};

/**
 * @param {number} userId
 * @returns {string}
 */
const generateVerificationToken = (userId) => {
  return jwt.sign(
    { userId, purpose: "email-verification" },
    process.env.JWT_SECRET || "your-secret-key",
    {
      expiresIn: "24h",
    }
  );
};

/**
 * @param {number} userId
 * @returns {string}
 */
const generateResetToken = (userId) => {
  return jwt.sign(
    { userId, purpose: "password-reset" },
    process.env.JWT_SECRET || "your-secret-key",
    {
      expiresIn: "1h",
    }
  );
};

/**
 * Token verification functions
 * @param {string} token
 * @returns {JwtPayload}
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "your-refresh-secret");
    return /** @type {JwtPayload} */ (decoded);
  } catch (error) {
    throw new AuthenticationError("Invalid refresh token");
  }
};

/**
 * @param {string} token
 * @returns {JwtPayload}
 */
const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const payload = /** @type {JwtPayload} */ (decoded);
    if (payload.purpose !== "password-reset") {
      throw new Error("Invalid token purpose");
    }
    return payload;
  } catch (error) {
    throw new AuthenticationError("Invalid or expired reset token");
  }
};

/**
 * @param {string} token
 * @returns {JwtPayload}
 */
const verifyVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const payload = /** @type {JwtPayload} */ (decoded);
    if (payload.purpose !== "email-verification") {
      throw new Error("Invalid token purpose");
    }
    return payload;
  } catch (error) {
    throw new AuthenticationError("Invalid or expired verification token");
  }
};

// ========================= VALIDATION FUNCTIONS =========================

/**
 * Comprehensive validation functions
 * @param {string} email
 * @returns {boolean}
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * @param {string} password
 * @returns {boolean}
 */
const validatePassword = (password) => {
  if (!password || password.length < 8) return false;

  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

/**
 * @param {string} username
 * @returns {boolean}
 */
const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 30) return false;

  // Only alphanumeric characters, dots, and underscores
  const usernameRegex = /^[a-zA-Z0-9._]+$/;
  return usernameRegex.test(username);
};

/**
 * @param {string} name
 * @returns {boolean}
 */
const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

/**
 * @param {string} phone
 * @returns {boolean}
 */
const validatePhone = (phone) => {
  if (!phone) return true; // Optional field

  // Remove spaces/hyphens, allow international format
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

  // Allow +234... format (7-15 digits total)
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;

  return phoneRegex.test(cleanPhone);
};

// ========================= UTILITY FUNCTIONS =========================

/**
 * Parse full name and generate username
 * @param {string} fullName
 * @param {string} email
 * @returns {Promise<{firstName: string, lastName: string, username: string}>}
 */
const parseNamesAndGenerateUsername = async (fullName, email = "") => {
  if (!fullName || typeof fullName !== "string") {
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

  // Generate unique username
  const uniqueUsername = await generateUniqueUsername(username);

  return { firstName, lastName, username: uniqueUsername };
};

/**
 * Generate unique username by checking database
 * @param {string} baseUsername
 * @param {number} attempt
 * @returns {Promise<string>}
 */
const generateUniqueUsername = async (baseUsername, attempt = 0) => {
  const username = attempt === 0 ? baseUsername : `${baseUsername}.${attempt}`;

  const existingUser = await query("SELECT id FROM users WHERE username = $1", [username]);

  if (existingUser.rows.length > 0) {
    return generateUniqueUsername(baseUsername, attempt + 1);
  }

  return username;
};

/**
 * Create standardized user response object
 * @param {User} user
 * @returns {Object}
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

// ========================= MAIN AUTH CONTROLLERS =========================

/**
 * Enhanced User Registration with complete validation and email verification
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const register = async (req, res, next) => {
  try {
    logger.info("🚀 Registration attempt with email verification", {
      email: req.body.email,
      role: req.body.role,
      ip: req.ip,
    });

    const {
      email,
      password,
      confirmPassword,
      name,
      username,
      firstName,
      lastName,
      role = "student",
      phone,
      dateOfBirth,
      address,
    } = req.body;

    if (password && confirmPassword && password !== confirmPassword) {
      res.status(400).json({
        status: "error",
        message: "Passwords do not match",
        errors: {
          confirmPassword: "Passwords do not match",
        },
      });
      return;
    }

    // Flexible name handling
    const fullName = name || username || `${firstName || ""} ${lastName || ""}`.trim();

    // Comprehensive validation
    if (!email || !password || !fullName) {
      throw new ValidationError("Email, password, and name are required");
    }

    if (!validateEmail(email)) {
      throw new ValidationError("Please provide a valid email address");
    }

    if (!validatePassword(password)) {
      throw new ValidationError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      );
    }

    if (!validateName(fullName)) {
      throw new ValidationError("Name must be between 2 and 50 characters");
    }

    if (phone && !validatePhone(phone)) {
      throw new ValidationError("Please provide a valid phone number");
    }

    // Role validation
    const validRoles = ["student", "teacher", "admin", "parent"];
    if (!validRoles.includes(role)) {
      throw new ValidationError(`Role must be one of: ${validRoles.join(", ")}`);
    }

    // Name parsing
    const {
      firstName: parsedFirstName,
      lastName: parsedLastName,
      username: generatedUsername,
    } = await parseNamesAndGenerateUsername(fullName, email);

    logger.debug("Generated user data", {
      firstName: parsedFirstName,
      lastName: parsedLastName,
      username: generatedUsername,
      email: email.toLowerCase(),
    });

    // Enhanced existing user check for email verification
    const existingUser = await query(
      "SELECT id, email, username, is_verified FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      if (user.is_verified) {
        throw new ConflictError("Email address is already registered and verified");
      } else {
        // User exists but not verified - resend verification
        const resendToken = generateVerificationToken(user.id);

        // Update existing user with new token
        await query(
          `UPDATE users SET 
           verification_token = $1, 
           token_expiry = NOW() + INTERVAL '24 hours',
           updated_at = NOW()
           WHERE id = $2`,
          [resendToken, user.id]
        );

        // Resend verification email using emailService method
        setImmediate(async () => {
          try {
            await emailService.sendEmailVerification(
              {
                name: parsedFirstName || fullName,
                firstName: parsedFirstName,
              },
              email.toLowerCase(),
              resendToken
            );
            logger.info("📧 Verification email resent", { email: email.toLowerCase() });
          } catch (emailError) {
            logger.error("❌ Failed to resend verification email", {
              email: email.toLowerCase(),
              error: emailError.message,
            });
          }
        });

        res.status(200).json({
          status: "success",
          message: "Account exists but not verified. Verification email has been resent.",
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Password hashing
    logger.debug("🔐 Hashing password...");
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await query(
      `INSERT INTO users (
        username, first_name, last_name, email, password, role, 
        phone, address, date_of_birth, is_verified, profile_completed, status, 
        login_attempts, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) 
      RETURNING id, username, first_name, last_name, email, role, created_at`,
      [
        generatedUsername,
        parsedFirstName || null,
        parsedLastName || null,
        email.toLowerCase(),
        hashedPassword,
        role,
        phone || null,
        address || null,
        dateOfBirth || null,
        false, // is_verified = false initially
        false, // profile_completed = false initially
        "active",
        0, // login_attempts
      ]
    );

    const newUser = result.rows[0];

    // Generate proper verification token with real user ID
    const verificationToken = generateVerificationToken(newUser.id);

    // Update user with proper verification token
    await query(
      `UPDATE users SET 
       verification_token = $1,
       token_expiry = NOW() + INTERVAL '24 hours'
       WHERE id = $2`,
      [verificationToken, newUser.id]
    );

    logger.info("✅ User created successfully with email verification", {
      userId: newUser.id,
      username: generatedUsername,
      email: email.toLowerCase(),
    });

    // Send verification email (non-blocking)
    setImmediate(async () => {
      try {
        await emailService.sendEmailVerification(
          {
            name: fullName,
            firstName: parsedFirstName || fullName,
          },
          email.toLowerCase(),
          verificationToken
        );
        logger.info("📧 Email verification email sent successfully", {
          userId: newUser.id,
          email: email.toLowerCase(),
        });
      } catch (emailError) {
        logger.error("❌ Failed to send verification email", {
          userId: newUser.id,
          email: email.toLowerCase(),
          error: emailError.message,
        });
      }
    });

    // Create comprehensive audit log
    setImmediate(async () => {
      try {
        await createAuditLog({
          action: "USER_CREATED",
          userId: newUser.id,
          details: `User registered: ${email.toLowerCase()}, role: ${role}`,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          metadata: {
            registrationSource: "web",
            role: role,
            hasPhone: !!phone,
            hasAddress: !!address,
          },
        });
        logger.debug("✅ Audit log created for registration");
      } catch (auditError) {
        logger.error("❌ Audit log failed (non-critical):", auditError.message);
      }
    });

    // Success response
    res.status(201).json({
      status: "success",
      message:
        "Registration successful. Please check your email to verify your account before logging in.",
      data: {
        user: formatUserResponse({
          ...newUser,
          first_name: parsedFirstName,
          last_name: parsedLastName,
          is_verified: false,
          profile_completed: false,
          status: "active",
          phone: phone || null,
          address: address || null,
          date_of_birth: dateOfBirth || null,
        }),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Registration error with email verification", {
      email: req.body?.email,
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Check Email Existence
 */
export const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const result = await query("SELECT id, is_verified FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    const exists = result.rows.length > 0;
    const verified = exists ? result.rows[0].is_verified : false;

    res.status(200).json({
      status: "success",
      data: {
        exists,
        verified,
        available: !exists,
      },
    });
  } catch (error) {
    logger.error("Email check error:", error);
    res.status(500).json({
      status: "error",
      message: "Email check failed",
    });
  }
};

/**
 * Complete user profile after email verification - TypeScript Compatible
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 */
export const completeProfile = async (req, res, next) => {
  try {
    // Extract authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: "error",
        message: "Authorization token required",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        status: "error",
        message: "Profile completion token required",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // JWT verification with explicit type handling
    let decodedToken;
    try {
      const verifyResult = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

      // Handle both string and object results from jwt.verify
      if (typeof verifyResult === "string") {
        res.status(401).json({
          status: "error",
          message: "Invalid token format",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Cast to our expected type
      decodedToken = verifyResult;
    } catch (jwtError) {
      logger.error("JWT verification failed:", jwtError.message);
      res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Extract user ID with safe property access
    const userId = decodedToken.userId || decodedToken.id;
    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Invalid token - missing user ID",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate token purpose if it exists
    if (decodedToken.purpose && decodedToken.purpose !== "profile_completion") {
      res.status(401).json({
        status: "error",
        message: "Invalid token purpose",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const profileData = req.body;
    logger.info("Profile completion attempt", {
      userId,
      hasData: !!profileData,
      dataKeys: Object.keys(profileData || {}),
    });

    // Get user information from database
    const userResult = await query(
      "SELECT id, role, is_verified, first_name, last_name, email, profile_completed FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        status: "error",
        message: "User not found",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const user = userResult.rows[0];

    // Validation checks
    if (!user.is_verified) {
      res.status(400).json({
        status: "error",
        message: "Email must be verified before completing profile",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (user.profile_completed) {
      res.status(400).json({
        status: "error",
        message: "Profile is already completed",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate required fields based on role
    const userRole = user.role;
    const requiredFields = ["phone", "address", "date_of_birth", "gender"];
    const missingFields = [];

    // Check common required fields
    for (const field of requiredFields) {
      if (!profileData[field] || String(profileData[field]).trim() === "") {
        missingFields.push(field);
      }
    }

    // Role-specific validation
    if (userRole === "student") {
      if (!profileData.grade_level) missingFields.push("grade_level");
      if (!profileData.parent_email) missingFields.push("parent_email");
      if (!profileData.emergency_contact) missingFields.push("emergency_contact");
    } else if (userRole === "teacher") {
      if (!profileData.department) missingFields.push("department");
      if (!profileData.qualifications) missingFields.push("qualifications");
    } else if (userRole === "parent") {
      if (!profileData.relationship_to_student) missingFields.push("relationship_to_student");
      if (!profileData.occupation) missingFields.push("occupation");
    } else if (userRole === "admin") {
      if (!profileData.admin_level) missingFields.push("admin_level");
      if (!profileData.employee_id) missingFields.push("employee_id");
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        status: "error",
        message: `Missing required fields: ${missingFields.join(", ")}`,
        missingFields,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Update user profile in database
    const updateQuery = `
      UPDATE users SET 
        phone = $1, 
        address = $2, 
        date_of_birth = $3, 
        gender = $4, 
        bio = $5,
        grade_level = $6,
        parent_email = $7,
        emergency_contact = $8,
        department = $9,
        qualifications = $10,
        occupation = $11,
        work_phone = $12,
        relationship_to_student = $13,
        admin_level = $14,
        employee_id = $15,
        permissions = $16,
        profile_completed = true,
        profile_completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $17
      RETURNING id, username, first_name, last_name, email, role, is_verified, profile_completed, created_at
    `;

    const updateValues = [
      profileData.phone || null,
      profileData.address || null,
      profileData.date_of_birth || null,
      profileData.gender || null,
      profileData.bio || null,
      // Student fields
      profileData.grade_level || null,
      profileData.parent_email || null,
      profileData.emergency_contact || null,
      // Teacher fields
      profileData.department || null,
      profileData.qualifications || null,
      // Parent fields
      profileData.occupation || null,
      profileData.work_phone || null,
      profileData.relationship_to_student || null,
      // Admin fields
      profileData.admin_level || null,
      profileData.employee_id || null,
      profileData.permissions || null,
      // User ID
      userId,
    ];

    const updateResult = await query(updateQuery, updateValues);

    if (updateResult.rows.length === 0) {
      res.status(500).json({
        status: "error",
        message: "Failed to update profile",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const updatedUser = updateResult.rows[0];

    // Create audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.PROFILE_UPDATED,
      userId: userId,
      details: `Profile completed successfully for ${userRole}`,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        profileCompletion: true,
        role: userRole,
        completedFields: Object.keys(profileData),
      },
    });

    // Generate access token for authenticated user
    const accessToken = generateAccessToken({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: true,
    });

    logger.info("Profile completed successfully", {
      userId: updatedUser.id,
      role: userRole,
    });

    // Send success response
    res.status(200).json({
      status: "success",
      message: "Profile completed successfully!",
      data: {
        user: formatUserResponse({
          ...updatedUser,
          is_verified: true,
          profile_completed: true,
          phone: profileData.phone,
          address: profileData.address,
          date_of_birth: profileData.date_of_birth,
        }),
        token: accessToken,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Profile completion error:", {
      error: error.message,
      stack: error.stack,
      userId: req.body?.userId,
      ip: req.ip,
    });

    // Send error response
    res.status(500).json({
      status: "error",
      message: "Internal server error during profile completion",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Enhanced User Login with comprehensive security features
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const login = async (req, res, next) => {
  try {
    const { email, username, password, rememberMe = false } = req.body;
    const loginIdentifier = email || username;

    logger.info("🔐 Login attempt", {
      identifier: loginIdentifier,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      rememberMe,
    });

    if (!loginIdentifier || !password) {
      throw new ValidationError("Email/username and password are required");
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

      throw new AuthenticationError("Invalid credentials");
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

      throw new AuthenticationError(`Account is ${user.status}`);
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      logger.warn("🔒 Account is locked", {
        userId: user.id,
        lockedUntil: user.locked_until,
        ip: req.ip,
      });

      const unlockTime = new Date(user.locked_until).toLocaleString();
      throw new AuthenticationError(`Account is temporarily locked until ${unlockTime}`);
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

        await createAuditLog({
          action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
          userId: user.id,
          details: `Account locked after ${newAttempts} failed login attempts`,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          metadata: { lockDuration: "2 hours", attempts: newAttempts },
        });
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

      throw new AuthenticationError("Invalid credentials");
    }

    // Check email verification (can be made optional for development)
    if (!user.is_verified && process.env.NODE_ENV === "production") {
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

      throw new AuthenticationError("Please verify your email before logging in");
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
    const refreshTokenExpiry = rememberMe ? "30d" : "7d";
    const refreshToken = jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
      {
        expiresIn: refreshTokenExpiry,
        issuer: "school-management-system",
        audience: "sms-client",
      }
    );

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
        rememberMe: rememberMe,
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
      timestamp: new Date().toISOString(),
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
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const token = req.token;

    if (userId) {
      // Blacklist the current token
      if (token) {
        tokenBlacklist.blacklist(token);
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
      timestamp: new Date().toISOString(),
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
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.role, 
              u.phone, u.address, u.date_of_birth, u.profile_image_url, 
              u.is_verified, u.status, u.last_login, u.created_at, u.updated_at
       FROM users u
       WHERE u.id = $1 AND u.status != 'deleted'`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AuthenticationError("User not found");
    }

    const user = userResult.rows[0];

    res.json({
      status: "success",
      data: {
        user: {
          ...formatUserResponse(user),
          updatedAt: user.updated_at,
        },
      },
      timestamp: new Date().toISOString(),
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
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AuthenticationError("Refresh token is required");
    }

    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(refreshToken)) {
      throw new AuthenticationError("Token has been invalidated");
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user with status check
    const userResult = await query(
      `SELECT id, username, first_name, last_name, email, role, is_verified, status
       FROM users WHERE id = $1`,
      [decoded.id || decoded.userId]
    );

    if (userResult.rows.length === 0) {
      throw new AuthenticationError("Invalid refresh token");
    }

    const user = userResult.rows[0];

    // Security checks
    if (user.status !== "active") {
      throw new AuthenticationError("Account is not active");
    }

    if (!user.is_verified && process.env.NODE_ENV === "production") {
      throw new AuthenticationError("Account not verified");
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

    // Blacklist old refresh token
    tokenBlacklist.blacklist(refreshToken);

    await createAuditLog({
      action: AUDIT_ACTIONS.TOKEN_REFRESHED,
      userId: user.id,
      details: "Access token refreshed successfully",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    logger.info("🔄 Token refreshed", { userId: user.id });

    res.json({
      status: "success",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
        tokenType: "Bearer",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Token refresh error", { error: error.message });
    next(error);
  }
};

// ========================= PASSWORD MANAGEMENT =========================

/**
 * Enhanced password reset request with security measures
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw new ValidationError("Please provide a valid email address");
    }

    // Find user by email
    const userResult = await query(
      `SELECT id, email, first_name, last_name, is_verified, status
       FROM users WHERE email = $1 AND status != 'deleted'`,
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

      res.json({
        status: "success",
        message: successMessage,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const user = userResult.rows[0];

    // Additional security checks
    if (user.status !== "active") {
      logger.warn("Password reset requested for inactive account", {
        userId: user.id,
        status: user.status,
        ip: req.ip,
      });

      res.json({
        status: "success",
        message: successMessage,
        timestamp: new Date().toISOString(),
      });
      return;
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

    // Send enhanced password reset email using existing emailService method
    await emailService.sendPasswordResetEmail(
      {
        resetLink: `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`,
        name: `${user.first_name} ${user.last_name}`.trim() || "User",
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

    res.json({
      status: "success",
      message: successMessage,
      timestamp: new Date().toISOString(),
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
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ValidationError("Token and new password are required");
    }

    if (!validatePassword(newPassword)) {
      throw new ValidationError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      );
    }

    // Verify reset token
    const decoded = verifyResetToken(token);

    // Find user with valid reset token
    const userResult = await query(
      `SELECT id, email, password, reset_token, reset_token_expires, first_name, last_name
       FROM users 
       WHERE id = $1 AND reset_token = $2 AND reset_token_expires > NOW() AND status = 'active'`,
      [decoded.userId, token]
    );

    if (userResult.rows.length === 0) {
      throw new AuthenticationError("Invalid or expired reset token");
    }

    const user = userResult.rows[0];

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ValidationError("New password must be different from current password");
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

    // Send confirmation email using sendEmail
    setImmediate(async () => {
      try {
        await emailService.sendEmail({
          to: user.email,
          subject: "✅ Password Reset Successful",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #059669; margin: 0 0 30px 0; text-align: center;">✅ Password Reset Successful</h2>
                
                <p>Your password has been successfully reset.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <strong>Reset Details:</strong><br>
                  Time: ${new Date().toLocaleString()}<br>
                  IP Address: ${req.ip}<br>
                  Browser: ${req.get("User-Agent")}
                </div>
                
                <p>If you didn't make this change, please contact support immediately.</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 14px;">
                  Contact us at <strong>${process.env.SUPPORT_EMAIL || "support@schoolms.com"}</strong><br>
                  Best regards,<br>The School Management Team
                </p>
              </div>
            </div>
          `,
          text: `
Password Reset Successful - School Management System

Your password has been successfully reset.

Reset Details:
- Time: ${new Date().toLocaleString()}
- IP Address: ${req.ip}
- Browser: ${req.get("User-Agent")}

If you didn't make this change, please contact support immediately.

Contact us at ${process.env.SUPPORT_EMAIL || "support@schoolms.com"}

Best regards,
The School Management Team
          `,
        });
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Password reset error", { error: error.message });
    next(error);
  }
};

// ========================= EMAIL VERIFICATION =========================

/**
 * Clean email verification function - Production Version
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new ValidationError("Verification token is required");
    }

    // Verify email token
    const decoded = verifyVerificationToken(token);

    // Update user verification status
    const result = await query(
      `UPDATE users 
       SET is_verified = true, 
           email_verified_at = NOW(),
           updated_at = NOW() 
       WHERE id = $1 AND is_verified = false
       RETURNING id, email, first_name, last_name, role, profile_completed, status`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      // Check if user exists but is already verified
      const userCheck = await query(
        "SELECT id, email, first_name, last_name, role, profile_completed, is_verified FROM users WHERE id = $1",
        [decoded.userId]
      );

      if (userCheck.rows.length > 0) {
        const existingUser = userCheck.rows[0];

        if (existingUser.is_verified) {
          res.json({
            status: "success",
            message: "Email is already verified",
            data: {
              user: {
                id: existingUser.id,
                email: existingUser.email,
                first_name: existingUser.first_name,
                last_name: existingUser.last_name,
                role: existingUser.role,
                profile_completed: existingUser.profile_completed,
                is_verified: true,
              },
              nextStep: existingUser.profile_completed ? "login" : "complete_profile",
              tempToken: existingUser.profile_completed
                ? null
                : jwt.sign(
                    {
                      userId: existingUser.id,
                      id: existingUser.id,
                      email: existingUser.email,
                      role: existingUser.role,
                      purpose: "profile_completion",
                    },
                    process.env.JWT_SECRET || "your-secret-key",
                    { expiresIn: "2h" }
                  ),
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      throw new AuthenticationError("Invalid verification token or user not found");
    }

    const user = result.rows[0];

    // Create audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.EMAIL_VERIFIED,
      userId: user.id,
      details: "Email verified successfully",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Send welcome confirmation email (non-blocking)
    setImmediate(async () => {
      try {
        const userName = `${user.first_name} ${user.last_name}`.trim() || "User";
        const loginLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/login`;

        await emailService.sendEmail({
          to: user.email,
          subject: "Email Verified Successfully!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #059669;">Email Verified!</h2>
              <p>Hi <strong>${userName}</strong>,</p>
              <p>Your email address has been successfully verified. You can now access all features of the School Management System.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginLink}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  Login Now
                </a>
              </div>
              <p>Best regards,<br>The School Management Team</p>
            </div>
          `,
          text: `Email Verified Successfully! Hi ${userName}, your email has been verified. Login: ${loginLink}`,
        });
      } catch (emailError) {
        logger.error("Failed to send verification success email", {
          userId: user.id,
          error: emailError.message,
        });
      }
    });

    // Determine next step based on profile completion status
    const isProfileCompleted = user.profile_completed || false;

    if (isProfileCompleted) {
      // Profile already completed - redirect to login
      res.json({
        status: "success",
        message: "Email verified successfully! You can now log in.",
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            profile_completed: user.profile_completed,
            is_verified: true,
            status: user.status,
          },
          nextStep: "login",
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      // Generate temp token for profile completion
      const tempToken = jwt.sign(
        {
          userId: user.id,
          id: user.id,
          email: user.email,
          role: user.role,
          purpose: "profile_completion",
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "2h" }
      );

      res.json({
        status: "success",
        message: "Email verified successfully! Please complete your profile to continue.",
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            profile_completed: user.profile_completed,
            is_verified: true,
            status: user.status,
          },
          tempToken,
          nextStep: "complete_profile",
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error("Email verification error", {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    next(error);
  }
};

/**
 * Resend verification email
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw new ValidationError("Please provide a valid email address");
    }

    const userResult = await query(
      `SELECT id, email, first_name, last_name, is_verified, status
       FROM users WHERE email = $1 AND status != 'deleted'`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists
      res.json({
        status: "success",
        message: "If the email exists, a verification link has been sent",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const user = userResult.rows[0];

    if (user.status !== "active") {
      res.json({
        status: "success",
        message: "If the email exists, a verification link has been sent",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (user.is_verified) {
      res.json({
        status: "success",
        message: "Email is already verified",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generate new verification token
    const newVerificationToken = generateVerificationToken(user.id);

    // Send verification email using emailService
    await emailService.sendEmailVerification(
      {
        name: `${user.first_name} ${user.last_name}`.trim() || "User",
        firstName: user.first_name,
      },
      user.email,
      newVerificationToken
    );

    await createAuditLog({
      action: AUDIT_ACTIONS.EMAIL_VERIFICATION_RESENT,
      userId: user.id,
      details: "Verification email resent",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    logger.info("📧 Verification email resent", {
      email: user.email,
      userId: user.id,
    });

    res.json({
      status: "success",
      message: "Verification email sent successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Resend verification error", { error: error.message });
    next(error);
  }
};

// ========================= UTILITY ENDPOINTS =========================

/**
 * Check if user exists (enhanced for security)
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const checkUser = async (req, res, next) => {
  try {
    const { email } = req.params;

    if (!validateEmail(email)) {
      throw new ValidationError("Please provide a valid email address");
    }

    const userResult = await query(
      `SELECT id, email, username, is_verified, status, role, created_at
       FROM users WHERE email = $1 AND status != 'deleted'`,
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Check user error", { error: error.message });
    next(error);
  }
};

/**
 * Verify authentication status (for middleware checks)
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const verifyAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const userResult = await query(
      `SELECT id, username, first_name, last_name, email, role, is_verified, status
       FROM users WHERE id = $1 AND status != 'deleted'`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      throw new AuthenticationError("User not found");
    }

    const user = userResult.rows[0];

    if (user.status !== "active") {
      throw new AuthenticationError("Account is not active");
    }

    res.json({
      status: "success",
      authenticated: true,
      user: formatUserResponse(user),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Verify auth error", { error: error.message });
    next(error);
  }
};

/**
 * Development-only email verification bypass
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const verifyUserEmail = async (req, res, next) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === "production") {
      throw new AuthenticationError("This endpoint is not available in production");
    }

    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw new ValidationError("Please provide a valid email address");
    }

    const result = await query(
      `UPDATE users 
       SET is_verified = true, 
           email_verified_at = NOW(),
           updated_at = NOW() 
       WHERE email = $1 AND status != 'deleted'
       RETURNING id, email, first_name, last_name`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new ValidationError("User not found");
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

    res.json({
      status: "success",
      message: "Email verified successfully (development mode)",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`.trim(),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Manual email verification error", {
      error: error.message,
    });
    next(error);
  }
};

// ========================= ADVANCED FEATURES =========================

/**
 * Change password (for authenticated users)
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError("Current password and new password are required");
    }

    if (!validatePassword(newPassword)) {
      throw new ValidationError(
        "New password must be at least 8 characters with uppercase, lowercase, number, and special character"
      );
    }

    // Get current user with password
    const userResult = await query(
      `SELECT id, email, password, first_name, last_name
       FROM users WHERE id = $1 AND status = 'active'`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AuthenticationError("User not found");
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError("Current password is incorrect");
    }

    // Check if new password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ValidationError("New password must be different from current password");
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      `UPDATE users 
       SET password = $1, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    await createAuditLog({
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      userId: userId,
      details: "Password changed successfully",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    logger.info("🔑 Password changed successfully", { userId });

    res.json({
      status: "success",
      message: "Password changed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Change password error", {
      userId: req.user?.id,
      error: error.message,
    });
    next(error);
  }
};

/**
 * Update user profile
 * @param {ExpressRequest & AuthRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 * @returns {Promise<void>}
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, address, dateOfBirth } = req.body;

    // Validate inputs
    if (firstName && !validateName(firstName)) {
      throw new ValidationError("First name must be between 2 and 50 characters");
    }

    if (lastName && !validateName(lastName)) {
      throw new ValidationError("Last name must be between 2 and 50 characters");
    }

    if (phone && !validatePhone(phone)) {
      throw new ValidationError("Please provide a valid phone number");
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }

    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }

    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex++}`);
      values.push(address);
    }

    if (dateOfBirth !== undefined) {
      updateFields.push(`date_of_birth = $${paramIndex++}`);
      values.push(dateOfBirth);
    }

    if (updateFields.length === 0) {
      throw new ValidationError("No valid fields to update");
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, username, first_name, last_name, email, role, phone, address, date_of_birth, is_verified, status, created_at, updated_at
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      throw new AuthenticationError("User not found");
    }

    const updatedUser = result.rows[0];

    await createAuditLog({
      action: AUDIT_ACTIONS.PROFILE_UPDATED,
      userId: userId,
      details: `Profile updated: ${updateFields.slice(0, -1).join(", ")}`,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: { updatedFields: updateFields.slice(0, -1) },
    });

    logger.info("👤 Profile updated successfully", { userId });

    res.json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: formatUserResponse({
          ...updatedUser,
          date_of_birth: updatedUser.date_of_birth,
        }),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Update profile error", {
      userId: req.user?.id,
      error: error.message,
    });
    next(error);
  }
};

// ========================= EXPORTS =========================

const authController = {
  // Core authentication
  register,
  login,
  logout,
  getCurrentUser,

  // Token management
  refreshToken,

  // Password management
  requestPasswordReset,
  resetPassword,
  changePassword,

  // Email verification
  verifyEmail,
  resendVerification,
  verifyUserEmail, // Dev only
  checkEmailExists,

  // Utility endpoints
  checkUser,
  verifyAuth,

  // Profile management
  updateProfile,
  completeProfile,

  // Legacy aliases (for backward compatibility)
  resendVerificationEmail: resendVerification,
  createUser: register, // Alias for register
};

export default authController;

// Export utility functions and classes for use in other modules
export {
  ApiError,
  ValidationError,
  AuthenticationError,
  ConflictError,
  validateEmail,
  validatePassword,
  validateUsername,
  formatUserResponse,
  createAuditLog,
  AUDIT_ACTIONS,
};
