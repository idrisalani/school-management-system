// server/src/controllers/sync.controller.js
import { query } from "../config/database.js";
import logger from "../utils/logger.js";

/**
 * @typedef {object} SyncEvent
 * @property {string} type - Event type (create, update, delete)
 * @property {string} entityType - Type of entity (grades, attendance, etc.)
 * @property {string} entityId - ID of the entity
 * @property {object} data - Event data
 * @property {string} userId - ID of user who triggered the event
 * @property {number} timestamp - Event timestamp
 */

class SyncController {
  /**
   * Handle entity changes and notify relevant clients
   * @param {SyncEvent} event - Sync event data
   */
  static async handleSync(event) {
    try {
      logger.debug("Processing sync event:", event);

      const channel = `${event.entityType}:${event.entityId}`;

      // Build notification payload
      const notification = {
        type: "sync",
        eventType: event.type,
        entityType: event.entityType,
        entityId: event.entityId,
        data: event.data,
        timestamp: event.timestamp || Date.now(),
      };

      // Send to subscribed clients
      if (global.wsServer) {
        global.wsServer.sendToChannel(channel, notification);

        // Additional notifications based on entity type
        switch (event.entityType) {
          case "grades":
            await SyncController._handleGradeSync(event);
            break;
          case "attendance":
            await SyncController._handleAttendanceSync(event);
            break;
          case "assignments":
            await SyncController._handleAssignmentSync(event);
            break;
          default:
            logger.warn(`Unhandled entity type in sync: ${event.entityType}`);
        }
      }
    } catch (error) {
      logger.error("Error handling sync event:", error);
      throw error;
    }
  }

  /**
   * Handle grade-specific sync logic
   * @private
   * @param {SyncEvent} event - Sync event data
   */
  static async _handleGradeSync(event) {
    try {
      // Notify related users (student, teacher, parent)
      const relatedUsers = await this._getGradeRelatedUsers(event.entityId);

      if (global.wsServer && relatedUsers.length > 0) {
        global.wsServer.sendToUsers(relatedUsers, {
          type: "notification",
          category: "grade",
          action: event.type,
          entityId: event.entityId,
          message: `Grade has been ${event.type}d`,
          data: event.data,
        });
      }
    } catch (error) {
      logger.error("Error handling grade sync:", error);
    }
  }

  /**
   * Handle attendance-specific sync logic
   * @private
   * @param {SyncEvent} event - Sync event data
   */
  static async _handleAttendanceSync(event) {
    try {
      // Notify related users (student, teacher, parent)
      const relatedUsers = await this._getAttendanceRelatedUsers(
        event.entityId
      );

      if (global.wsServer && relatedUsers.length > 0) {
        global.wsServer.sendToUsers(relatedUsers, {
          type: "notification",
          category: "attendance",
          action: event.type,
          entityId: event.entityId,
          message: `Attendance has been ${event.type}d`,
          data: event.data,
        });
      }
    } catch (error) {
      logger.error("Error handling attendance sync:", error);
    }
  }

  /**
   * Handle assignment-specific sync logic
   * @private
   * @param {SyncEvent} event - Sync event data
   */
  static async _handleAssignmentSync(event) {
    try {
      // Notify related users (students in class, teacher)
      const relatedUsers = await this._getAssignmentRelatedUsers(
        event.entityId
      );

      if (global.wsServer && relatedUsers.length > 0) {
        global.wsServer.sendToUsers(relatedUsers, {
          type: "notification",
          category: "assignment",
          action: event.type,
          entityId: event.entityId,
          message: `Assignment has been ${event.type}d`,
          data: event.data,
        });
      }
    } catch (error) {
      logger.error("Error handling assignment sync:", error);
    }
  }

  /**
   * Get users related to a grade
   * @private
   * @param {string} gradeId - Grade ID
   * @returns {Promise<string[]>} Array of user IDs
   */
  static async _getGradeRelatedUsers(gradeId) {
    try {
      const relatedUsersQuery = `
        SELECT DISTINCT u.id
        FROM grades g
        JOIN users u ON (
          -- Student who received the grade
          u.id = g.student_id OR
          -- Teachers of the class
          u.id IN (
            SELECT teacher_id 
            FROM classes 
            WHERE id = g.class_id
          )
          -- TODO: Add parent relationships when implemented
          -- OR u.id IN (SELECT parent_id FROM parent_student WHERE student_id = g.student_id)
        )
        WHERE g.id = $1
      `;

      const result = await query(relatedUsersQuery, [gradeId]);
      return result.rows.map((row) => row.id);
    } catch (error) {
      logger.error("Error getting grade related users:", error);
      return [];
    }
  }

  /**
   * Get users related to an attendance record
   * @private
   * @param {string} attendanceId - Attendance ID
   * @returns {Promise<string[]>} Array of user IDs
   */
  static async _getAttendanceRelatedUsers(attendanceId) {
    try {
      const relatedUsersQuery = `
        SELECT DISTINCT u.id
        FROM attendance a
        JOIN users u ON (
          -- Student whose attendance was recorded
          u.id = a.student_id OR
          -- Teachers of the class
          u.id IN (
            SELECT teacher_id 
            FROM classes 
            WHERE id = a.class_id
          )
          -- TODO: Add parent relationships when implemented
          -- OR u.id IN (SELECT parent_id FROM parent_student WHERE student_id = a.student_id)
        )
        WHERE a.id = $1
      `;

      const result = await query(relatedUsersQuery, [attendanceId]);
      return result.rows.map((row) => row.id);
    } catch (error) {
      logger.error("Error getting attendance related users:", error);
      return [];
    }
  }

  /**
   * Get users related to an assignment
   * @private
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<string[]>} Array of user IDs
   */
  static async _getAssignmentRelatedUsers(assignmentId) {
    try {
      const relatedUsersQuery = `
        SELECT DISTINCT u.id
        FROM assignments a
        JOIN users u ON (
          -- Teacher who created the assignment
          u.id = a.teacher_id OR
          -- Students enrolled in the class
          u.id IN (
            SELECT e.student_id 
            FROM enrollments e 
            WHERE e.class_id = a.class_id
          )
          -- TODO: Add parent relationships when implemented
          -- OR u.id IN (
          --   SELECT ps.parent_id 
          --   FROM parent_student ps 
          --   JOIN enrollments e ON ps.student_id = e.student_id 
          --   WHERE e.class_id = a.class_id
          -- )
        )
        WHERE a.id = $1
      `;

      const result = await query(relatedUsersQuery, [assignmentId]);
      return result.rows.map((row) => row.id);
    } catch (error) {
      logger.error("Error getting assignment related users:", error);
      return [];
    }
  }
}

export const handleSync = SyncController.handleSync.bind(SyncController);
export default SyncController;
