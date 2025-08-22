// @ts-check
// server/src/utils/tokens.js - Reconciled Enterprise Token Management System

import jwt from "jsonwebtoken";
import crypto from "crypto";
import logger from "./logger.js";
import dotenv from "dotenv";

dotenv.config();

// Import database query function for persistent blacklisting
let query;
try {
  // Use dynamic import without top-level await for better TypeScript compatibility
  import("../config/database.js")
    .then((dbModule) => {
      query = dbModule.query;
      logger.info("Database module loaded for token blacklisting");
    })
    .catch((error) => {
      logger.warn(
        "Database module not available, using in-memory blacklisting only",
        {
          error: error.message,
        }
      );
    });
} catch (error) {
  logger.warn(
    "Database module not available, using in-memory blacklisting only",
    {
      error: error.message,
    }
  );
}

/**
 * @typedef {Object} TokenPayload
 * @property {string} userId - User ID
 * @property {string} [email] - User email
 * @property {string} [role] - User role
 * @property {string} type - Token type
 * @property {number} [timestamp] - Token creation timestamp
 * @property {number} [version] - Token version for refresh tokens
 * @property {string} [purpose] - Token purpose for verification tokens
 * @property {string} [nonce] - Random nonce for reset tokens
 * @property {number} [iat] - Issued at timestamp
 * @property {number} [exp] - Expiration timestamp
 * @property {string} [jti] - JWT ID
 */

/**
 * @typedef {Object} TokenPair
 * @property {string} accessToken - JWT access token
 * @property {string} refreshToken - JWT refresh token
 * @property {number} expiresIn - Access token expiry in seconds
 * @property {string} tokenType - Token type (Bearer)
 */

/**
 * @typedef {Object} TokenInfo
 * @property {boolean} valid - Whether token is valid
 * @property {boolean} expired - Whether token is expired
 * @property {Date|null} expiresAt - Token expiration date
 * @property {TokenPayload|null} payload - Decoded token payload
 * @property {string} [error] - Error message if invalid
 */

/**
 * Enterprise-grade Token Management System
 * Combines security, functionality, and maintainability with hybrid blacklisting
 */
export class TokenManager {
  // Token configuration with secure defaults
  static config = {
    secrets: {
      access:
        process.env.JWT_ACCESS_SECRET ||
        process.env.JWT_SECRET ||
        "fallback-access-secret-change-in-production",
      refresh:
        process.env.JWT_REFRESH_SECRET ||
        process.env.JWT_SECRET ||
        "fallback-refresh-secret-change-in-production",
      verification:
        process.env.JWT_VERIFICATION_SECRET ||
        process.env.JWT_SECRET ||
        "fallback-verification-secret-change-in-production",
      reset:
        process.env.JWT_RESET_SECRET ||
        process.env.JWT_SECRET ||
        "fallback-reset-secret-change-in-production",
    },
    issuer: process.env.JWT_ISSUER || "school-management-system",
    audience: process.env.JWT_AUDIENCE || "school-management-app",
    expiryTimes: {
      access: process.env.JWT_ACCESS_EXPIRY || "15m",
      refresh: process.env.JWT_REFRESH_EXPIRY || "7d",
      verification: process.env.JWT_VERIFICATION_EXPIRY || "24h",
      reset: process.env.JWT_RESET_EXPIRY || "1h",
    },
  };

  // Hybrid blacklist system: in-memory + database
  static memoryBlacklist = new Set();
  static blacklistCache = new Map(); // Cache database results

  // ========================================
  // Token Generation Methods
  // ========================================

  /**
   * Generate access token with comprehensive payload
   * @param {Object} user - User object
   * @param {Object} [options] - Additional options
   * @returns {string} JWT access token
   */
  static generateAccessToken(user, options = {}) {
    try {
      const payload = {
        userId: user.id || user._id,
        email: user.email,
        role: user.role,
        type: "access",
        iat: Math.floor(Date.now() / 1000),
        ...options.additionalClaims,
      };

      const token = jwt.sign(payload, this.config.secrets.access, {
        expiresIn: options.expiresIn || this.config.expiryTimes.access,
        issuer: this.config.issuer,
        audience: this.config.audience,
        jwtid: options.jwtId || crypto.randomUUID(),
      });

      logger.debug("Access token generated", {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        expiresIn: options.expiresIn || this.config.expiryTimes.access,
      });

      return token;
    } catch (error) {
      logger.error("Failed to generate access token", {
        error: error.message,
        userId: user.id || user._id,
        email: user.email,
      });
      throw new Error("Failed to generate access token");
    }
  }

  /**
   * Generate refresh token for token rotation
   * @param {Object} user - User object
   * @param {Object} [options] - Additional options
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(user, options = {}) {
    try {
      const payload = {
        userId: user.id || user._id,
        type: "refresh",
        iat: Math.floor(Date.now() / 1000),
        version: options.version || 1, // For token rotation
      };

      const token = jwt.sign(payload, this.config.secrets.refresh, {
        expiresIn: options.expiresIn || this.config.expiryTimes.refresh,
        issuer: this.config.issuer,
        audience: this.config.audience,
        jwtid: options.jwtId || crypto.randomUUID(),
      });

      logger.debug("Refresh token generated", {
        userId: payload.userId,
        version: payload.version,
        expiresIn: options.expiresIn || this.config.expiryTimes.refresh,
      });

      return token;
    } catch (error) {
      logger.error("Failed to generate refresh token", {
        error: error.message,
        userId: user.id || user._id,
      });
      throw new Error("Failed to generate refresh token");
    }
  }

  /**
   * Generate email verification token
   * @param {string} userId - User ID
   * @param {Object} [options] - Additional options
   * @returns {string} JWT verification token
   */
  static generateVerificationToken(userId, options = {}) {
    try {
      const payload = {
        userId,
        type: "verification",
        iat: Math.floor(Date.now() / 1000),
        purpose: options.purpose || "email_verification",
      };

      const token = jwt.sign(payload, this.config.secrets.verification, {
        expiresIn: options.expiresIn || this.config.expiryTimes.verification,
        issuer: this.config.issuer,
        audience: this.config.audience,
        jwtid: options.jwtId || crypto.randomUUID(),
      });

      logger.debug("Verification token generated", {
        userId,
        purpose: payload.purpose,
        expiresIn: options.expiresIn || this.config.expiryTimes.verification,
      });

      return token;
    } catch (error) {
      logger.error("Failed to generate verification token", {
        error: error.message,
        userId,
      });
      throw new Error("Failed to generate verification token");
    }
  }

  /**
   * Generate password reset token with enhanced security
   * @param {string} userId - User ID
   * @param {Object} [options] - Additional options
   * @returns {string} JWT reset token
   */
  static generateResetToken(userId, options = {}) {
    try {
      const payload = {
        userId,
        type: "reset",
        iat: Math.floor(Date.now() / 1000),
        timestamp: Date.now(), // Additional timestamp for extra security
        nonce: crypto.randomBytes(16).toString("hex"), // Prevent replay attacks
      };

      const token = jwt.sign(payload, this.config.secrets.reset, {
        expiresIn: options.expiresIn || this.config.expiryTimes.reset,
        issuer: this.config.issuer,
        audience: this.config.audience,
        jwtid: options.jwtId || crypto.randomUUID(),
      });

      logger.debug("Reset token generated", {
        userId,
        expiresIn: options.expiresIn || this.config.expiryTimes.reset,
      });

      return token;
    } catch (error) {
      logger.error("Failed to generate reset token", {
        error: error.message,
        userId,
      });
      throw new Error("Failed to generate reset token");
    }
  }

  // ========================================
  // Token Verification Methods
  // ========================================

  /**
   * Verify access token with comprehensive validation
   * @param {string} token - JWT token
   * @returns {Promise<TokenPayload>} Decoded token payload
   */
  static async verifyAccessToken(token) {
    try {
      // Check blacklist first (hybrid approach)
      if (await this.isTokenBlacklisted(token)) {
        throw new Error("Token has been revoked");
      }

      const decoded = jwt.verify(token, this.config.secrets.access, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      // Validate token type
      if (decoded.type !== "access") {
        throw new Error("Invalid token type - expected access token");
      }

      logger.debug("Access token verified successfully", {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000),
      });

      return decoded;
    } catch (error) {
      logger.warn("Access token verification failed", {
        error: error.message,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });

      // Convert JWT errors to user-friendly messages
      if (error.name === "TokenExpiredError") {
        throw new Error("Access token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid access token");
      } else if (error.name === "NotBeforeError") {
        throw new Error("Access token not active yet");
      } else {
        throw new Error(error.message || "Access token verification failed");
      }
    }
  }

  /**
   * Verify refresh token for token rotation
   * @param {string} token - JWT token
   * @returns {Promise<TokenPayload>} Decoded token payload
   */
  static async verifyRefreshToken(token) {
    try {
      // Check blacklist first
      if (await this.isTokenBlacklisted(token)) {
        throw new Error("Refresh token has been revoked");
      }

      const decoded = jwt.verify(token, this.config.secrets.refresh, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      // Validate token type
      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type - expected refresh token");
      }

      logger.debug("Refresh token verified successfully", {
        userId: decoded.userId,
        version: decoded.version,
        exp: new Date(decoded.exp * 1000),
      });

      return decoded;
    } catch (error) {
      logger.warn("Refresh token verification failed", {
        error: error.message,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });

      if (error.name === "TokenExpiredError") {
        throw new Error("Refresh token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid refresh token");
      } else {
        throw new Error(error.message || "Refresh token verification failed");
      }
    }
  }

  /**
   * Verify email verification token
   * @param {string} token - JWT token
   * @returns {Promise<TokenPayload>} Decoded token payload
   */
  static async verifyVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.secrets.verification, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      if (decoded.type !== "verification") {
        throw new Error("Invalid token type - expected verification token");
      }

      logger.debug("Verification token verified successfully", {
        userId: decoded.userId,
        purpose: decoded.purpose,
        exp: new Date(decoded.exp * 1000),
      });

      return decoded;
    } catch (error) {
      logger.warn("Verification token verification failed", {
        error: error.message,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });

      if (error.name === "TokenExpiredError") {
        throw new Error("Verification token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid verification token");
      } else {
        throw new Error(
          error.message || "Verification token verification failed"
        );
      }
    }
  }

  /**
   * Verify password reset token with enhanced security checks
   * @param {string} token - JWT token
   * @returns {Promise<TokenPayload>} Decoded token payload
   */
  static async verifyResetToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.secrets.reset, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      if (decoded.type !== "reset") {
        throw new Error("Invalid token type - expected reset token");
      }

      // Additional timestamp validation for extra security
      if (decoded.timestamp) {
        const tokenAge = Date.now() - decoded.timestamp;
        const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds

        if (tokenAge > maxAge) {
          throw new Error("Reset token has expired (timestamp check)");
        }
      }

      logger.debug("Reset token verified successfully", {
        userId: decoded.userId,
        timestamp: new Date(decoded.timestamp),
        exp: new Date(decoded.exp * 1000),
      });

      return decoded;
    } catch (error) {
      logger.warn("Reset token verification failed", {
        error: error.message,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });

      if (error.name === "TokenExpiredError") {
        throw new Error("Reset token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid reset token");
      } else {
        throw new Error(error.message || "Reset token verification failed");
      }
    }
  }

  // ========================================
  // Token Management Utilities
  // ========================================

  /**
   * Create token pair (access + refresh)
   * @param {Object} user - User object
   * @param {Object} [options] - Additional options
   * @returns {TokenPair} Token pair object
   */
  static createTokenPair(user, options = {}) {
    try {
      const accessToken = this.generateAccessToken(user, options.access);
      const refreshToken = this.generateRefreshToken(user, options.refresh);

      // Calculate expiry in seconds
      const expiresIn = this.parseExpiryToSeconds(
        options.access?.expiresIn || this.config.expiryTimes.access
      );

      logger.info("Token pair created", {
        userId: user.id || user._id,
        email: user.email,
        role: user.role,
        accessExpiresIn: expiresIn,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: "Bearer",
      };
    } catch (error) {
      logger.error("Failed to create token pair", {
        error: error.message,
        userId: user.id || user._id,
      });
      throw new Error("Failed to create token pair");
    }
  }

  /**
   * Refresh token pair - rotate both tokens for security
   * @param {string} refreshToken - Current refresh token
   * @param {Object} user - User object
   * @returns {Promise<TokenPair>} New token pair
   */
  static async refreshTokenPair(refreshToken, user) {
    try {
      // Verify current refresh token
      const decoded = await this.verifyRefreshToken(refreshToken);

      // Blacklist the old refresh token
      await this.blacklistToken(
        refreshToken,
        user.id || user._id,
        "Token rotation"
      );

      // Create new token pair with incremented version
      const newTokenPair = this.createTokenPair(user, {
        refresh: { version: (decoded.version || 1) + 1 },
      });

      logger.info("Token pair refreshed", {
        userId: user.id || user._id,
        oldVersion: decoded.version,
        newVersion: (decoded.version || 1) + 1,
      });

      return newTokenPair;
    } catch (error) {
      logger.error("Failed to refresh token pair", {
        error: error.message,
        userId: user.id || user._id,
      });
      throw new Error("Failed to refresh token pair");
    }
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Extracted token
   */
  static extractTokenFromHeader(authHeader) {
    try {
      if (!authHeader || typeof authHeader !== "string") {
        return null;
      }

      const parts = authHeader.split(" ");
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        return parts[1];
      }

      return null;
    } catch (error) {
      logger.warn("Failed to extract token from header", {
        error: error.message,
        header: authHeader ? authHeader.substring(0, 20) + "..." : "null",
      });
      return null;
    }
  }

  /**
   * Get comprehensive token information
   * @param {string} token - JWT token
   * @returns {Promise<TokenInfo>} Token information
   */
  static async getTokenInfo(token) {
    try {
      if (!token) {
        return {
          valid: false,
          expired: true,
          expiresAt: null,
          payload: null,
          error: "No token provided",
        };
      }

      // Check if blacklisted
      if (await this.isTokenBlacklisted(token)) {
        return {
          valid: false,
          expired: true,
          expiresAt: null,
          payload: null,
          error: "Token has been revoked",
        };
      }

      const decoded = jwt.decode(token);
      if (!decoded) {
        return {
          valid: false,
          expired: true,
          expiresAt: null,
          payload: null,
          error: "Invalid token format",
        };
      }

      const now = Math.floor(Date.now() / 1000);
      const expired = decoded.exp ? decoded.exp < now : true;
      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;

      return {
        valid: !expired,
        expired,
        expiresAt,
        payload: decoded,
        error: expired ? "Token has expired" : undefined,
      };
    } catch (error) {
      logger.warn("Failed to get token info", {
        error: error.message,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });

      return {
        valid: false,
        expired: true,
        expiresAt: null,
        payload: null,
        error: error.message,
      };
    }
  }

  /**
   * Check if token is expired without verification
   * @param {string} token - JWT token
   * @returns {boolean} Is token expired
   */
  static isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      logger.warn("Error checking token expiration", {
        error: error.message,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });
      return true;
    }
  }

  /**
   * Get token expiration date
   * @param {string} token - JWT token
   * @returns {Date|null} Expiration date
   */
  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return null;

      return new Date(decoded.exp * 1000);
    } catch (error) {
      logger.warn("Error getting token expiration", {
        error: error.message,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });
      return null;
    }
  }

  // ========================================
  // Enhanced Token Security & Management
  // ========================================

  /**
   * Hybrid blacklist implementation - uses both memory and database
   * @param {string} token - JWT token to blacklist
   * @param {string|number} [userId] - User ID for audit purposes
   * @param {string} [reason] - Reason for blacklisting
   * @returns {Promise<boolean>} Success status
   */
  static async blacklistToken(token, userId, reason = "Manual blacklist") {
    try {
      if (!token) return false;

      // Add to memory blacklist immediately
      this.memoryBlacklist.add(token);

      // Add to cache
      this.blacklistCache.set(token, true);

      // Try to add to database if available
      if (query) {
        try {
          const decoded = this.decodeToken(token);
          const expiresAt = decoded?.payload?.exp
            ? new Date(decoded.payload.exp * 1000)
            : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24h

          await query(
            `INSERT INTO blacklisted_tokens (token, user_id, reason, expires_at, created_at) 
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (token) DO NOTHING`,
            [token, userId || null, reason, expiresAt]
          );

          logger.info("Token blacklisted in database", {
            userId,
            reason,
            tokenPreview: token.substring(0, 20) + "...",
          });
        } catch (dbError) {
          logger.warn(
            "Failed to blacklist token in database, using memory only",
            {
              error: dbError.message,
              userId,
              tokenPreview: token.substring(0, 20) + "...",
            }
          );
        }
      }

      logger.info("Token blacklisted", {
        userId,
        reason,
        tokenPreview: token.substring(0, 20) + "...",
        memoryBlacklistSize: this.memoryBlacklist.size,
      });

      return true;
    } catch (error) {
      logger.error("Failed to blacklist token", {
        error: error.message,
        userId,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });
      return false;
    }
  }

  /**
   * Hybrid blacklist checking - checks memory first, then database
   * @param {string} token - JWT token
   * @returns {Promise<boolean>} Is token blacklisted
   */
  static async isTokenBlacklisted(token) {
    try {
      if (!token) return false;

      // Check memory blacklist first (fastest)
      if (this.memoryBlacklist.has(token)) {
        return true;
      }

      // Check cache
      if (this.blacklistCache.has(token)) {
        return this.blacklistCache.get(token);
      }

      // Check database if available
      if (query) {
        try {
          const result = await query(
            `SELECT id FROM blacklisted_tokens 
             WHERE token = $1 AND (expires_at > NOW() OR expires_at IS NULL)`,
            [token]
          );

          const isBlacklisted = result.rows.length > 0;

          // Cache the result
          this.blacklistCache.set(token, isBlacklisted);

          // If blacklisted in DB, add to memory for faster future checks
          if (isBlacklisted) {
            this.memoryBlacklist.add(token);
          }

          return isBlacklisted;
        } catch (dbError) {
          logger.warn("Database blacklist check failed, using memory only", {
            error: dbError.message,
            tokenPreview: token.substring(0, 20) + "...",
          });
        }
      }

      // Default to not blacklisted if no persistent storage
      return false;
    } catch (error) {
      logger.warn("Error checking token blacklist", {
        error: error.message,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });
      return false; // Fail open for availability
    }
  }

  /**
   * Clean up expired tokens from blacklist
   * @returns {Promise<number>} Number of tokens cleaned up
   */
  static async cleanupBlacklistedTokens() {
    try {
      let cleaned = 0;

      // Clean up database if available
      if (query) {
        try {
          const result = await query(
            "DELETE FROM blacklisted_tokens WHERE expires_at < NOW()"
          );
          cleaned += result.rowCount || 0;

          logger.info("Database blacklist cleanup completed", {
            deletedCount: result.rowCount,
          });
        } catch (dbError) {
          logger.warn("Database blacklist cleanup failed", {
            error: dbError.message,
          });
        }
      }

      // Clean up memory blacklist (check if tokens are expired)
      const expiredTokens = [];
      for (const token of this.memoryBlacklist) {
        if (this.isTokenExpired(token)) {
          expiredTokens.push(token);
        }
      }

      for (const token of expiredTokens) {
        this.memoryBlacklist.delete(token);
        this.blacklistCache.delete(token);
        cleaned++;
      }

      logger.info("Blacklist cleanup completed", {
        totalCleaned: cleaned,
        memoryBlacklistSize: this.memoryBlacklist.size,
        cacheSize: this.blacklistCache.size,
      });

      return cleaned;
    } catch (error) {
      logger.error("Error during blacklist cleanup", {
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Revoke all tokens for a user
   * @param {string|number} userId - User ID
   * @param {string} [reason] - Reason for revocation
   * @returns {Promise<boolean>} Success status
   */
  static async revokeAllUserTokens(userId, reason = "All tokens revoked") {
    try {
      if (query) {
        // Update user's token version to invalidate all existing tokens
        await query(
          `UPDATE users SET 
           token_version = COALESCE(token_version, 0) + 1,
           updated_at = NOW()
           WHERE id = $1`,
          [userId]
        );

        // Blacklist any existing tokens in database for this user
        await query(
          `INSERT INTO blacklisted_tokens (token, user_id, reason, created_at)
           SELECT DISTINCT token, user_id, $2, NOW()
           FROM blacklisted_tokens 
           WHERE user_id = $1 AND token NOT IN (SELECT token FROM blacklisted_tokens WHERE user_id = $1)`,
          [userId, reason]
        );
      }

      logger.info("All user tokens revoked", {
        userId,
        reason,
      });

      return true;
    } catch (error) {
      logger.error("Error revoking user tokens", {
        error: error.message,
        userId,
      });
      return false;
    }
  }

  /**
   * Generate secure random token for API keys, etc.
   * @param {number} [length=32] - Token length in bytes
   * @returns {string} Random hex token
   */
  static generateRandomToken(length = 32) {
    try {
      return crypto.randomBytes(length).toString("hex");
    } catch (error) {
      logger.error("Failed to generate random token", {
        error: error.message,
        length,
      });
      throw new Error("Failed to generate random token");
    }
  }

  /**
   * Generate secure random string
   * @param {number} [length=16] - String length
   * @returns {string} Random string
   */
  static generateSecureString(length = 16) {
    try {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";

      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      return result;
    } catch (error) {
      logger.error("Failed to generate secure string", {
        error: error.message,
        length,
      });
      throw new Error("Failed to generate secure string");
    }
  }

  /**
   * Generate short numeric code (for 2FA, etc.)
   * @param {number} [length=6] - Code length
   * @returns {string} Numeric code
   */
  static generateNumericCode(length = 6) {
    try {
      const min = Math.pow(10, length - 1);
      const max = Math.pow(10, length) - 1;
      return Math.floor(Math.random() * (max - min + 1) + min).toString();
    } catch (error) {
      logger.error("Failed to generate numeric code", {
        error: error.message,
        length,
      });
      throw new Error("Failed to generate numeric code");
    }
  }

  /**
   * Hash token for secure storage
   * @param {string} token - Token to hash
   * @returns {string} Hashed token
   */
  static hashToken(token) {
    try {
      return crypto.createHash("sha256").update(token).digest("hex");
    } catch (error) {
      logger.error("Failed to hash token", {
        error: error.message,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });
      throw new Error("Failed to hash token");
    }
  }

  /**
   * Verify hashed token
   * @param {string} token - Original token
   * @param {string} hash - Stored hash
   * @returns {boolean} True if token matches hash
   */
  static verifyHashedToken(token, hash) {
    try {
      const tokenHash = this.hashToken(token);
      return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
    } catch (error) {
      logger.error("Failed to verify hashed token", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Decode token without verification (for debugging/inspection)
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.warn("Failed to decode token", {
        error: error.message,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
      });
      return null;
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Parse expiry string to seconds
   * @param {string} expiry - Expiry string (e.g., "15m", "7d")
   * @returns {number} Expiry in seconds
   */
  static parseExpiryToSeconds(expiry) {
    try {
      const unit = expiry.slice(-1);
      const value = parseInt(expiry.slice(0, -1));

      switch (unit) {
        case "s":
          return value;
        case "m":
          return value * 60;
        case "h":
          return value * 60 * 60;
        case "d":
          return value * 24 * 60 * 60;
        default:
          return 900; // 15 minutes default
      }
    } catch (error) {
      logger.warn("Failed to parse expiry string", {
        error: error.message,
        expiry,
      });
      return 900; // 15 minutes default
    }
  }

  /**
   * Get token configuration status
   * @returns {Object} Configuration status
   */
  static getConfigStatus() {
    return {
      secretsConfigured: {
        access:
          !!this.config.secrets.access &&
          this.config.secrets.access !==
            "fallback-access-secret-change-in-production",
        refresh:
          !!this.config.secrets.refresh &&
          this.config.secrets.refresh !==
            "fallback-refresh-secret-change-in-production",
        verification:
          !!this.config.secrets.verification &&
          this.config.secrets.verification !==
            "fallback-verification-secret-change-in-production",
        reset:
          !!this.config.secrets.reset &&
          this.config.secrets.reset !==
            "fallback-reset-secret-change-in-production",
      },
      issuer: this.config.issuer,
      audience: this.config.audience,
      expiryTimes: this.config.expiryTimes,
      blacklistStats: {
        memorySize: this.memoryBlacklist.size,
        cacheSize: this.blacklistCache.size,
        databaseAvailable: !!query,
      },
    };
  }
}

// ========================================
// Convenience Exports for Backward Compatibility
// ========================================

export const generateAccessToken = (user, options) =>
  TokenManager.generateAccessToken(user, options);
export const generateRefreshToken = (user, options) =>
  TokenManager.generateRefreshToken(user, options);
export const generateVerificationToken = (userId, options) =>
  TokenManager.generateVerificationToken(userId, options);
export const generateResetToken = (userId, options) =>
  TokenManager.generateResetToken(userId, options);

export const verifyAccessToken = (token) =>
  TokenManager.verifyAccessToken(token);
export const verifyRefreshToken = (token) =>
  TokenManager.verifyRefreshToken(token);
export const verifyVerificationToken = (token) =>
  TokenManager.verifyVerificationToken(token);
export const verifyResetToken = (token) => TokenManager.verifyResetToken(token);

export const createTokenPair = (user, options) =>
  TokenManager.createTokenPair(user, options);
export const refreshTokenPair = (refreshToken, user) =>
  TokenManager.refreshTokenPair(refreshToken, user);
export const extractTokenFromHeader = (header) =>
  TokenManager.extractTokenFromHeader(header);
export const getTokenInfo = (token) => TokenManager.getTokenInfo(token);
export const isTokenExpired = (token) => TokenManager.isTokenExpired(token);
export const getTokenExpiration = (token) =>
  TokenManager.getTokenExpiration(token);
export const decodeToken = (token) => TokenManager.decodeToken(token);

// Blacklist functions
export const blacklistToken = (token, userId, reason) =>
  TokenManager.blacklistToken(token, userId, reason);
export const isTokenBlacklisted = (token) =>
  TokenManager.isTokenBlacklisted(token);
export const cleanupBlacklistedTokens = () =>
  TokenManager.cleanupBlacklistedTokens();
export const revokeAllUserTokens = (userId, reason) =>
  TokenManager.revokeAllUserTokens(userId, reason);

// Utility functions
export const generateRandomToken = (length) =>
  TokenManager.generateRandomToken(length);
export const generateSecureString = (length) =>
  TokenManager.generateSecureString(length);
export const generateNumericCode = (length) =>
  TokenManager.generateNumericCode(length);
export const hashToken = (token) => TokenManager.hashToken(token);
export const verifyHashedToken = (token, hash) =>
  TokenManager.verifyHashedToken(token, hash);
export const parseExpiryToSeconds = (expiry) =>
  TokenManager.parseExpiryToSeconds(expiry);
export const getConfigStatus = () => TokenManager.getConfigStatus();

// Default export
export default TokenManager;
