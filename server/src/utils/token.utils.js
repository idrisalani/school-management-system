// src/utils/token.utils.js
import jwt from "jsonwebtoken";
import { ApiError } from "./errors.js";

/**
 * Extract token from authorization header
 * @param {string|undefined} authHeader - Authorization header
 * @returns {string} Extracted token
 * @throws {ApiError} If token is missing or invalid
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    throw new ApiError(401, "No authorization header provided");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Invalid authorization format. Use Bearer scheme");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new ApiError(401, "No token provided");
  }

  return token;
};

/**
 * Verify JWT token with proper error handling
 * @param {string} token - Token to verify
 * @param {string} secret - Secret to use for verification
 * @param {Object} options - JWT verify options
 * @returns {Promise<Object>} Decoded token
 */
export const verifyJWT = (token, secret, options = {}) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, options, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          reject(new ApiError(401, "Token has expired"));
        } else if (err.name === "JsonWebTokenError") {
          reject(new ApiError(401, "Invalid token"));
        } else {
          reject(new ApiError(401, "Token verification failed"));
        }
      } else {
        resolve(decoded);
      }
    });
  });
};

/**
 * Sign JWT token with error handling
 * @param {Object} payload - Token payload
 * @param {string} secret - Secret to use for signing
 * @param {Object} options - JWT sign options
 * @returns {string} Signed token
 */
export const signJWT = (payload, secret, options = {}) => {
  try {
    return jwt.sign(payload, secret, options);
  } catch (error) {
    throw new ApiError(500, "Error generating token");
  }
};
