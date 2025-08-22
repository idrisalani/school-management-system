// @ts-check
// server/src/middleware/auth.middleware.js - Enhanced Auth Middleware (Fixed)
import { verifyAccessToken, extractTokenFromHeader } from "../utils/tokens.js";
import { query } from "../config/database.js";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "../utils/constants.js";
import logger from "../utils/logger.js";
import {
  createAuditLog,
  logAuthEvent,
  logAccessEvent,
  AUDIT_ACTIONS,
} from "../services/audit.service.js";

// Custom Error Classes (Fixed constructors)
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

// Token blacklist check function (if not available in tokens.js)
const isTokenBlacklisted = async (token) => {
  try {
    const result = await query(
      "SELECT id FROM blacklisted_tokens WHERE token = $1",
      [token]
    );
    return result.rows.length > 0;
  } catch (error) {
    logger.error("Error checking token blacklist:", error);
    return false; // Fail open for availability
  }
};

/**
 * @typedef {Object} AuthOptions
 * @property {boolean} [requireVerified=true] - Whether to require email verification
 * @property {boolean} [checkBlacklist=true] - Whether to check token blacklist
 * @property {string[]} [allowedRoles] - Specific roles allowed for this endpoint
 * @property {string[]} [requiredPermissions] - Specific permissions required
 * @property {boolean} [allowInactive=false] - Whether to allow inactive users
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} name - Full name
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} email - Email address
 * @property {string} role - User role
 * @property {boolean} isVerified - Email verification status
 * @property {string} status - Account status
 * @property {Date} lastLogin - Last login timestamp
 * @property {Date} createdAt - Account creation timestamp
 * @property {string[]} [permissions] - User permissions
 * @property {Object} [metadata] - Additional user metadata
 */

/**
 * Enhanced authentication middleware with comprehensive security features
 * @param {AuthOptions} options - Authentication options
 * @returns {Function} Express middleware
 */
export const authenticate = (options = {}) => {
  const {
    requireVerified = true,
    checkBlacklist = true,
    allowedRoles = [],
    requiredPermissions = [],
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

      // Check token blacklist
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

      // Enhanced user query with additional fields
      const userResult = await query(
        `SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.role, 
                u.is_verified, u.status, u.last_login, u.created_at, u.phone,
                u.department_id, u.employee_id, u.student_id, u.metadata,
                d.name as department_name
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE u.id = $1`,
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

      // Check account status
      if (!allowInactive && user.status !== "active") {
        logger.warn("Authentication failed - account not active", {
          userId: user.id,
          status: user.status,
          ip: req.ip,
        });

        await logAuthEvent(AUDIT_ACTIONS.LOGIN_BLOCKED, user.id, req, {
          status: user.status,
        });

        throw new AuthenticationError(`Account is ${user.status}`);
      }

      // Check email verification
      if (requireVerified && !user.is_verified) {
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

        await logAccessEvent(AUDIT_ACTIONS.ACCESS_DENIED, user.id, req, {
          userRole: user.role,
          allowedRoles,
          reason: "insufficient role permissions",
        });

        throw new AuthorizationError("Insufficient role permissions");
      }

      // Check permissions if specified
      if (requiredPermissions.length > 0) {
        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        const hasAllPermissions = requiredPermissions.every((permission) =>
          userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
          logger.warn("Authentication failed - insufficient permissions", {
            userId: user.id,
            userRole: user.role,
            userPermissions,
            requiredPermissions,
            url: req.originalUrl,
          });

          await createAuditLog({
            action: AUDIT_ACTIONS.ACCESS_DENIED,
            userId: user.id,
            details: `Access denied - missing permissions: ${requiredPermissions.join(
              ", "
            )}`,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
          });

          throw new AuthorizationError("Insufficient permissions");
        }
      }

      // Enhanced user object with additional fields
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
        departmentId: user.department_id,
        departmentName: user.department_name,
        employeeId: user.employee_id,
        studentId: user.student_id,
        metadata: user.metadata ? JSON.parse(user.metadata) : {},
        permissions: ROLE_PERMISSIONS[user.role] || [],
      };

      // Store token and request metadata
      req.token = token;
      req.authTime = Date.now() - startTime;

      // Update last activity timestamp
      await query("UPDATE users SET last_activity = NOW() WHERE id = $1", [
        user.id,
      ]);

      logger.debug("✅ User authenticated successfully", {
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
 * Role-based authorization middleware
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
        logger.debug("✅ Authorization skipped - no roles specified");
        return next();
      }

      // Check role authorization
      if (!allowedRoles.includes(req.user.role)) {
        await createAuditLog({
          action: AUDIT_ACTIONS.ACCESS_DENIED,
          userId: req.user.id,
          details: `Access denied - role ${
            req.user.role
          } not in allowed roles: ${allowedRoles.join(", ")}`,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });

        logger.warn("🚫 Authorization failed - insufficient role", {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          url: req.originalUrl,
        });

        throw new AuthorizationError(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`
        );
      }

      logger.debug("✅ User authorized", {
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
 * Permission-based authorization middleware
 * @param {string[]} requiredPermissions - Array of required permissions
 * @returns {Function} Express middleware
 */
export const hasPermission = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError("User not authenticated");
      }

      if (requiredPermissions.length === 0) {
        logger.debug("✅ Permission check skipped - no permissions specified");
        return next();
      }

      const userPermissions =
        req.user.permissions || ROLE_PERMISSIONS[req.user.role] || [];
      const missingPermissions = requiredPermissions.filter(
        (permission) => !userPermissions.includes(permission)
      );

      if (missingPermissions.length > 0) {
        await createAuditLog({
          action: AUDIT_ACTIONS.ACCESS_DENIED,
          userId: req.user.id,
          details: `Access denied - missing permissions: ${missingPermissions.join(
            ", "
          )}`,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });

        logger.warn("🚫 Permission check failed", {
          userId: req.user.id,
          userRole: req.user.role,
          userPermissions,
          requiredPermissions,
          missingPermissions,
          url: req.originalUrl,
        });

        throw new AuthorizationError(
          `Missing permissions: ${missingPermissions.join(", ")}`
        );
      }

      logger.debug("✅ Permissions verified", {
        userId: req.user.id,
        role: req.user.role,
        requiredPermissions,
      });

      next();
    } catch (error) {
      logger.error("Permission check failed", {
        error: error.message,
        userId: req.user?.id,
        requiredPermissions,
      });
      next(error);
    }
  };
};

/**
 * Admin access verification middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      // Use non-blocking audit logging
      logAccessEvent(
        AUDIT_ACTIONS.ACCESS_DENIED,
        req.user?.id || "unknown",
        req,
        {
          reason: "admin access required",
          attemptedResource: "admin-only resource",
        }
      ).catch((err) => logger.warn("Audit logging failed", err));

      logger.warn("🚫 Admin access denied", {
        userId: req.user?.id,
        userRole: req.user?.role,
        url: req.originalUrl,
      });

      throw new AuthorizationError("Administrator access required");
    }

    logger.debug("✅ Admin access verified", { userId: req.user.id });
    next();
  } catch (error) {
    logger.error("Admin verification failed", { error: error.message });
    next(error);
  }
};

/**
 * Resource ownership verification middleware
 * @param {string} tableName - Database table name
 * @param {string} [idParam='id'] - URL parameter containing resource ID
 * @param {string} [ownerColumn='user_id'] - Column containing owner ID
 * @param {boolean} [adminOverride=true] - Allow admin access regardless of ownership
 * @returns {Function} Express middleware
 */
export const requireOwnership = (
  tableName,
  idParam = "id",
  ownerColumn = "user_id",
  adminOverride = true
) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError("User not authenticated");
      }

      const resourceId = req.params[idParam];
      if (!resourceId) {
        throw new AuthorizationError(`Missing parameter: ${idParam}`);
      }

      // Admin override
      if (adminOverride && req.user.role === ROLES.ADMIN) {
        logger.debug("✅ Admin override for resource access", {
          userId: req.user.id,
          resourceId,
          tableName,
        });
        return next();
      }

      // Query resource with owner information
      const resourceResult = await query(
        `SELECT *, ${ownerColumn} as owner_id FROM ${tableName} WHERE id = $1`,
        [resourceId]
      );

      if (resourceResult.rows.length === 0) {
        logger.warn("Resource not found", {
          resourceId,
          tableName,
          userId: req.user.id,
        });
        throw new AuthorizationError("Resource not found");
      }

      const resource = resourceResult.rows[0];

      // Check ownership
      if (resource.owner_id !== req.user.id) {
        await logAccessEvent(AUDIT_ACTIONS.ACCESS_DENIED, req.user.id, req, {
          resourceType: tableName,
          resourceId,
          reason: "unauthorized resource access",
          attemptedOwnerAccess: true,
        });

        logger.warn("🚫 Resource ownership verification failed", {
          userId: req.user.id,
          resourceId,
          tableName,
          resourceOwnerId: resource.owner_id,
        });

        throw new AuthorizationError("Unauthorized access to resource");
      }

      // Attach resource to request for later use
      req.resource = resource;

      logger.debug("✅ Resource ownership verified", {
        userId: req.user.id,
        resourceId,
        tableName,
      });

      next();
    } catch (error) {
      logger.error("Ownership verification failed", {
        error: error.message,
        tableName,
        resourceId: req.params[idParam],
        userId: req.user?.id,
      });
      next(error);
    }
  };
};

/**
 * Class teacher verification middleware
 * @param {string} [classIdParam='classId'] - Parameter containing class ID
 * @returns {Function} Express middleware
 */
export const requireClassTeacher = (classIdParam = "classId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError("User not authenticated");
      }

      const classId = req.params[classIdParam];
      if (!classId) {
        throw new AuthorizationError(`Missing parameter: ${classIdParam}`);
      }

      // Admin can access any class
      if (req.user.role === ROLES.ADMIN) {
        logger.debug("✅ Admin class access granted", {
          userId: req.user.id,
          classId,
        });
        return next();
      }

      // Check teacher assignment to class
      if (req.user.role === "teacher") {
        const classResult = await query(
          `SELECT c.*, d.name as department_name 
           FROM classes c 
           LEFT JOIN departments d ON c.department_id = d.id
           WHERE c.id = $1 AND (c.teacher_id = $2 OR c.department_id = $3)`,
          [classId, req.user.id, req.user.departmentId]
        );

        if (classResult.rows.length === 0) {
          await logAccessEvent(AUDIT_ACTIONS.ACCESS_DENIED, req.user.id, req, {
            classId,
            reason: "not assigned to this class",
            userRole: "teacher",
            departmentId: req.user.departmentId,
          });

          logger.warn("🚫 Teacher class access denied", {
            userId: req.user.id,
            classId,
            reason: "Not assigned to this class",
          });

          throw new AuthorizationError("Not authorized to access this class");
        }

        req.class = classResult.rows[0];

        logger.debug("✅ Teacher class access verified", {
          userId: req.user.id,
          classId,
          className: req.class.name,
        });
      } else {
        throw new AuthorizationError("Teacher or admin access required");
      }

      next();
    } catch (error) {
      logger.error("Class teacher verification failed", {
        error: error.message,
        classId: req.params[classIdParam],
        userId: req.user?.id,
      });
      next(error);
    }
  };
};

/**
 * Student class enrollment verification middleware
 * @param {string} [classIdParam='classId'] - Parameter containing class ID
 * @returns {Function} Express middleware
 */
export const requireClassEnrollment = (classIdParam = "classId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError("User not authenticated");
      }

      const classId = req.params[classIdParam];
      if (!classId) {
        throw new AuthorizationError(`Missing parameter: ${classIdParam}`);
      }

      // Admin and teachers can access any class
      if (req.user.role === ROLES.ADMIN || req.user.role === "teacher") {
        logger.debug("✅ Staff class access granted", {
          userId: req.user.id,
          role: req.user.role,
          classId,
        });
        return next();
      }

      // Check student enrollment
      if (req.user.role === "student") {
        const enrollmentResult = await query(
          `SELECT e.*, c.name as class_name, c.code as class_code
           FROM enrollments e
           JOIN classes c ON e.class_id = c.id
           WHERE e.class_id = $1 AND e.student_id = $2 AND e.status = 'active'`,
          [classId, req.user.id]
        );

        if (enrollmentResult.rows.length === 0) {
          await logAccessEvent(AUDIT_ACTIONS.ACCESS_DENIED, req.user.id, req, {
            classId,
            reason: "not enrolled in this class",
            userRole: "student",
          });

          logger.warn("🚫 Student class access denied", {
            userId: req.user.id,
            classId,
            reason: "Not enrolled in this class",
          });

          throw new AuthorizationError("Not enrolled in this class");
        }

        req.enrollment = enrollmentResult.rows[0];

        logger.debug("✅ Student enrollment verified", {
          userId: req.user.id,
          classId,
          className: req.enrollment.class_name,
        });
      } else if (req.user.role === "parent") {
        // Check if parent has a child enrolled in this class
        const childEnrollmentResult = await query(
          `SELECT e.*, c.name as class_name, u.name as student_name
           FROM enrollments e
           JOIN classes c ON e.class_id = c.id
           JOIN users u ON e.student_id = u.id
           JOIN parent_student_relationships psr ON u.id = psr.student_id
           WHERE e.class_id = $1 AND psr.parent_id = $2 AND e.status = 'active'`,
          [classId, req.user.id]
        );

        if (childEnrollmentResult.rows.length === 0) {
          throw new AuthorizationError("No children enrolled in this class");
        }

        req.childEnrollments = childEnrollmentResult.rows;

        logger.debug("✅ Parent class access verified", {
          userId: req.user.id,
          classId,
          childrenCount: req.childEnrollments.length,
        });
      } else {
        throw new AuthorizationError(
          "Student, parent, teacher, or admin access required"
        );
      }

      next();
    } catch (error) {
      logger.error("Class enrollment verification failed", {
        error: error.message,
        classId: req.params[classIdParam],
        userId: req.user?.id,
      });
      next(error);
    }
  };
};

/**
 * Optional authentication middleware - doesn't fail if no auth provided
 * @param {AuthOptions} options - Authentication options
 * @returns {Function} Express middleware
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

/**
 * Department-based access control middleware
 * @param {string} [departmentIdParam='departmentId'] - Parameter containing department ID
 * @returns {Function} Express middleware
 */
export const requireDepartmentAccess = (departmentIdParam = "departmentId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError("User not authenticated");
      }

      const departmentId = req.params[departmentIdParam];
      if (!departmentId) {
        throw new AuthorizationError(`Missing parameter: ${departmentIdParam}`);
      }

      // Admin can access any department
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      // Check if user belongs to this department
      if (
        req.user.departmentId &&
        req.user.departmentId.toString() === departmentId.toString()
      ) {
        logger.debug("✅ Department access verified", {
          userId: req.user.id,
          departmentId,
          departmentName: req.user.departmentName,
        });
        return next();
      }

      logger.warn("🚫 Department access denied", {
        userId: req.user.id,
        userDepartmentId: req.user.departmentId,
        requestedDepartmentId: departmentId,
      });

      throw new AuthorizationError("Access denied to this department");
    } catch (error) {
      logger.error("Department access verification failed", {
        error: error.message,
        departmentId: req.params[departmentIdParam],
        userId: req.user?.id,
      });
      next(error);
    }
  };
};

// Backward compatibility aliases
export const isAdmin = requireAdmin;
export const isOwner = requireOwnership;
export const isTeacherOfClass = requireClassTeacher;
export const isEnrolledInClass = requireClassEnrollment;

// Enhanced middleware combinations
export const adminOnly = () => [authenticate(), requireAdmin];
export const teacherOrAdmin = () => [
  authenticate(),
  authorize(["teacher", "admin"]),
];
export const studentOrTeacherOrAdmin = () => [
  authenticate(),
  authorize(["student", "teacher", "admin"]),
];

export default {
  authenticate,
  authorize,
  hasPermission,
  requireAdmin,
  requireOwnership,
  requireClassTeacher,
  requireClassEnrollment,
  requireDepartmentAccess,
  optionalAuth,

  // Backward compatibility
  isAdmin,
  isOwner,
  isTeacherOfClass,
  isEnrolledInClass,

  // Convenience combinations
  adminOnly,
  teacherOrAdmin,
  studentOrTeacherOrAdmin,

  // Export error classes for use elsewhere
  AuthenticationError,
  AuthorizationError,
};
