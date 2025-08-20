// server/src/utils/tokens.js - Fixed with Missing Functions
import jwt from "jsonwebtoken";
import logger from "./logger.js";

// Token utilities for JWT management
export class TokenUtils {
  /**
   * Generate access token
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret
   * @param {string} expiresIn - Token expiry time
   * @returns {string} JWT token
   */
  static generateAccessToken(payload, secret, expiresIn = "7d") {
    try {
      return jwt.sign(payload, secret, { expiresIn });
    } catch (error) {
      logger.error("Error generating access token:", error);
      throw new Error("Failed to generate access token");
    }
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret
   * @param {string} expiresIn - Token expiry time
   * @returns {string} JWT token
   */
  static generateRefreshToken(payload, secret, expiresIn = "30d") {
    try {
      return jwt.sign(payload, secret, { expiresIn });
    } catch (error) {
      logger.error("Error generating refresh token:", error);
      throw new Error("Failed to generate refresh token");
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @param {string} secret - JWT secret
   * @returns {Object} Decoded token payload
   */
  static verifyToken(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      } else {
        logger.error("Token verification error:", error);
        throw new Error("Token verification failed");
      }
    }
  }

  /**
   * Decode token without verification (for inspection)
   * @param {string} token - JWT token to decode
   * @returns {Object} Decoded token
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error("Token decode error:", error);
      throw new Error("Failed to decode token");
    }
  }

  /**
   * Get token expiry time
   * @param {string} token - JWT token
   * @returns {number} Expiry timestamp
   */
  static getTokenExpiry(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded?.exp ? decoded.exp * 1000 : 0; // Convert to milliseconds
    } catch (error) {
      logger.error("Error getting token expiry:", error);
      return 0;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  static isTokenExpired(token) {
    try {
      const expiry = this.getTokenExpiry(token);
      return expiry ? Date.now() > expiry : true;
    } catch (error) {
      logger.error("Error checking token expiry:", error);
      return true;
    }
  }

  /**
   * Generate secure random token for verification/reset purposes
   * @param {number} length - Token length
   * @returns {string} Random token
   */
  static generateSecureToken(length = 32) {
    try {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    } catch (error) {
      logger.error("Error generating secure token:", error);
      throw new Error("Failed to generate secure token");
    }
  }
}

// ✅ MISSING FUNCTIONS - Added these to fix the import errors
/**
 * Generate password reset token
 * @param {string} userId - User ID
 * @returns {string} JWT reset token
 */
export function generateResetToken(userId) {
  try {
    const resetSecret = process.env.JWT_RESET_SECRET;
    if (!resetSecret) {
      throw new Error("JWT_RESET_SECRET not configured");
    }
    return jwt.sign({ userId }, resetSecret, { expiresIn: "1h" });
  } catch (error) {
    logger.error("Error generating reset token:", error);
    throw new Error("Failed to generate reset token");
  }
}

/**
 * Generate email verification token
 * @param {string} userId - User ID
 * @returns {string} JWT verification token
 */
export function generateVerificationToken(userId) {
  try {
    const verificationSecret = process.env.JWT_VERIFICATION_SECRET;
    if (!verificationSecret) {
      throw new Error("JWT_VERIFICATION_SECRET not configured");
    }
    return jwt.sign({ userId }, verificationSecret, { expiresIn: "24h" });
  } catch (error) {
    logger.error("Error generating verification token:", error);
    throw new Error("Failed to generate verification token");
  }
}

/**
 * Verify password reset token
 * @param {string} token - Reset token
 * @returns {Object} Decoded token payload
 */
export function verifyResetToken(token) {
  try {
    const resetSecret = process.env.JWT_RESET_SECRET;
    if (!resetSecret) {
      throw new Error("JWT_RESET_SECRET not configured");
    }
    return jwt.verify(token, resetSecret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Reset token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid reset token");
    } else {
      logger.error("Reset token verification error:", error);
      throw new Error("Reset token verification failed");
    }
  }
}

/**
 * Verify email verification token
 * @param {string} token - Verification token
 * @returns {Object} Decoded token payload
 */
export function verifyVerificationToken(token) {
  try {
    const verificationSecret = process.env.JWT_VERIFICATION_SECRET;
    if (!verificationSecret) {
      throw new Error("JWT_VERIFICATION_SECRET not configured");
    }
    return jwt.verify(token, verificationSecret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Verification token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid verification token");
    } else {
      logger.error("Verification token error:", error);
      throw new Error("Verification token verification failed");
    }
  }
}

// Export individual functions for convenience
export const generateAccessToken = TokenUtils.generateAccessToken;
export const generateRefreshToken = TokenUtils.generateRefreshToken;
export const verifyToken = TokenUtils.verifyToken;
export const decodeToken = TokenUtils.decodeToken;
export const getTokenExpiry = TokenUtils.getTokenExpiry;
export const isTokenExpired = TokenUtils.isTokenExpired;
export const generateSecureToken = TokenUtils.generateSecureToken;

// Default export
export default TokenUtils;
