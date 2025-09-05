// @ts-check
// server/src/middleware/auth.middleware.js - Fixed and Simplified
import jwt from "jsonwebtoken";
import { query } from "../config/database.js";
import logger from "../utils/logger.js";

// Custom Error Classes
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = 401;
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = 403;
  }
}

// Helper function to extract token from header
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};

// Helper function to verify JWT token
const verifyAccessToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

    // Ensure decoded is an object and has required fields
    if (typeof decoded !== "object" || decoded === null) {
      throw new Error("Invalid token format");
    }

    return {
      userId: decoded.id || decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role,
      username: decoded.username,
      isVerified: decoded.isVerified,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (error) {
    logger.error("Token verification failed:", error.message);
    throw new AuthenticationError("Invalid or expired token");
  }
};

// Simple token blacklist check (optional - can be disabled if table doesn't exist)
const isTokenBlacklisted = async (token) => {
  try {
    const result = await query("SELECT id FROM blacklisted_tokens WHERE token = $1 LIMIT 1", [
      token,
    ]);
    return result.rows.length > 0;
  } catch (error) {
    // If blacklist table doesn't exist, just log and continue
    logger.warn("Token blacklist check failed (table may not exist):", error.message);
    return false;
  }
};

/**
 * @typedef {Object} AuthOptions
 * @property {boolean} [requireVerified=true] - Whether to require email verification
 * @property {boolean} [checkBlacklist=false] - Whether to check token blacklist
 * @property {string[]} [allowedRoles] - Specific roles allowed for this endpoint
 * @property {boolean} [allowInactive=false] - Whether to allow inactive users
 */

/**
 * Enhanced authentication middleware - SIMPLIFIED VERSION
 * @param {AuthOptions} options - Authentication options
 * @returns {Function} Express middleware
 */
export const authenticate = (options = {}) => {
  const {
    requireVerified = true,
    checkBlacklist = false, // Disabled by default since table may not exist
    allowedRoles = [],
    allowInactive = false,
  } = options;

  return async (req, res, next) => {
    try {
      const startTime = Date.now();
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        logger.warn("Authentication failed - no token provided", {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          url: req.originalUrl,
          method: req.method,
        });
        throw new AuthenticationError("Access token required");
      }

      // Check token blacklist (optional)
      if (checkBlacklist && (await isTokenBlacklisted(token))) {
        logger.warn("Authentication failed - blacklisted token", {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          url: req.originalUrl,
        });
        throw new AuthenticationError("Token has been revoked");
      }

      // Verify JWT token
      const decoded = await verifyAccessToken(token);

      // SIMPLIFIED: Query only essential user fields
      const userResult = await query(
        `SELECT id, username, first_name, last_name, email, role, 
                is_verified, status, last_login, created_at, phone,
                profile_completed
         FROM users 
         WHERE id = $1`,
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        logger.warn("Authentication failed - user not found", {
          userId: decoded.userId,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });
        throw new AuthenticationError("User not found");
      }

      const user = userResult.rows[0];

      logger.debug("User data retrieved:", {
        userId: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        status: user.status,
      });

      // Check account status
      if (!allowInactive && user.status !== "active") {
        logger.warn("Authentication failed - account not active", {
          userId: user.id,
          status: user.status,
          ip: req.ip,
        });

        throw new AuthenticationError(`Account is ${user.status}`);
      }

      // Check email verification (can be disabled for development)
      if (requireVerified && !user.is_verified && process.env.NODE_ENV === "production") {
        logger.warn("Authentication failed - email not verified", {
          userId: user.id,
          email: user.email,
          ip: req.ip,
        });
        throw new AuthenticationError("Email not verified");
      }

      // Check role authorization if specified
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        logger.warn("Authentication failed - insufficient role", {
          userId: user.id,
          userRole: user.role,
          allowedRoles,
          url: req.originalUrl,
        });

        throw new AuthorizationError("Insufficient role permissions");
      }

      // SIMPLIFIED: Create user object with essential fields
      req.user = {
        id: user.id,
        username: user.username,
        name: `${user.first_name} ${user.last_name}`.trim(),
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        status: user.status,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        phone: user.phone,
        profileCompleted: user.profile_completed,
      };

      // Store token and request metadata
      req.token = token;
      req.authTime = Date.now() - startTime;

      // OPTIONAL: Update last activity (can be commented out for performance)
      try {
        await query("UPDATE users SET last_activity = NOW() WHERE id = $1", [user.id]);
      } catch (updateError) {
        logger.warn("Failed to update last activity:", updateError.message);
        // Don't fail authentication for this
      }

      logger.debug("User authenticated successfully", {
        userId: user.id,
        username: user.username,
        role: user.role,
        authTime: req.authTime,
        ip: req.ip,
      });

      next();
    } catch (error) {
      logger.error("Authentication failed", {
        error: error.message,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
      });

      // Enhanced error handling with specific messages
      if (error.name === "TokenExpiredError") {
        next(new AuthenticationError("Token has expired"));
      } else if (error.name === "JsonWebTokenError") {
        next(new AuthenticationError("Invalid token"));
      } else if (error.name === "NotBeforeError") {
        next(new AuthenticationError("Token not active"));
      } else {
        next(error);
      }
    }
  };
};

/**
 * SIMPLIFIED: Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
export const authorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError("User not authenticated");
      }

      if (allowedRoles.length === 0) {
        logger.debug("Authorization skipped - no roles specified");
        return next();
      }

      // Check role authorization
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn("Authorization failed - insufficient role", {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          url: req.originalUrl,
        });

        throw new AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(", ")}`);
      }

      logger.debug("User authorized", {
        userId: req.user.id,
        role: req.user.role,
        allowedRoles,
      });

      next();
    } catch (error) {
      logger.error("Authorization failed", {
        error: error.message,
        userId: req.user?.id,
        userRole: req.user?.role,
        allowedRoles,
      });
      next(error);
    }
  };
};

/**
 * SIMPLIFIED: Admin access verification middleware
 */
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      logger.warn("Admin access denied", {
        userId: req.user?.id,
        userRole: req.user?.role,
        url: req.originalUrl,
      });

      throw new AuthorizationError("Administrator access required");
    }

    logger.debug("Admin access verified", { userId: req.user.id });
    next();
  } catch (error) {
    logger.error("Admin verification failed", { error: error.message });
    next(error);
  }
};

/**
 * SIMPLIFIED: Optional authentication middleware
 */
export const optionalAuth = (options = {}) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        logger.debug("No token provided for optional auth");
        return next();
      }

      // Use regular authentication but catch errors gracefully
      const authMiddleware = authenticate({
        ...options,
        requireVerified: false,
      });

      authMiddleware(req, res, (error) => {
        if (error) {
          logger.debug("Optional auth failed, proceeding without user", {
            error: error.message,
          });
          // Clear any partial user data
          delete req.user;
          delete req.token;
        }
        next(); // Always proceed for optional auth
      });
    } catch (error) {
      logger.debug("Optional auth error, proceeding without user", {
        error: error.message,
      });
      next();
    }
  };
};

// SIMPLIFIED: Convenience middleware combinations
export const adminOnly = () => [authenticate(), requireAdmin];
export const teacherOrAdmin = () => [authenticate(), authorize(["teacher", "admin"])];
export const studentOrTeacherOrAdmin = () => [
  authenticate(),
  authorize(["student", "teacher", "admin"]),
];

// Backward compatibility aliases
export const isAdmin = requireAdmin;

export default {
  authenticate,
  authorize,
  requireAdmin,
  optionalAuth,

  // Backward compatibility
  isAdmin,

  // Convenience combinations
  adminOnly,
  teacherOrAdmin,
  studentOrTeacherOrAdmin,

  // Export error classes for use elsewhere
  AuthenticationError,
  AuthorizationError,
};
