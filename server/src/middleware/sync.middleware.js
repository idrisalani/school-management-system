// server/src/middleware/sync.middleware.js
import logger from "../utils/logger.js";
import { handleSync } from "../controllers/sync.controller.js";

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * @typedef {Object} AuthenticatedRequest
 * @property {Object} user
 * @property {string|number} user.id
 */

/**
 * @typedef {Object} SyncEvent
 * @property {string} type - Event type (create, update, delete)
 * @property {string} entityType - Type of entity being synced
 * @property {string|number} entityId - ID of the entity
 * @property {Object} data - Event data
 * @property {string|number} userId - ID of user who triggered the event
 * @property {number} timestamp - Event timestamp
 */

/**
 * Create sync middleware for specific entity type
 * @param {string} entityType - Type of entity (grades, attendance, etc.)
 * @returns {(req: Request & AuthenticatedRequest, res: Response, next: NextFunction) => void}
 */
export const createSyncMiddleware = (entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    // Override json method while preserving the original context
    res.json = function (data) {
      // Call original json method
      originalJson.call(this, data);

      // If response was successful, trigger sync
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Extract entity ID - handle both PostgreSQL and MongoDB formats
          let entityId = data.id || data._id;

          // For arrays of data (like bulk operations), get the first item's ID
          if (Array.isArray(data) && data.length > 0) {
            entityId = data[0].id || data[0]._id;
          }

          // For nested response objects
          if (data.data) {
            entityId = data.data.id || data.data._id;
            if (Array.isArray(data.data) && data.data.length > 0) {
              entityId = data.data[0].id || data.data[0]._id;
            }
          }

          // Only proceed if we have a valid entity ID
          if (entityId) {
            /** @type {SyncEvent} */
            const event = {
              type: determineEventType(req.method),
              entityType,
              entityId: String(entityId), // Convert to string for consistency
              data: sanitizeDataForSync(data),
              userId: req.user?.id ? String(req.user.id) : "system",
              timestamp: Date.now(),
            };

            // Handle sync asynchronously without affecting the response
            handleSync(event).catch((error) => {
              logger.error("Sync error:", error);
            });
          }
        } catch (error) {
          // Log error but don't affect the response
          logger.error("Sync middleware error:", error);
        }
      }

      return this;
    };

    next();
  };
};

/**
 * Determine event type based on HTTP method
 * @param {string} method - HTTP method
 * @returns {string} Event type
 * @private
 */
const determineEventType = (method) => {
  switch (method.toUpperCase()) {
    case "POST":
      return "create";
    case "PUT":
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return "update";
  }
};

/**
 * Sanitize data for sync to remove sensitive information
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 * @private
 */
const sanitizeDataForSync = (data) => {
  if (!data || typeof data !== "object") {
    return data;
  }

  // Clone the data to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(data));

  // Remove sensitive fields
  const sensitiveFields = ["password", "token", "secret", "key"];

  const removeSensitiveFields = (obj) => {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(removeSensitiveFields);
    }

    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        cleaned[key] = removeSensitiveFields(value);
      }
    }
    return cleaned;
  };

  return removeSensitiveFields(sanitized);
};

/**
 * Lock manager for handling resource locks during sync
 */
export class SyncLockManager {
  constructor(timeout = 5000) {
    this.locks = new Map();
    this.timeout = timeout;
  }

  /**
   * Acquire lock for a resource
   * @param {string} resourceId - Resource identifier
   * @returns {Promise<boolean>} True if lock acquired
   */
  async acquireLock(resourceId) {
    if (this.locks.has(resourceId)) {
      return false;
    }

    this.locks.set(resourceId, Date.now());
    setTimeout(() => this.releaseLock(resourceId), this.timeout);
    return true;
  }

  /**
   * Release lock for a resource
   * @param {string} resourceId - Resource identifier
   */
  releaseLock(resourceId) {
    this.locks.delete(resourceId);
  }

  /**
   * Check if resource is locked
   * @param {string} resourceId - Resource identifier
   * @returns {boolean} True if resource is locked
   */
  isLocked(resourceId) {
    return this.locks.has(resourceId);
  }

  /**
   * Get lock statistics
   * @returns {Object} Lock statistics
   */
  getStats() {
    return {
      totalLocks: this.locks.size,
      oldestLock: Math.min(...Array.from(this.locks.values())),
      locks: Array.from(this.locks.keys()),
    };
  }

  /**
   * Clear all locks (use with caution)
   */
  clearAllLocks() {
    this.locks.clear();
    logger.warn("All sync locks have been cleared");
  }
}

// Create a singleton lock manager instance
export const lockManager = new SyncLockManager();

export default {
  createSyncMiddleware,
  lockManager,
  SyncLockManager,
};
