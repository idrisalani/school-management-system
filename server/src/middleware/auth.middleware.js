// server/src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { query } from "../config/database.js";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "../utils/constants.js";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";
import { createAuditLog } from "../services/audit.service.js";

// Ensure JWT secret is available
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
if (!JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET must be defined in environment variables");
}

/**
 * Type definition for JWT payload
 * @typedef {Object} JWTPayload
 * @property {string} userId - User ID
 * @property {string} role - User role
 * @property {number} iat - Issued at timestamp
 * @property {number} exp - Expiration timestamp
 */

/**
 * Extract token from authorization header
 * @param {string|undefined} authHeader - Authorization header
 * @returns {string} Extracted token
 * @throws {ApiError} If token is missing or invalid
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "No token provided");
  }
  return authHeader.split(" ")[1];
};

/**
 * Type guard for JWT payload
 * @param {any} payload - Payload to check
 * @returns {payload is JWTPayload} - Type predicate
 */
const isJWTPayload = (payload) => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof payload.userId === "string" &&
    typeof payload.role === "string" &&
    typeof payload.iat === "number" &&
    typeof payload.exp === "number"
  );
};

/**
 * Middleware to authenticate requests using JWT
 * @param {Object} options - Options object
 * @param {boolean} options.requireVerified - Whether to require email verification
 */
export const authenticate = (options = { requireVerified: true }) => {
  return async (req, res, next) => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

      if (!isJWTPayload(decoded)) {
        throw new ApiError(401, "Invalid token format");
      }

      // PostgreSQL query to find user
      const userQuery = `
        SELECT id, name, email, role, phone, address, is_verified, status, 
               created_at, updated_at, last_login
        FROM users 
        WHERE id = $1
      `;

      const userResult = await query(userQuery, [decoded.userId]);

      if (userResult.rows.length === 0) {
        throw new ApiError(401, "User not found");
      }

      const user = userResult.rows[0];

      // Check if user account is active
      if (user.status && user.status === "inactive") {
        throw new ApiError(403, "Account is deactivated");
      }

      // Check email verification if required
      if (options.requireVerified && !user.is_verified) {
        throw new ApiError(403, "Email not verified");
      }

      // Attach user to request object
      req.user = user;

      // Create audit log for sensitive operations (non-GET requests)
      if (req.method !== "GET") {
        await createAuditLog({
          action: "ACCESS",
          userId: user.id,
          details: `Accessed ${req.method} ${req.originalUrl}`,
        });
      }

      next();
    } catch (error) {
      logger.error("Authentication error:", error);

      if (error.name === "TokenExpiredError") {
        next(new ApiError(401, "Token expired"));
      } else if (error.name === "JsonWebTokenError") {
        next(new ApiError(401, "Invalid token"));
      } else if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(500, "Authentication failed"));
      }
    }
  };
};

/**
 * Middleware to authorize based on roles
 * @param {string[]} roles - Allowed roles
 * @param {string[]} [permissions] - Required permissions
 */
export const authorize = (roles = [], permissions = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "User not authenticated");
      }

      // Check role authorization
      if (roles.length && !roles.includes(req.user.role)) {
        await createAuditLog({
          action: "UNAUTHORIZED_ACCESS",
          userId: req.user.id,
          details: `Attempted to access resource requiring roles: ${roles.join(
            ", "
          )}`,
        });
        throw new ApiError(403, "Unauthorized access");
      }

      // Check permissions if specified
      if (permissions.length) {
        const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
        const hasAllPermissions = permissions.every((permission) =>
          userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
          await createAuditLog({
            action: "UNAUTHORIZED_ACCESS",
            userId: req.user.id,
            details: `Attempted to access resource requiring permissions: ${permissions.join(
              ", "
            )}`,
          });
          throw new ApiError(403, "Insufficient permissions");
        }
      }

      next();
    } catch (error) {
      logger.error("Authorization error:", error);
      next(
        error instanceof ApiError
          ? error
          : new ApiError(500, "Authorization failed")
      );
    }
  };
};

/**
 * Middleware to check permissions
 * @param {string[]} requiredPermissions - Required permissions
 */
export const hasPermission = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "User not authenticated");
      }

      const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        await createAuditLog({
          action: "PERMISSION_DENIED",
          userId: req.user.id,
          details: `Missing required permissions: ${requiredPermissions.join(
            ", "
          )}`,
        });
        throw new ApiError(403, "Insufficient permissions");
      }

      next();
    } catch (error) {
      logger.error("Permission check error:", error);
      next(
        error instanceof ApiError
          ? error
          : new ApiError(500, "Permission check failed")
      );
    }
  };
};

/**
 * Middleware to verify admin access
 */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      await createAuditLog({
        action: "ADMIN_ACCESS_DENIED",
        userId: req.user?.id || "unknown",
        details: "Attempted to access admin-only resource",
      });
      throw new ApiError(403, "Admin access required");
    }
    next();
  } catch (error) {
    logger.error("Admin verification error:", error);
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Admin verification failed")
    );
  }
};

/**
 * Middleware to check resource ownership (PostgreSQL version)
 * @param {string} tableName - Table name to check
 * @param {string} [idParam='id'] - Parameter name containing resource ID
 * @param {string} [userIdColumn='user_id'] - Column name that contains the user ID
 */
export const isOwner = (
  tableName,
  idParam = "id",
  userIdColumn = "user_id"
) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];

      // Query to find the resource and check ownership
      const resourceQuery = `SELECT * FROM ${tableName} WHERE id = $1`;
      const resourceResult = await query(resourceQuery, [resourceId]);

      if (resourceResult.rows.length === 0) {
        throw new ApiError(404, "Resource not found");
      }

      const resource = resourceResult.rows[0];

      // Admin can access any resource
      if (req.user.role === ROLES.ADMIN) {
        req.resource = resource;
        return next();
      }

      // Check ownership
      if (resource[userIdColumn] !== req.user.id) {
        await createAuditLog({
          action: "UNAUTHORIZED_ACCESS",
          userId: req.user.id,
          details: `Attempted to access resource ${resourceId} belonging to another user`,
        });
        throw new ApiError(403, "Unauthorized access to resource");
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error("Ownership verification error:", error);
      next(
        error instanceof ApiError
          ? error
          : new ApiError(500, "Ownership verification failed")
      );
    }
  };
};

/**
 * Middleware to verify teacher access to class
 * @param {string} [classIdParam='classId'] - Parameter name containing class ID
 */
export const isTeacherOfClass = (classIdParam = "classId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "User not authenticated");
      }

      const classId = req.params[classIdParam];

      // Admin can access any class
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      // Check if user is teacher of this class
      if (req.user.role === "teacher") {
        const classQuery =
          "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2";
        const classResult = await query(classQuery, [classId, req.user.id]);

        if (classResult.rows.length === 0) {
          await createAuditLog({
            action: "UNAUTHORIZED_CLASS_ACCESS",
            userId: req.user.id,
            details: `Attempted to access class ${classId} without permission`,
          });
          throw new ApiError(403, "Access denied to this class");
        }
      } else {
        throw new ApiError(403, "Teacher access required");
      }

      next();
    } catch (error) {
      logger.error("Teacher class verification error:", error);
      next(
        error instanceof ApiError
          ? error
          : new ApiError(500, "Class access verification failed")
      );
    }
  };
};

/**
 * Middleware to verify student enrollment in class
 * @param {string} [classIdParam='classId'] - Parameter name containing class ID
 */
export const isEnrolledInClass = (classIdParam = "classId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "User not authenticated");
      }

      const classId = req.params[classIdParam];

      // Admin and teachers can access any class
      if (req.user.role === ROLES.ADMIN || req.user.role === "teacher") {
        return next();
      }

      // Check if student is enrolled in this class
      if (req.user.role === "student") {
        const enrollmentQuery = `
          SELECT e.id 
          FROM enrollments e 
          WHERE e.class_id = $1 AND e.student_id = $2
        `;
        const enrollmentResult = await query(enrollmentQuery, [
          classId,
          req.user.id,
        ]);

        if (enrollmentResult.rows.length === 0) {
          await createAuditLog({
            action: "UNAUTHORIZED_CLASS_ACCESS",
            userId: req.user.id,
            details: `Attempted to access class ${classId} without enrollment`,
          });
          throw new ApiError(403, "Not enrolled in this class");
        }
      } else {
        throw new ApiError(403, "Student enrollment required");
      }

      next();
    } catch (error) {
      logger.error("Enrollment verification error:", error);
      next(
        error instanceof ApiError
          ? error
          : new ApiError(500, "Enrollment verification failed")
      );
    }
  };
};

export default {
  authenticate,
  authorize,
  hasPermission,
  isAdmin,
  isOwner,
  isTeacherOfClass,
  isEnrolledInClass,
};
