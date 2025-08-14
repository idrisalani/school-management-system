import jwt from "jsonwebtoken";
import { ApiError } from "./errors.js";

/**
 * @typedef {Object} TokenPayload
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} role - User role
 */

/**
 * Generate access token
 * @param {TokenPayload} payload - Token payload
 * @returns {string} Access token
 * @throws {ApiError} If JWT_ACCESS_SECRET is not defined
 */
export const generateAccessToken = (payload) => {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new ApiError(500, "JWT_ACCESS_SECRET is not defined");
  }
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
};

/**
 * Generate refresh token
 * @param {TokenPayload} payload - Token payload
 * @returns {string} Refresh token
 * @throws {ApiError} If JWT_REFRESH_SECRET is not defined
 */
export const generateRefreshToken = (payload) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new ApiError(500, "JWT_REFRESH_SECRET is not defined");
  }
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

/**
 * Generate verification token
 * @param {TokenPayload} payload - Token payload
 * @returns {string} Verification token
 * @throws {ApiError} If JWT_VERIFICATION_SECRET is not defined
 */
export const generateVerificationToken = (payload) => {
  if (!process.env.JWT_VERIFICATION_SECRET) {
    throw new ApiError(500, "JWT_VERIFICATION_SECRET is not defined");
  }
  return jwt.sign(payload, process.env.JWT_VERIFICATION_SECRET, {
    expiresIn: "1d",
  });
};

/**
 * Generate password reset token
 * @param {TokenPayload} payload - Token payload
 * @returns {string} Reset token
 * @throws {ApiError} If JWT_RESET_SECRET is not defined
 */
export const generateResetToken = (payload) => {
  if (!process.env.JWT_RESET_SECRET) {
    throw new ApiError(500, "JWT_RESET_SECRET is not defined");
  }
  return jwt.sign(payload, process.env.JWT_RESET_SECRET, { expiresIn: "1h" });
};

/**
 * Verify JWT token
 * @param {string} token - Token to verify
 * @param {string} secret - Secret to use for verification
 * @returns {Object} Decoded token payload
 * @throws {ApiError} If token validation fails
 */
export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid token");
    }
    throw new ApiError(401, "Token validation failed");
  }
};

/**
 * Verify access token
 * @param {string} token - Access token to verify
 * @returns {Object} Decoded token payload
 * @throws {ApiError} If JWT_ACCESS_SECRET is not defined or token is invalid
 */
export const verifyAccessToken = (token) => {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new ApiError(500, "JWT_ACCESS_SECRET is not defined");
  }
  return verifyToken(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {ApiError} If JWT_REFRESH_SECRET is not defined or token is invalid
 */
export const verifyRefreshToken = (token) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new ApiError(500, "JWT_REFRESH_SECRET is not defined");
  }
  return verifyToken(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Extract token from authorization header
 * @param {string} authHeader - Authorization header
 * @returns {string} Token
 * @throws {ApiError} If authorization header is invalid
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Invalid authorization header");
  }
  return authHeader.split(" ")[1];
};

/**
 * Generate authentication tokens for a user
 * @param {Object} user - User object
 * @param {string} user._id - User ID
 * @param {string} user.email - User email
 * @param {string} user.role - User role
 * @returns {{accessToken: string, refreshToken: string}} Access and refresh tokens
 */
export const generateAuthTokens = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Refresh authentication tokens
 * @param {string} refreshToken - Current refresh token
 * @returns {{accessToken: string, refreshToken: string}} New access and refresh tokens
 * @throws {ApiError} If refresh token is invalid
 */
export const refreshAuthTokens = (refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);
  return generateAuthTokens({
    _id: payload.id,
    email: payload.email,
    role: payload.role,
  });
};

/**
 * Decode token without verification
 * @param {string} token - Token to decode
 * @returns {TokenPayload|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token);

    // Validate the decoded token structure
    if (!decoded || typeof decoded !== "object") {
      return null;
    }

    // Cast decoded to ensure type safety
    /** @type {TokenPayload} */
    const typedPayload = {
      id: decoded.id || decoded.sub || null,
      email: decoded.email || null,
      role: decoded.role || null,
    };

    // Verify all required fields are present
    if (!typedPayload.id || !typedPayload.email || !typedPayload.role) {
      return null;
    }

    return typedPayload;
  } catch {
    return null;
  }
};
