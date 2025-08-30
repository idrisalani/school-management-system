// @ts-check
// server/src/controllers/auth.controller.js - TypeScript-Fixed Production Version
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query } from "../config/database.js";
import logger from "../utils/logger.js";
import sgMail from "@sendgrid/mail";

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
 * Create comprehensive audit log entry
 * @param {Object} auditData - Audit log data
 * @param {string} auditData.action - Action performed
 * @param {number} [auditData.userId] - User ID who performed action
 * @param {string} auditData.details - Detailed description
 * @param {string} [auditData.ipAddress] - Client IP address
 * @param {string} [auditData.userAgent] - Client user agent
 * @param {Object} [auditData.metadata] - Additional metadata
 * @returns {Promise<void>}
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
    await query(
      `INSERT INTO audit_logs (
        action, user_id, details, ip_address, user_agent, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [action, userId, details, ipAddress, userAgent, JSON.stringify(metadata)]
    );

    logger.debug("📝 Audit log created", {
      action,
      userId,
      details,
      ipAddress,
    });
  } catch (error) {
    // Don't let audit logging failures break the main flow
    logger.error("❌ Failed to create audit log", {
      action,
      userId,
      error: error.message,
    });
  }
};

// ========================= EMAIL SERVICE INTEGRATION =========================

/**
 * Enhanced Email Service with template support
 */
class EmailService {
  constructor() {
    this.templates = {
      welcomeEmail: {
        subject: "🎓 Welcome to School Management System!",
        getHtml: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome ${data.name}!</h2>
            <p>Your account has been successfully created in our School Management System.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <strong>Account Details:</strong><br>
              Username: <code>${data.username}</code><br>
              Email: <code>${data.email}</code><br>
              Role: <code>${data.role}</code>
            </div>
            <p>To get started, please verify your email address:</p>
            <a href="${data.verificationLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
            <p style="margin-top: 20px;">
              <a href="${data.loginLink}">Login to your account</a>
            </p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Need help? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>
            </p>
          </div>
        `,
      },
      passwordReset: {
        subject: "🔑 Password Reset Request",
        getHtml: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Password Reset Request</h2>
            <p>Hi ${data.name},</p>
            <p>You requested a password reset for your School Management System account.</p>
            <p>Click the button below to reset your password (valid for ${data.expirationTime}):</p>
            <a href="${data.resetLink}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
            <p style="margin-top: 20px; color: #ef4444;">
              <strong>Security Notice:</strong> ${data.securityNotice}
            </p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Need help? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>
            </p>
          </div>
        `,
      },
      emailVerification: {
        subject: "📧 Verify Your Email Address",
        getHtml: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Email Verification Required</h2>
            <p>Hi ${data.firstName || data.name},</p>
            <p>Thank you for registering with our School Management System. Please verify your email address to activate your account:</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${data.verificationLink}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
              <a href="${data.verificationLink}">${data.verificationLink}</a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              This verification link will expire in ${data.expirationTime || "24 hours"}.
            </p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              If you didn't create this account, please ignore this email.<br>
              Need help? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>
            </p>
          </div>
        `,
      },
      emailVerificationSuccess: {
        subject: "✅ Email Verified Successfully!",
        getHtml: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Email Verified! 🎉</h2>
            <p>Hi ${data.name},</p>
            <p>Your email address has been successfully verified. You can now access all features of the School Management System.</p>
            <div style="margin: 20px 0;">
              <a href="${data.loginLink}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
                Login Now
              </a>
              <a href="${data.dashboardLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
          </div>
        `,
      },
      passwordResetConfirmation: {
        subject: "✅ Password Reset Successful",
        getHtml: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Password Reset Successful</h2>
            <p>Your password has been successfully reset.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <strong>Reset Details:</strong><br>
              Time: ${data.timestamp}<br>
              IP Address: ${data.ipAddress}<br>
              Browser: ${data.userAgent}
            </div>
            <p>If you didn't make this change, please contact support immediately.</p>
            <p style="color: #6b7280; font-size: 14px;">
              Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>
            </p>
          </div>
        `,
      },
    };
  }

  /**
   * Send email using template
   * @param {string} templateName - Template name
   * @param {Object} data - Template data
   * @param {string} to - Recipient email
   * @returns {Promise<{success: boolean, messageId: string}>}
   */
  async sendTemplate(templateName, data, to) {
    try {
      const template = this.templates[templateName];
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      const html = template.getHtml(data);
      const subject = template.subject;

      // In production, integrate with your email service (SendGrid, SES, etc.)
      // For now, we'll log the email content
      logger.info("📧 Email sent", {
        to,
        subject,
        template: templateName,
        // In development, you might want to log the full HTML
        preview:
          process.env.NODE_ENV === "development" ? html : "Email content hidden in production",
      });

      // TODO: Replace with actual email service integration
      // Example with SendGrid:
      // await sgMail.send({ to, subject, html, from: process.env.FROM_EMAIL });

      return { success: true, messageId: `mock-${Date.now()}` };
    } catch (error) {
      logger.error("❌ Failed to send email", {
        templateName,
        to,
        error: error.message,
      });
      throw error;
    }
  }
}

const emailService = new EmailService();

// ========================= TOKEN MANAGEMENT =========================

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

  // Basic international phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
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
      name,
      username,
      firstName,
      lastName,
      role = "student",
      phone,
      dateOfBirth,
      address,
    } = req.body;

    // Keep your existing flexible name handling
    const fullName = name || username || `${firstName || ""} ${lastName || ""}`.trim();

    // Keep all your existing comprehensive validation
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

    // Keep your existing role validation
    const validRoles = ["student", "teacher", "admin", "parent"];
    if (!validRoles.includes(role)) {
      throw new ValidationError(`Role must be one of: ${validRoles.join(", ")}`);
    }

    // Keep your existing name parsing
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
        const verificationToken = generateVerificationToken(user.id);

        // Update existing user with new token
        await query(
          `UPDATE users SET 
           verification_token = $1, 
           token_expiry = NOW() + INTERVAL '24 hours',
           updated_at = NOW()
           WHERE id = $2`,
          [verificationToken, user.id]
        );

        // Resend verification email using your existing email system
        setImmediate(async () => {
          try {
            await emailService.sendTemplate(
              "emailVerification",
              {
                name: parsedFirstName || fullName,
                verificationLink: `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${verificationToken}`,
                supportEmail: process.env.SUPPORT_EMAIL || "support@schoolms.com",
              },
              email.toLowerCase()
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
      }
    }

    // Keep your existing password hashing
    logger.debug("🔐 Hashing password...");
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification token using your existing function
    const verificationToken = generateVerificationToken(1); // Temporary user ID for token generation

    // UPDATED: Insert new user with verification fields added to your existing query
    const result = await query(
      `INSERT INTO users (
        username, first_name, last_name, email, password, role, 
        phone, address, date_of_birth, is_verified, profile_completed, status, 
        verification_token, token_expiry, login_attempts, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW() + INTERVAL '24 hours', $14, NOW(), NOW()) 
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
        generateVerificationToken(1), // Will update after getting real user ID
        0, // login_attempts
      ]
    );

    const newUser = result.rows[0];

    // Generate proper verification token with real user ID
    const properVerificationToken = generateVerificationToken(newUser.id);

    // Update user with proper verification token
    await query(
      `UPDATE users SET 
       verification_token = $1,
       token_expiry = NOW() + INTERVAL '24 hours'
       WHERE id = $2`,
      [properVerificationToken, newUser.id]
    );

    logger.info("✅ User created successfully with email verification", {
      userId: newUser.id,
      username: generatedUsername,
      email: email.toLowerCase(),
    });

    // Keep your existing comprehensive audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.USER_CREATED,
      userId: newUser.id,
      details: `User registered with email verification required: ${email.toLowerCase()}, role: ${role}`,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        registrationSource: "web",
        role: role,
        hasPhone: !!phone,
        hasAddress: !!address,
        requiresEmailVerification: true,
      },
    });

    // UPDATED: Send verification email using your existing template system
    setImmediate(async () => {
      try {
        // Add emailVerification template to your existing EmailService templates
        await emailService.sendTemplate(
          "emailVerification", // New template to add to your existing templates
          {
            name: fullName,
            firstName: parsedFirstName || fullName,
            verificationLink: `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${properVerificationToken}`,
            supportEmail: process.env.SUPPORT_EMAIL || "support@schoolms.com",
            expirationTime: "24 hours",
          },
          email.toLowerCase()
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

    // Keep your existing success response with updated message
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
 * Complete user profile after email verification
 */
export const completeProfile = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AuthenticationError("Profile completion token required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

    // FIXED: JavaScript-compatible type checking instead of TypeScript 'as'
    if (typeof decoded !== "object" || decoded === null) {
      throw new AuthenticationError("Invalid token format");
    }

    // FIXED: Use bracket notation instead of type assertion
    if (!decoded["purpose"] || decoded["purpose"] !== "profile_completion") {
      throw new AuthenticationError("Invalid token purpose");
    }

    if (!decoded["userId"]) {
      throw new AuthenticationError("Invalid token - missing user ID");
    }

    // FIXED: Extract values with proper checking
    const userId = decoded["userId"];
    const profileData = req.body;

    // Get user info
    const userResult = await query(
      "SELECT id, role, is_verified, first_name, last_name, email FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_verified) {
      throw new AuthenticationError("User not found or not verified");
    }

    const user = userResult.rows[0];
    const userRole = user.role;

    // Validate required fields based on role
    const requiredFields = ["phone", "address", "dateOfBirth", "gender"];
    if (userRole === "student") {
      requiredFields.push("gradeLevel", "parentEmail", "emergencyContact");
    } else if (userRole === "teacher") {
      requiredFields.push("department", "qualifications");
    }

    for (const field of requiredFields) {
      if (!profileData[field]) {
        throw new ValidationError(`${field} is required for ${userRole}s`);
      }
    }

    // Update user profile
    const updateQuery = `
      UPDATE users SET 
        phone = $1, 
        address = $2, 
        date_of_birth = $3, 
        gender = $4, 
        bio = $5,
        parent_email = $6,
        emergency_contact = $7,
        qualifications = $8,
        profile_completed = true,
        profile_completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $9
      RETURNING id, username, first_name, last_name, email, role
    `;

    const updateResult = await query(updateQuery, [
      profileData.phone,
      profileData.address,
      profileData.dateOfBirth,
      profileData.gender,
      profileData.bio || null,
      profileData.parentEmail || null,
      profileData.emergencyContact || null,
      profileData.qualifications || null,
      userId,
    ]);

    const updatedUser = updateResult.rows[0];

    // Create audit log using your existing system
    await createAuditLog({
      action: AUDIT_ACTIONS.PROFILE_UPDATED,
      userId: userId,
      details: `Profile completed successfully for ${userRole}`,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        profileCompletion: true,
        role: userRole,
        completedFields: requiredFields,
      },
    });

    // Generate full access token using your existing function
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

    res.status(200).json({
      status: "success",
      message: "Profile completed successfully!",
      data: {
        user: formatUserResponse({
          ...updatedUser,
          is_verified: true,
          profile_completed: true,
        }),
        token: accessToken,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Profile completion error:", {
      error: error.message,
      ip: req.ip,
    });
    next(error);
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

    // Send enhanced password reset email
    await emailService.sendTemplate(
      "passwordReset",
      {
        name: `${user.first_name} ${user.last_name}`.trim() || "User",
        resetLink: `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`,
        expirationTime: "1 hour",
        supportEmail: process.env.SUPPORT_EMAIL || "support@schoolms.com",
        securityNotice:
          "If you didn't request this reset, please ignore this email and consider changing your password",
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Password reset error", { error: error.message });
    next(error);
  }
};

// ========================= EMAIL VERIFICATION =========================

/**
 * Enhanced email verification
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
       RETURNING id, email, first_name, last_name`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      // Check if user exists but is already verified
      const userCheck = await query("SELECT is_verified FROM users WHERE id = $1", [
        decoded.userId,
      ]);

      if (userCheck.rows.length > 0 && userCheck.rows[0].is_verified) {
        res.json({
          status: "success",
          message: "Email is already verified",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      throw new AuthenticationError("Invalid verification token or user not found");
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
            loginLink: `${process.env.CLIENT_URL || "http://localhost:3000"}/login`,
            dashboardLink: `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard`,
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

    const tempToken = jwt.sign(
      { userId: user.id, purpose: "profile_completion" },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "2h" }
    );

    res.json({
      status: "success",
      message: "Email verified successfully! Please complete your profile to continue.",
      data: {
        user: formatUserResponse(user),
        tempToken, // Add this
        nextStep: user.profile_completed ? "login" : "complete-profile", // Add this
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("💥 Email verification error", { error: error.message });
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
    const verificationToken = generateVerificationToken(user.id);

    // Send verification email
    await emailService.sendTemplate(
      "emailVerification",
      {
        name: `${user.first_name} ${user.last_name}`.trim() || "User",
        verificationLink: `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`,
        supportEmail: process.env.SUPPORT_EMAIL || "support@schoolms.com",
      },
      user.email
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
