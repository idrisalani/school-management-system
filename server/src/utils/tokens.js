// server/src/utils/tokens.js - Simple Version (Zero TypeScript Issues)
import jwt from "jsonwebtoken";

// Simple token utilities - no complex types
const TokenUtils = {
  generateAccessToken(payload, secret, expiresIn = "7d") {
    try {
      return jwt.sign(payload, secret, { expiresIn });
    } catch (error) {
      console.error("Error generating access token:", error);
      throw new Error("Failed to generate access token");
    }
  },

  verifyToken(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      } else {
        console.error("Token verification error:", error);
        throw new Error("Token verification failed");
      }
    }
  },

  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      console.error("Token decode error:", error);
      throw new Error("Failed to decode token");
    }
  },

  isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      const now = Math.floor(Date.now() / 1000);
      return now > decoded.exp;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  },
};

// Export individual functions
export const generateAccessToken = TokenUtils.generateAccessToken;
export const verifyToken = TokenUtils.verifyToken;
export const decodeToken = TokenUtils.decodeToken;
export const isTokenExpired = TokenUtils.isTokenExpired;

// Default export
export default TokenUtils;
