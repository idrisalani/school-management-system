// @ts-check
// server/src/services/audit.service.js - Reconciled Enterprise Audit Service

import { query } from "../config/database.js";
import logger from "../utils/logger.js";

/**
 * @typedef {Object} AuditLogEntry
 * @property {string} id - Audit log ID
 * @property {string} userId - User ID
 * @property {string} action - Action performed
 * @property {string|null} resourceType - Type of resource (if supported)
 * @property {string|null} resourceId - ID of resource (stored as string)
 * @property {string|null} resourceUrl - URL of the resource (for web requests)
 * @property {string|null} details - Action details
 * @property {string|null} ipAddress - IP address
 * @property {string|null} userAgent - User agent string
 * @property {Object} metadata - Additional metadata (if supported)
 * @property {Date} createdAt - Creation timestamp
 * @property {string} username - Username
 * @property {string} userFullName - User's full name
 * @property {string} userEmail - User email
 */

/**
 * @typedef {Object} AuditLogsResponse
 * @property {AuditLogEntry[]} logs - Array of audit log entries
 * @property {Object} pagination - Pagination information
 * @property {number} pagination.page - Current page
 * @property {number} pagination.limit - Records per page
 * @property {number} pagination.total - Total records
 * @property {number} pagination.totalPages - Total pages
 * @property {boolean} pagination.hasNextPage - Has next page
 * @property {boolean} pagination.hasPrevPage - Has previous page
 */

/**
 * @typedef {Object} AuditStatistics
 * @property {Object} overview - Overview statistics
 * @property {Array} topActions - Most frequent actions
 * @property {Array} dailyActivity - Daily activity data
 * @property {Array} allActions - All unique actions
 * @property {Array} [allResourceTypes] - All resource types (if advanced schema)
 */

// Schema detection cache
let schemaInfo = null;

/**
 * Safe number conversion - handles both strings and numbers
 * @param {string|number} value - Value to convert to number
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} Converted number
 */
const toNumber = (value, defaultValue = 0) => {
  if (typeof value === "number") return isNaN(value) ? defaultValue : value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

/**
 * Detect audit table schema capabilities
 * @returns {Promise<Object>} Schema information
 */
const detectSchema = async () => {
  if (schemaInfo) return schemaInfo;

  try {
    // Test for advanced columns including resourceUrl
    await query(
      "SELECT resource_type, resource_id, resource_url, metadata FROM audits LIMIT 1"
    );

    // Test for user table structure
    let userFields;
    try {
      await query(
        "SELECT username, first_name, last_name, email FROM users LIMIT 1"
      );
      userFields = "username, first_name, last_name, email";
    } catch {
      userFields = "name as username, '' as first_name, '' as last_name, email";
    }

    schemaInfo = {
      hasAdvancedFields: true,
      hasResourceUrl: true,
      userFields,
      insertFields:
        "user_id, action, resource_type, resource_id, resource_url, details, ip_address, user_agent, metadata, created_at",
      insertPlaceholders: "$1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()",
      selectFields:
        "a.*, a.resource_type, a.resource_id, a.resource_url, a.metadata",
    };

    logger.info("Full advanced audit schema detected with resourceUrl support");
  } catch {
    try {
      // Test for advanced columns without resourceUrl
      await query(
        "SELECT resource_type, resource_id, metadata FROM audits LIMIT 1"
      );

      let userFields;
      try {
        await query(
          "SELECT username, first_name, last_name, email FROM users LIMIT 1"
        );
        userFields = "username, first_name, last_name, email";
      } catch {
        userFields =
          "name as username, '' as first_name, '' as last_name, email";
      }

      schemaInfo = {
        hasAdvancedFields: true,
        hasResourceUrl: false,
        userFields,
        insertFields:
          "user_id, action, resource_type, resource_id, details, ip_address, user_agent, metadata, created_at",
        insertPlaceholders: "$1, $2, $3, $4, $5, $6, $7, $8, NOW()",
        selectFields: "a.*, a.resource_type, a.resource_id, a.metadata",
      };

      logger.info("Advanced audit schema detected without resourceUrl");
    } catch {
      // Fallback to basic schema
      let userFields;
      try {
        await query("SELECT name, email FROM users LIMIT 1");
        userFields =
          "name as username, '' as first_name, '' as last_name, email";
      } catch {
        userFields =
          "'Unknown' as username, '' as first_name, '' as last_name, '' as email";
      }

      schemaInfo = {
        hasAdvancedFields: false,
        hasResourceUrl: false,
        userFields,
        insertFields:
          "user_id, action, details, ip_address, user_agent, created_at",
        insertPlaceholders: "$1, $2, $3, $4, $5, NOW()",
        selectFields: "a.*",
      };

      logger.info("Basic audit schema detected");
    }
  }

  return schemaInfo;
};

/**
 * Create audit log entry - Enhanced with resourceUrl support
 * @param {Object} auditData - Audit data
 * @param {string} auditData.action - Action performed
 * @param {string|number} auditData.userId - User ID
 * @param {string} [auditData.details] - Action details
 * @param {string} [auditData.ipAddress] - IP address
 * @param {string} [auditData.userAgent] - User agent
 * @param {string} [auditData.resourceType] - Resource type (advanced schema only)
 * @param {string} [auditData.resourceId] - Resource ID (advanced schema only)
 * @param {string} [auditData.resourceUrl] - Resource URL (full advanced schema only)
 * @param {Object} [auditData.metadata] - Additional metadata (advanced schema only)
 * @returns {Promise<AuditLogEntry|null>} Created audit entry or null if failed
 */
export const createAuditLog = async (auditData) => {
  try {
    const {
      action,
      userId,
      details = null,
      ipAddress = null,
      userAgent = null,
      resourceType = null,
      resourceId = null,
      resourceUrl = null,
      metadata = {},
    } = auditData;

    // Convert numeric IDs to strings for consistent storage
    const normalizedResourceId = resourceId ? String(resourceId) : null;

    // Validate required fields
    if (!action || !userId) {
      logger.warn("Audit log creation failed - missing required fields", {
        hasAction: !!action,
        hasUserId: !!userId,
      });
      return null;
    }

    const schema = await detectSchema();
    let insertQuery, queryParams;

    if (schema.hasAdvancedFields && schema.hasResourceUrl) {
      // Use full advanced schema with resourceUrl
      insertQuery = `
        INSERT INTO audits (${schema.insertFields})
        VALUES (${schema.insertPlaceholders})
        RETURNING *
      `;
      queryParams = [
        String(userId),
        action,
        resourceType,
        normalizedResourceId,
        resourceUrl,
        details,
        ipAddress,
        userAgent,
        JSON.stringify(metadata),
      ];
    } else if (schema.hasAdvancedFields) {
      // Use advanced schema without resourceUrl
      insertQuery = `
        INSERT INTO audits (user_id, action, resource_type, resource_id, details, ip_address, user_agent, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `;
      queryParams = [
        String(userId),
        action,
        resourceType,
        normalizedResourceId,
        details,
        ipAddress,
        userAgent,
        JSON.stringify(metadata),
      ];
    } else {
      // Use basic schema
      insertQuery = `
        INSERT INTO audits (${schema.insertFields})
        VALUES (${schema.insertPlaceholders})
        RETURNING *
      `;
      queryParams = [String(userId), action, details, ipAddress, userAgent];
    }

    const result = await query(insertQuery, queryParams);
    const auditEntry = result.rows[0];

    logger.debug("Audit log created", {
      id: auditEntry.id,
      action,
      userId: String(userId),
      resourceType: schema.hasAdvancedFields ? resourceType : undefined,
      resourceId: schema.hasAdvancedFields ? normalizedResourceId : undefined,
      resourceUrl: schema.hasResourceUrl ? resourceUrl : undefined,
    });

    return auditEntry;
  } catch (error) {
    logger.error("Failed to create audit log", {
      error: error.message,
      auditData: { ...auditData, metadata: "..." }, // Don't log full metadata
    });
    return null; // Don't throw to avoid breaking main operations
  }
};

/**
 * Get audit logs with filtering and pagination
 * @param {Object} filters - Filter options
 * @param {string} [filters.userId] - Filter by user ID
 * @param {string} [filters.action] - Filter by action
 * @param {string} [filters.resourceType] - Filter by resource type (advanced schema only)
 * @param {string} [filters.resourceId] - Filter by resource ID (advanced schema only)
 * @param {string} [filters.resourceUrl] - Filter by resource URL (full advanced schema only)
 * @param {Date|string} [filters.startDate] - Filter from date
 * @param {Date|string} [filters.endDate] - Filter to date
 * @param {number|string} [filters.page=1] - Page number
 * @param {number|string} [filters.limit=50] - Records per page
 * @param {string} [filters.sortBy="created_at"] - Sort field
 * @param {string} [filters.sortOrder="DESC"] - Sort order
 * @returns {Promise<AuditLogsResponse>} Audit logs with pagination
 */
export const getAuditLogs = async (filters = {}) => {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      resourceUrl,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = filters;

    // Convert page and limit to numbers safely
    const pageNum = toNumber(page, 1);
    const limitNum = toNumber(limit, 50);

    const schema = await detectSchema();
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    // Build WHERE clause
    if (userId) {
      paramCount++;
      whereClause += ` AND a.user_id = $${paramCount}`;
      params.push(String(userId));
    }

    if (action) {
      paramCount++;
      whereClause += ` AND a.action = $${paramCount}`;
      params.push(action);
    }

    // Only add advanced filters if schema supports them
    if (schema.hasAdvancedFields) {
      if (resourceType) {
        paramCount++;
        whereClause += ` AND a.resource_type = $${paramCount}`;
        params.push(resourceType);
      }

      if (resourceId) {
        paramCount++;
        whereClause += ` AND a.resource_id = ${paramCount}`;
        params.push(String(resourceId)); // Ensure consistent string comparison
      }

      // Add resourceUrl filter if schema supports it
      if (schema.hasResourceUrl && resourceUrl) {
        paramCount++;
        whereClause += ` AND a.resource_url = $${paramCount}`;
        params.push(resourceUrl);
      }
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND a.created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND a.created_at <= $${paramCount}`;
      params.push(endDate);
    }

    // Calculate offset
    const offset = (pageNum - 1) * limitNum;

    // Build main query
    const auditQuery = `
      SELECT ${schema.selectFields}, ${schema.userFields}
      FROM audits a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.${sortBy} ${sortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    // Build count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audits a
      ${whereClause}
    `;

    // Execute queries in parallel
    const [auditResult, countResult] = await Promise.all([
      query(auditQuery, [...params, limitNum, offset]),
      query(countQuery, params),
    ]);

    const total = toNumber(countResult.rows[0].total, 0);
    const totalPages = Math.ceil(total / limitNum);

    return {
      logs: auditResult.rows.map((log) => ({
        id: log.id,
        userId: log.user_id,
        username: log.username || "Unknown",
        userFullName:
          `${log.first_name || ""} ${log.last_name || ""}`.trim() ||
          "Unknown User",
        userEmail: log.email || "",
        action: log.action,
        resourceType: schema.hasAdvancedFields ? log.resource_type : null,
        resourceId: schema.hasAdvancedFields ? log.resource_id : null,
        resourceUrl: schema.hasResourceUrl ? log.resource_url : null,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        metadata: schema.hasAdvancedFields ? log.metadata || {} : {},
        createdAt: log.created_at,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  } catch (error) {
    logger.error("Failed to get audit logs", error);
    throw error;
  }
};

/**
 * Get audit log by ID
 * @param {string} auditId - Audit log ID
 * @returns {Promise<AuditLogEntry|null>} Audit log entry or null if not found
 */
export const getAuditLogById = async (auditId) => {
  try {
    const schema = await detectSchema();

    const result = await query(
      `SELECT ${schema.selectFields}, ${schema.userFields}
       FROM audits a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [auditId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const log = result.rows[0];
    return {
      id: log.id,
      userId: log.user_id,
      username: log.username || "Unknown",
      userFullName:
        `${log.first_name || ""} ${log.last_name || ""}`.trim() ||
        "Unknown User",
      userEmail: log.email || "",
      action: log.action,
      resourceType: schema.hasAdvancedFields ? log.resource_type : null,
      resourceId: schema.hasAdvancedFields ? log.resource_id : null,
      resourceUrl: schema.hasResourceUrl ? log.resource_url : null,
      details: log.details,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      metadata: schema.hasAdvancedFields ? log.metadata || {} : {},
      createdAt: log.created_at,
    };
  } catch (error) {
    logger.error("Failed to get audit log by ID", error);
    throw error;
  }
};

/**
 * Get audit statistics
 * @param {Object} filters - Filter options
 * @param {string} [filters.userId] - Filter by user ID
 * @param {Date|string} [filters.startDate] - Statistics from date
 * @param {Date|string} [filters.endDate] - Statistics to date
 * @returns {Promise<AuditStatistics>} Comprehensive audit statistics
 */
export const getAuditStatistics = async (filters = {}) => {
  try {
    const { userId, startDate, endDate } = filters;
    const schema = await detectSchema();

    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    // Apply filters
    if (userId) {
      paramCount++;
      whereClause += ` AND user_id = $${paramCount}`;
      params.push(String(userId));
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
    }

    // Build stats query based on schema capabilities
    let additionalFields = "";
    if (schema.hasAdvancedFields) {
      additionalFields = `
        COUNT(DISTINCT resource_type) FILTER (WHERE resource_type IS NOT NULL) as unique_resource_types,
        array_agg(DISTINCT resource_type) FILTER (WHERE resource_type IS NOT NULL) as resource_types,
      `;
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT action) as unique_actions,
        ${additionalFields}
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
        array_agg(DISTINCT action) as actions
      FROM audits
      ${whereClause}
    `;

    const actionStatsQuery = `
      SELECT action, COUNT(*) as count
      FROM audits
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;

    const dailyStatsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM audits
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Execute all queries in parallel
    const [statsResult, actionStatsResult, dailyStatsResult] =
      await Promise.all([
        query(statsQuery, params),
        query(actionStatsQuery, params),
        query(dailyStatsQuery, params),
      ]);

    const stats = statsResult.rows[0];

    const result = {
      overview: {
        totalLogs: toNumber(stats.total_logs, 0),
        uniqueUsers: toNumber(stats.unique_users, 0),
        uniqueActions: toNumber(stats.unique_actions, 0),
        last24Hours: toNumber(stats.last_24h, 0),
        last7Days: toNumber(stats.last_7_days, 0),
      },
      topActions: actionStatsResult.rows.map((row) => ({
        action: row.action,
        count: toNumber(row.count, 0),
      })),
      dailyActivity: dailyStatsResult.rows.map((row) => ({
        date: row.date,
        count: toNumber(row.count, 0),
      })),
      allActions: (stats.actions || []).filter(Boolean),
    };

    // Add advanced stats if supported
    if (schema.hasAdvancedFields && stats.unique_resource_types) {
      result.overview.uniqueResourceTypes = toNumber(
        stats.unique_resource_types,
        0
      );
      result.allResourceTypes = (stats.resource_types || []).filter(Boolean);
    }

    return result;
  } catch (error) {
    logger.error("Failed to get audit statistics", error);
    throw error;
  }
};

/**
 * Clean up old audit logs
 * @param {number} daysToKeep - Number of days to keep logs (default: 365)
 * @returns {Promise<number>} Number of deleted logs
 */
export const cleanupOldAuditLogs = async (daysToKeep = 365) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await query("DELETE FROM audits WHERE created_at < $1", [
      cutoffDate,
    ]);

    const deletedCount = result.rowCount || 0;

    logger.info(`Cleaned up ${deletedCount} old audit logs`, {
      cutoffDate: cutoffDate.toISOString(),
      daysToKeep,
    });

    return deletedCount;
  } catch (error) {
    logger.error("Failed to cleanup old audit logs", error);
    throw error;
  }
};

/**
 * Get schema information for debugging
 * @returns {Promise<Object>} Schema detection results
 */
export const getSchemaInfo = async () => {
  const schema = await detectSchema();
  return {
    hasAdvancedFields: schema.hasAdvancedFields,
    hasResourceUrl: schema.hasResourceUrl,
    userFields: schema.userFields,
    insertFields: schema.insertFields,
    selectFields: schema.selectFields,
  };
};

// ========================================
// Enhanced Convenience Functions for Auth Integration
// ========================================

/**
 * Log authentication events - Enhanced integration with auth middleware
 * @param {string} action - Authentication action
 * @param {string|number} userId - User ID
 * @param {Object} request - Express request object
 * @param {Object} [metadata] - Additional metadata
 * @returns {Promise<AuditLogEntry|null>} Created audit entry
 */
export const logAuthEvent = async (action, userId, request, metadata = {}) => {
  return createAuditLog({
    action,
    userId,
    details: `Authentication event: ${action}`,
    ipAddress: request.ip,
    userAgent: request.get("User-Agent"),
    resourceUrl: request.originalUrl,
    resourceType: "auth",
    metadata: {
      method: request.method,
      url: request.originalUrl,
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  });
};

/**
 * Log data modification events - Enhanced for CRUD operations
 * @param {string} action - Data action
 * @param {string|number} userId - User ID
 * @param {string} resourceType - Resource type
 * @param {string|number} resourceId - Resource ID
 * @param {Object} request - Express request object
 * @param {Object} [metadata] - Additional metadata
 * @returns {Promise<AuditLogEntry|null>} Created audit entry
 */
export const logDataEvent = async (
  action,
  userId,
  resourceType,
  resourceId,
  request,
  metadata = {}
) => {
  return createAuditLog({
    action,
    userId,
    resourceType,
    resourceId: String(resourceId), // Convert to string for consistency
    details: `${action} on ${resourceType} ${resourceId}`,
    ipAddress: request.ip,
    userAgent: request.get("User-Agent"),
    resourceUrl: request.originalUrl,
    metadata: {
      method: request.method,
      url: request.originalUrl,
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  });
};

/**
 * Log access control events
 * @param {string} action - Access control action
 * @param {string|number} userId - User ID
 * @param {Object} request - Express request object
 * @param {Object} [details] - Additional details
 * @returns {Promise<AuditLogEntry|null>} Created audit entry
 */
export const logAccessEvent = async (action, userId, request, details = {}) => {
  return createAuditLog({
    action,
    userId,
    details: `Access control: ${action}`,
    ipAddress: request.ip,
    userAgent: request.get("User-Agent"),
    resourceUrl: request.originalUrl,
    resourceType: "access_control",
    metadata: {
      method: request.method,
      url: request.originalUrl,
      timestamp: new Date().toISOString(),
      ...details,
    },
  });
};

/**
 * Log system events
 * @param {string} action - System action
 * @param {string|number} userId - User ID
 * @param {string} details - Event details
 * @param {Object} [metadata] - Additional metadata
 * @returns {Promise<AuditLogEntry|null>} Created audit entry
 */
export const logSystemEvent = async (
  action,
  userId,
  details,
  metadata = {}
) => {
  return createAuditLog({
    action,
    userId,
    details,
    resourceType: "system",
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  });
};

/**
 * Comprehensive audit action constants
 */
export const AUDIT_ACTIONS = {
  // Authentication Events
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGIN_BLOCKED: "LOGIN_BLOCKED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED: "ACCOUNT_UNLOCKED",
  TOKEN_REFRESHED: "TOKEN_REFRESHED",
  TOKEN_REVOKED: "TOKEN_REVOKED",

  // User Management
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  USER_ACTIVATED: "USER_ACTIVATED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  PROFILE_UPDATED: "PROFILE_UPDATED",
  PROFILE_VIEWED: "PROFILE_VIEWED",

  // Academic Operations
  CLASS_CREATED: "CLASS_CREATED",
  CLASS_UPDATED: "CLASS_UPDATED",
  CLASS_DELETED: "CLASS_DELETED",
  CLASS_ACCESSED: "CLASS_ACCESSED",
  ASSIGNMENT_CREATED: "ASSIGNMENT_CREATED",
  ASSIGNMENT_UPDATED: "ASSIGNMENT_UPDATED",
  ASSIGNMENT_DELETED: "ASSIGNMENT_DELETED",
  ASSIGNMENT_SUBMITTED: "ASSIGNMENT_SUBMITTED",
  ASSIGNMENT_GRADED: "ASSIGNMENT_GRADED",
  ASSIGNMENT_VIEWED: "ASSIGNMENT_VIEWED",

  // Attendance & Grading
  ATTENDANCE_MARKED: "ATTENDANCE_MARKED",
  ATTENDANCE_UPDATED: "ATTENDANCE_UPDATED",
  GRADE_ASSIGNED: "GRADE_ASSIGNED",
  GRADE_UPDATED: "GRADE_UPDATED",
  GRADE_DELETED: "GRADE_DELETED",
  GRADE_VIEWED: "GRADE_VIEWED",

  // Access Control - Enhanced for auth middleware
  ACCESS_GRANTED: "ACCESS_GRANTED",
  ACCESS_DENIED: "ACCESS_DENIED",
  PERMISSION_GRANTED: "PERMISSION_GRANTED",
  PERMISSION_REVOKED: "PERMISSION_REVOKED",
  ROLE_CHANGED: "ROLE_CHANGED",
  AUTHORIZATION_FAILED: "AUTHORIZATION_FAILED",
  RESOURCE_ACCESS_DENIED: "RESOURCE_ACCESS_DENIED",

  // Data Operations
  RECORD_CREATED: "RECORD_CREATED",
  RECORD_UPDATED: "RECORD_UPDATED",
  RECORD_DELETED: "RECORD_DELETED",
  RECORD_VIEWED: "RECORD_VIEWED",
  DATA_EXPORTED: "DATA_EXPORTED",
  DATA_IMPORTED: "DATA_IMPORTED",

  // System Events
  SYSTEM_CONFIG_CHANGED: "SYSTEM_CONFIG_CHANGED",
  BACKUP_CREATED: "BACKUP_CREATED",
  BACKUP_RESTORED: "BACKUP_RESTORED",
  MAINTENANCE_STARTED: "MAINTENANCE_STARTED",
  MAINTENANCE_COMPLETED: "MAINTENANCE_COMPLETED",
  SCHEMA_MIGRATION: "SCHEMA_MIGRATION",

  // Security Events
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  SECURITY_VIOLATION: "SECURITY_VIOLATION",
  FAILED_ACCESS_ATTEMPT: "FAILED_ACCESS_ATTEMPT",
  BRUTE_FORCE_DETECTED: "BRUTE_FORCE_DETECTED",
  IP_BLOCKED: "IP_BLOCKED",
};

/**
 * Resource type constants for advanced schema
 */
export const RESOURCE_TYPES = {
  USER: "user",
  CLASS: "class",
  ASSIGNMENT: "assignment",
  SUBMISSION: "submission",
  GRADE: "grade",
  ATTENDANCE: "attendance",
  PAYMENT: "payment",
  ANNOUNCEMENT: "announcement",
  REPORT: "report",
  SYSTEM: "system",
  SETTINGS: "settings",
  AUTH: "auth",
  ACCESS_CONTROL: "access_control",
  TOKEN: "token",
  SESSION: "session",
};

// Export all functions and constants
export default {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  getAuditStatistics,
  cleanupOldAuditLogs,
  getSchemaInfo,

  // Enhanced convenience functions
  logAuthEvent,
  logDataEvent,
  logAccessEvent,
  logSystemEvent,

  // Constants
  AUDIT_ACTIONS,
  RESOURCE_TYPES,
};
