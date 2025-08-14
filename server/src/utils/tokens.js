// @ts-check
import jwt from "jsonwebtoken";
import { ApiError } from "./errors.js";
import dotenv from "dotenv";
import logger from "./logger.js"; // Import your logger if available

// Load environment variables
dotenv.config();

// Debug: Log the presence of environment variables
logger.info("JWT Secrets Check:", {
  hasVerificationSecret: !!process.env.JWT_VERIFICATION_SECRET,
  hasResetSecret: !!process.env.JWT_RESET_SECRET,
});

// Validate required environment variables with better error messages
const JWT_VERIFICATION_SECRET = process.env.JWT_VERIFICATION_SECRET;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET;

if (!JWT_VERIFICATION_SECRET || !JWT_RESET_SECRET) {
  const missingSecrets = [];
  if (!JWT_VERIFICATION_SECRET) missingSecrets.push("JWT_VERIFICATION_SECRET");
  if (!JWT_RESET_SECRET) missingSecrets.push("JWT_RESET_SECRET");

  throw new Error(`Missing required JWT secrets: ${missingSecrets.join(", ")}`);
}

/**
 * Generate a verification token
 * @param {string} userId - User ID
 * @returns {string} Verification token
 * @throws {ApiError} If userId is missing
 */
export const generateVerificationToken = (userId) => {
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  try {
    return jwt.sign({ userId }, JWT_VERIFICATION_SECRET, {
      expiresIn: process.env.JWT_VERIFICATION_EXPIRES_IN || "24h",
    });
  } catch (error) {
    logger.error("Error generating verification token:", error);
    throw new ApiError(500, "Failed to generate verification token");
  }
};

/**
 * Generate a password reset token
 * @param {string} userId - User ID
 * @returns {string} Reset token
 * @throws {ApiError} If userId is missing
 */
export const generateResetToken = (userId) => {
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  try {
    return jwt.sign({ userId }, JWT_RESET_SECRET, {
      expiresIn: process.env.JWT_RESET_EXPIRES_IN || "1h",
    });
  } catch (error) {
    logger.error("Error generating reset token:", error);
    throw new ApiError(500, "Failed to generate reset token");
  }
};

// Add verification functions
export const verifyVerificationToken = (token) => {
  try {
    return jwt.verify(token, JWT_VERIFICATION_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired verification token");
  }
};

export const verifyResetToken = (token) => {
  try {
    return jwt.verify(token, JWT_RESET_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired reset token");
  }
};
