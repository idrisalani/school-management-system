// server/src/services/syncService.js
import { query } from "../config/database.js";
import logger from "../utils/logger.js";

class SyncService {
  constructor(wss) {
    this.wss = wss;
    this.syncQueues = new Map();
    this.versionMap = new Map();
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize version tracking from database
      await this.setupVersionTracking();
      // Setup periodic cleanup
      setInterval(() => this.cleanup(), 1000 * 60 * 60); // Hourly cleanup
      logger.info("SyncService initialized successfully");
    } catch (error) {
      logger.error("Error initializing SyncService:", error);
    }
  }

  async setupVersionTracking() {
    try {
      // Create sync_versions table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sync_versions (
          entity_type VARCHAR(50) PRIMARY KEY,
          current_version INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await query(createTableQuery);

      // Create sync_changes table if it doesn't exist
      const createChangesTableQuery = `
        CREATE TABLE IF NOT EXISTS sync_changes (
          id SERIAL PRIMARY KEY,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(50) NOT NULL,
          version INTEGER NOT NULL,
          change_data JSONB,
          user_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await query(createChangesTableQuery);

      // Create indexes for better performance
      const createIndexesQuery = `
        CREATE INDEX IF NOT EXISTS idx_sync_changes_entity_version 
        ON sync_changes(entity_type, version);
        
        CREATE INDEX IF NOT EXISTS idx_sync_changes_created_at 
        ON sync_changes(created_at);
      `;
      await query(createIndexesQuery);

      // Load current versions into memory
      const versionsResult = await query(
        "SELECT entity_type, current_version FROM sync_versions"
      );
      for (const row of versionsResult.rows) {
        this.versionMap.set(row.entity_type, row.current_version);
      }

      logger.info("Version tracking setup completed");
    } catch (error) {
      logger.error("Error setting up version tracking:", error);
    }
  }

  /**
   * Track changes for entity
   * @param {string} entityType - Type of entity being changed
   * @param {string} entityId - ID of the entity
   * @param {Object} data - Change data
   * @param {string|number} userId - User who made the change
   * @returns {Promise<number>} - Version number
   */
  async trackChange(entityType, entityId, data, userId) {
    try {
      const version = await this.getNextVersion(entityType);

      // Store change in database
      const insertChangeQuery = `
        INSERT INTO sync_changes (entity_type, entity_id, version, change_data, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `;

      const result = await query(insertChangeQuery, [
        entityType,
        entityId,
        version,
        JSON.stringify(data),
        userId ? String(userId) : null,
      ]);

      const changeLog = {
        id: result.rows[0].id,
        version,
        entityType,
        entityId,
        data,
        timestamp: result.rows[0].created_at,
        userId,
      };

      // Notify connected clients
      this.notifyClients(entityType, changeLog);

      logger.debug(`Change tracked: ${entityType}:${entityId} v${version}`);
      return version;
    } catch (error) {
      logger.error("Error tracking change:", error);
      throw error;
    }
  }

  /**
   * Get next version for entity type
   * @param {string} entityType - Type of entity
   * @returns {Promise<number>} - Next version number
   */
  async getNextVersion(entityType) {
    try {
      // Use database transaction to ensure atomic version increment
      const upsertVersionQuery = `
        INSERT INTO sync_versions (entity_type, current_version, updated_at)
        VALUES ($1, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (entity_type)
        DO UPDATE SET 
          current_version = sync_versions.current_version + 1,
          updated_at = CURRENT_TIMESTAMP
        RETURNING current_version
      `;

      const result = await query(upsertVersionQuery, [entityType]);
      const newVersion = result.rows[0].current_version;

      // Update in-memory map
      this.versionMap.set(entityType, newVersion);

      return newVersion;
    } catch (error) {
      logger.error("Error getting next version:", error);
      throw error;
    }
  }

  // Notify clients about changes
  notifyClients(entityType, changeLog) {
    if (this.wss && this.wss.broadcast) {
      this.wss.broadcast({
        type: "sync",
        entityType,
        change: changeLog,
      });
    }
  }

  /**
   * Get changes since version
   * @param {string} entityType - Type of entity
   * @param {number} lastVersion - Last known version
   * @returns {Promise<{changes: Array, currentVersion: number}>}
   */
  async getChangesSince(entityType, lastVersion) {
    try {
      const changesQuery = `
        SELECT sc.*, u.name as user_name
        FROM sync_changes sc
        LEFT JOIN users u ON sc.user_id = u.id
        WHERE sc.entity_type = $1 AND sc.version > $2
        ORDER BY sc.version ASC
      `;

      const result = await query(changesQuery, [entityType, lastVersion]);

      const changes = result.rows.map((row) => ({
        id: row.id,
        version: row.version,
        entityType: row.entity_type,
        entityId: row.entity_id,
        data: row.change_data,
        timestamp: row.created_at,
        userId: row.user_id,
        userName: row.user_name,
      }));

      const currentVersion = this.versionMap.get(entityType) || 0;

      return {
        changes,
        currentVersion,
      };
    } catch (error) {
      logger.error("Error getting changes:", error);
      throw error;
    }
  }

  // Get sync status for all entity types
  async getSyncStatus() {
    try {
      const statusQuery = `
        SELECT 
          sv.entity_type,
          sv.current_version,
          sv.updated_at as last_updated,
          COUNT(sc.id) as total_changes,
          COUNT(CASE WHEN sc.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as changes_last_24h
        FROM sync_versions sv
        LEFT JOIN sync_changes sc ON sv.entity_type = sc.entity_type
        GROUP BY sv.entity_type, sv.current_version, sv.updated_at
        ORDER BY sv.entity_type
      `;

      const result = await query(statusQuery);

      return result.rows.map((row) => ({
        entityType: row.entity_type,
        currentVersion: row.current_version,
        lastUpdated: row.last_updated,
        totalChanges: parseInt(row.total_changes),
        changesLast24h: parseInt(row.changes_last_24h),
      }));
    } catch (error) {
      logger.error("Error getting sync status:", error);
      throw error;
    }
  }

  // Cleanup old changes
  async cleanup() {
    try {
      const threshold = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // 7 days

      const deleteQuery = `
        DELETE FROM sync_changes 
        WHERE created_at < $1
        RETURNING entity_type
      `;

      const result = await query(deleteQuery, [threshold]);
      const deletedCount = result.rowCount;

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old sync changes`);
      }
    } catch (error) {
      logger.error("Error cleaning up sync changes:", error);
    }
  }

  // Reset sync for entity type (admin function)
  async resetSync(entityType) {
    try {
      // Reset version to 0
      const resetVersionQuery = `
        UPDATE sync_versions 
        SET current_version = 0, updated_at = CURRENT_TIMESTAMP
        WHERE entity_type = $1
      `;
      await query(resetVersionQuery, [entityType]);

      // Clear all changes for this entity type
      const clearChangesQuery =
        "DELETE FROM sync_changes WHERE entity_type = $1";
      await query(clearChangesQuery, [entityType]);

      // Update in-memory map
      this.versionMap.set(entityType, 0);

      logger.info(`Sync reset for entity type: ${entityType}`);
      return true;
    } catch (error) {
      logger.error("Error resetting sync:", error);
      throw error;
    }
  }
}

export default SyncService;
