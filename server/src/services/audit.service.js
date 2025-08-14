// @ts-check
// server/src/services/audit.service.js
import { query } from "../config/database.js";
import logger from "../utils/logger.js";

/**
 * @typedef {Object} AuditLogEntry
 * @property {string} id - Audit log ID
 * @property {string} action - Action performed
 * @property {string} user_id - User ID
 * @property {string} details - Action details
 * @property {string} ip_address - IP address
 * @property {string} user_agent - User agent
 * @property {Date} created_at - Creation timestamp
 * @property {string} user_name - User name (from join)
 * @property {string} user_email - User email (from join)
 */

/**
 * @typedef {Object} AuditLogsResponse
 * @property {AuditLogEntry[]} audits - Array of audit log entries
 * @property {number} total - Total number of records
 * @property {number} totalPages - Total number of pages
 * @property {number} currentPage - Current page number
 */

/**
 * Create audit log entry
 * @param {Object} params - Audit parameters
 * @param {string} params.action - Action performed
 * @param {string|number} params.userId - User ID (accepts both types, converts to string internally)
 * @param {string} params.details - Action details
 * @param {string} [params.ipAddress] - IP address
 * @param {string} [params.userAgent] - User agent string
 * @returns {Promise<void>}
 */
export const createAuditLog = async ({
  action,
  userId,
  details,
  ipAddress,
  userAgent,
}) => {
  try {
    const insertQuery = `
      INSERT INTO audits (action, user_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `;

    const result = await query(insertQuery, [
      action,
      String(userId), // Convert to string for database storage
      details || null,
      ipAddress || null,
      userAgent || null,
    ]);

    logger.debug(`Audit log created: ${action} by ${String(userId)}`, {
      auditId: result.rows[0].id,
      timestamp: result.rows[0].created_at,
    });
  } catch (error) {
    logger.error("Failed to create audit log:", error);
    // Don't throw error to prevent audit failures from breaking main functionality
  }
};

/**
 * Get audit logs with filtering and pagination
 * @param {Object} options - Query options
 * @param {string} [options.userId] - Filter by user ID
 * @param {string} [options.action] - Filter by action
 * @param {Date} [options.startDate] - Filter from date
 * @param {Date} [options.endDate] - Filter to date
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=50] - Records per page
 * @returns {Promise<AuditLogsResponse>}
 */
export const getAuditLogs = async ({
  userId,
  action,
  startDate,
  endDate,
  page = 1,
  limit = 50,
} = {}) => {
  try {
    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramCount = 0;

    // Build WHERE clause
    if (userId) {
      paramCount++;
      whereClause += ` AND a.user_id = $${paramCount}`;
      queryParams.push(userId);
    }

    if (action) {
      paramCount++;
      whereClause += ` AND a.action = $${paramCount}`;
      queryParams.push(action);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND a.created_at >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND a.created_at <= $${paramCount}`;
      queryParams.push(endDate);
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get audit logs with user information
    const auditQuery = `
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM audits a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    const auditResult = await query(auditQuery, queryParams);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM audits a ${whereClause}`;
    const countResult = await query(
      countQuery,
      queryParams.slice(0, paramCount)
    );
    const total = parseInt(countResult.rows[0].count);

    return {
      audits: auditResult.rows,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    logger.error("Failed to get audit logs:", error);
    throw error;
  }
};

/**
 * Get audit statistics
 * @param {Object} options - Query options
 * @param {Date} [options.startDate] - Statistics from date
 * @param {Date} [options.endDate] - Statistics to date
 * @returns {Promise<Object>} Audit statistics
 */
export const getAuditStatistics = async ({ startDate, endDate } = {}) => {
  try {
    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      whereClause += ` AND created_at >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND created_at <= $${paramCount}`;
      queryParams.push(endDate);
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT action) as unique_actions,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days
      FROM audits
      ${whereClause}
    `;

    const result = await query(statsQuery, queryParams);
    const stats = result.rows[0];

    // Get most common actions
    const actionsQuery = `
      SELECT action, COUNT(*) as count
      FROM audits
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;

    const actionsResult = await query(actionsQuery, queryParams);

    return {
      totalLogs: parseInt(stats.total_logs),
      uniqueUsers: parseInt(stats.unique_users),
      uniqueActions: parseInt(stats.unique_actions),
      last24Hours: parseInt(stats.last_24h),
      last7Days: parseInt(stats.last_7_days),
      topActions: actionsResult.rows,
    };
  } catch (error) {
    logger.error("Failed to get audit statistics:", error);
    throw error;
  }
};

/**
 * Clean up old audit logs
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {Promise<number>} Number of deleted records
 */
export const cleanupAuditLogs = async (daysToKeep = 90) => {
  try {
    const deleteQuery = `
      DELETE FROM audits 
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      RETURNING id
    `;

    const result = await query(deleteQuery);
    const deletedCount = result.rowCount;

    logger.info(
      `Cleaned up ${deletedCount} audit logs older than ${daysToKeep} days`
    );
    return deletedCount;
  } catch (error) {
    logger.error("Failed to cleanup audit logs:", error);
    throw error;
  }
};

// Export all functions as default object
export default {
  createAuditLog,
  getAuditLogs,
  getAuditStatistics,
  cleanupAuditLogs,
};
