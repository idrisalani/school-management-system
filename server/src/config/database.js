// server/src/config/database.js - Fixed TypeScript Issues
import pkg from "pg";
import dotenv from "dotenv";
import logger, { logUtils } from "../utils/logger.js";

const { Pool } = pkg;
dotenv.config();

// 🚀 Environment detection
const isProduction = process.env.NODE_ENV === "production";
const isServerless =
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY;

// Create database-specific logger
const dbLogger = logger.child({ module: "database" });

// Global connection pool - properly typed
/** @type {pkg.Pool | null} */
let pool = null;

// 🔧 OPTIMAL DATABASE CONFIGURATION
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: isServerless || isProduction ? 1 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: isServerless ? 5000 : 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  query_timeout: 30000,
  statement_timeout: 30000,
};

/**
 * 🔧 CREATE CONNECTION POOL
 * @returns {pkg.Pool|null} PostgreSQL connection pool instance
 */
export const createPool = () => {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      dbLogger.warn(
        "DATABASE_URL not configured - database will be disconnected",
        {
          environment: process.env.NODE_ENV,
          serverless: isServerless,
        }
      );
      return null;
    }

    try {
      // Create new Pool instance with explicit typing
      pool = new Pool(dbConfig);

      // ✅ EVENT HANDLING
      pool.on("error", (err) => {
        dbLogger.error(
          "PostgreSQL pool error",
          logUtils.formatError(err, {
            poolStats: getPoolStats(),
            environment: process.env.NODE_ENV,
          })
        );
      });

      pool.on("connect", (client) => {
        dbLogger.debug("PostgreSQL client connected", {
          totalConnections: pool?.totalCount || 0,
          idleConnections: pool?.idleCount || 0,
          serverless: isServerless,
        });
      });

      pool.on("remove", (client) => {
        dbLogger.debug("PostgreSQL client disconnected", {
          totalConnections: pool?.totalCount || 0,
          idleConnections: pool?.idleCount || 0,
        });
      });

      dbLogger.info("PostgreSQL pool created successfully", {
        environment: process.env.NODE_ENV,
        serverless: isServerless,
        maxConnections: dbConfig.max,
        ssl: !!dbConfig.ssl,
        database: isServerless ? "Supabase" : "PostgreSQL",
      });
    } catch (error) {
      dbLogger.error(
        "Failed to create PostgreSQL pool",
        logUtils.formatError(error)
      );
      return null;
    }
  }

  return pool;
};

/**
 * 📊 GET POOL STATISTICS
 * @returns {Object} Pool statistics
 */
const getPoolStats = () => {
  if (!pool) return { status: "no_pool" };

  return {
    totalCount: pool.totalCount || 0,
    idleCount: pool.idleCount || 0,
    waitingCount: pool.waitingCount || 0,
    connectionCount: (pool.totalCount || 0) - (pool.idleCount || 0),
  };
};

/**
 * 🔗 GET POOL INSTANCE (Helper function)
 * @returns {pkg.Pool|null} Pool instance
 */
const getPoolInstance = () => {
  if (!pool) {
    return createPool();
  }
  return pool;
};

/**
 * 🧪 TEST CONNECTION
 * @returns {Promise<boolean>} Connection test result
 */
export const testConnection = async () => {
  const start = Date.now();

  try {
    if (!process.env.DATABASE_URL) {
      dbLogger.warn("DATABASE_URL not configured");
      return false;
    }

    const poolInstance = getPoolInstance();
    if (!poolInstance) {
      dbLogger.error("Failed to create connection pool");
      return false;
    }

    // Get client from pool instance
    const client = await poolInstance.connect();
    try {
      const result = await client.query(
        "SELECT NOW() as current_time, version() as db_version, current_database() as db_name"
      );

      const duration = Date.now() - start;
      const row = result.rows[0];

      logUtils.logDbConnection(true, {
        duration: `${duration}ms`,
        databaseName: row.db_name,
        serverTime: row.current_time,
        version: row.db_version.substring(0, 50),
        poolStats: getPoolStats(),
        serverless: isServerless,
      });

      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    const duration = Date.now() - start;

    logUtils.logDbConnection(false, {
      duration: `${duration}ms`,
      error: error.message,
      code: error.code,
      serverless: isServerless,
      environment: process.env.NODE_ENV,
    });

    return false;
  }
};

/**
 * 📝 EXECUTE QUERY
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {Object} context - Request context for correlation
 * @returns {Promise<Object>} Query result
 */
export const query = async (text, params = [], context = {}) => {
  const start = Date.now();
  const queryId = Math.random().toString(36).substring(7);

  const queryLogger = dbLogger.child({
    queryId,
    ...context,
  });

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not configured");
    }

    const poolInstance = getPoolInstance();
    if (!poolInstance) {
      throw new Error("Failed to create connection pool");
    }

    const client = await poolInstance.connect();
    try {
      queryLogger.debug("Executing query", {
        queryPreview: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        paramCount: params.length,
        poolStats: getPoolStats(),
      });

      const result = await client.query(text, params);
      const duration = Date.now() - start;

      logUtils.logPerformance({
        operation: "database_query",
        duration,
        rowCount: result.rowCount || 0,
        queryId,
        success: true,
      });

      if (!isProduction) {
        queryLogger.debug("Query completed successfully", {
          duration: `${duration}ms`,
          rowCount: result.rowCount || 0,
          poolStats: getPoolStats(),
        });
      }

      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    const duration = Date.now() - start;

    queryLogger.error("Database query failed", {
      error: logUtils.formatError(error),
      duration: `${duration}ms`,
      queryPreview: text.substring(0, 100) + "...",
      paramCount: params.length,
      poolStats: getPoolStats(),
      queryId,
    });

    logUtils.logPerformance({
      operation: "database_query",
      duration,
      queryId,
      success: false,
      error: error.message,
    });

    throw error;
  }
};

/**
 * 🔄 TRANSACTION SUPPORT
 * @param {Function} callback - Function that receives client
 * @param {Object} context - Request context
 * @returns {Promise<any>} Transaction result
 */
export const withTransaction = async (callback, context = {}) => {
  const start = Date.now();
  const transactionId = Math.random().toString(36).substring(7);

  const transactionLogger = dbLogger.child({
    transactionId,
    ...context,
  });

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured");
  }

  const poolInstance = getPoolInstance();
  if (!poolInstance) {
    throw new Error("Failed to create connection pool");
  }

  const client = await poolInstance.connect();

  try {
    transactionLogger.debug("Transaction started", {
      poolStats: getPoolStats(),
    });

    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");

    const duration = Date.now() - start;
    transactionLogger.info("Transaction completed successfully", {
      duration: `${duration}ms`,
      transactionId,
    });

    logUtils.logPerformance({
      operation: "database_transaction",
      duration,
      transactionId,
      success: true,
    });

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    const duration = Date.now() - start;

    transactionLogger.error("Transaction rolled back", {
      error: logUtils.formatError(error),
      duration: `${duration}ms`,
      transactionId,
    });

    logUtils.logPerformance({
      operation: "database_transaction",
      duration,
      transactionId,
      success: false,
      error: error.message,
    });

    throw error;
  } finally {
    client.release();
  }
};

/**
 * 📦 BATCH QUERY EXECUTION
 * @param {Array} queries - Array of {text, params} objects
 * @param {Object} context - Request context
 * @returns {Promise<Array>} Array of query results
 */
export const batchQuery = async (queries, context = {}) => {
  const batchLogger = dbLogger.child({
    batchSize: queries.length,
    ...context,
  });

  return withTransaction(async (client) => {
    batchLogger.debug("Executing batch queries", {
      queryCount: queries.length,
    });

    const results = [];
    for (let i = 0; i < queries.length; i++) {
      const { text, params } = queries[i];
      const result = await client.query(text, params || []);
      results.push(result);

      batchLogger.debug(`Batch query ${i + 1}/${queries.length} completed`, {
        rowCount: result.rowCount || 0,
      });
    }

    batchLogger.info("Batch queries completed successfully", {
      totalQueries: queries.length,
      totalRows: results.reduce((sum, r) => sum + (r.rowCount || 0), 0),
    });

    return results;
  }, context);
};

/**
 * 📊 GET DATABASE STATUS
 * @returns {Promise<Object>} Comprehensive database status
 */
export const getDatabaseStatus = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        connected: false,
        error: "DATABASE_URL not configured",
        environment: process.env.NODE_ENV || "development",
        serverless: isServerless,
        timestamp: new Date().toISOString(),
      };
    }

    const poolInstance = getPoolInstance();
    if (!poolInstance) {
      return {
        connected: false,
        error: "Failed to create connection pool",
        environment: process.env.NODE_ENV || "development",
        serverless: isServerless,
        timestamp: new Date().toISOString(),
      };
    }

    const client = await poolInstance.connect();
    try {
      const result = await client.query(`
        SELECT 
          current_database() as database_name,
          current_user as username,
          version() as version,
          NOW() as current_time,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
          (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size
      `);

      const row = result.rows[0];

      return {
        connected: true,
        database: row.database_name,
        username: row.username,
        version: row.version.substring(0, 60) + "...",
        currentTime: row.current_time,
        tableCount: parseInt(row.table_count),
        databaseSize: row.database_size,
        poolStats: getPoolStats(),
        environment: process.env.NODE_ENV || "development",
        serverless: isServerless,
        ssl: !!dbConfig.ssl,
        maxConnections: dbConfig.max,
        timestamp: new Date().toISOString(),
      };
    } finally {
      client.release();
    }
  } catch (error) {
    dbLogger.error(
      "Failed to get database status",
      logUtils.formatError(error)
    );

    return {
      connected: false,
      error: error.message,
      code: error.code,
      environment: process.env.NODE_ENV || "development",
      serverless: isServerless,
      poolStats: getPoolStats(),
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * 🏥 HEALTH CHECK
 * @returns {Promise<Object>} Health check result
 */
export const healthCheck = async () => {
  const start = Date.now();

  try {
    const isConnected = await testConnection();
    const responseTime = Date.now() - start;

    const status = {
      status: isConnected ? "healthy" : "unhealthy",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      configured: !!process.env.DATABASE_URL,
      serverless: isServerless,
      database: "PostgreSQL",
      provider: isServerless ? "Supabase" : "Local",
    };

    if (pool) {
      status.pool = getPoolStats();
    }

    return status;
  } catch (error) {
    const responseTime = Date.now() - start;

    return {
      status: "unhealthy",
      error: error.message,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      configured: !!process.env.DATABASE_URL,
      serverless: isServerless,
    };
  }
};

/**
 * 🚀 INITIALIZE DATABASE
 * @returns {Promise<boolean>} Initialization result
 */
export const initializeDatabase = async () => {
  try {
    dbLogger.info("Initializing database connection", {
      environment: process.env.NODE_ENV,
      serverless: isServerless,
      provider: isServerless ? "Supabase" : "Local",
    });

    const isConnected = await testConnection();
    if (!isConnected) {
      dbLogger.warn("Database connection failed during initialization");
      return false;
    }

    // Check if tables exist
    const tablesResult = await query(`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const existingTables = tablesResult.rows.map((row) => row.table_name);

    dbLogger.info("Database schema inspection completed", {
      tableCount: existingTables.length,
      tables: existingTables,
      schemaStatus: existingTables.length > 0 ? "populated" : "empty",
    });

    if (existingTables.length === 0) {
      dbLogger.warn("No tables found in database schema", {
        recommendation: "Run the SQL schema script to create tables",
        provider: isServerless ? "Supabase" : "Local",
      });
    }

    return true;
  } catch (error) {
    dbLogger.error(
      "Database initialization failed",
      logUtils.formatError(error)
    );
    return false;
  }
};

/**
 * 🔌 CLOSE DATABASE CONNECTION
 * @returns {Promise<void>}
 */
export const closeDatabase = async () => {
  try {
    if (pool) {
      const stats = getPoolStats();
      await pool.end();
      pool = null;

      dbLogger.info("PostgreSQL pool closed successfully", {
        finalStats: stats,
        environment: process.env.NODE_ENV,
      });
    }
  } catch (error) {
    dbLogger.error(
      "Error closing PostgreSQL pool",
      logUtils.formatError(error)
    );
  }
};

/**
 * 🆕 REQUEST-SPECIFIC QUERY WRAPPER
 * @param {Object} req - Express request object
 * @returns {Object} Database functions with request context
 */
export const withRequestContext = (req) => {
  const requestContext = {
    requestId: req.id || Math.random().toString(36).substring(7),
    method: req.method,
    url: req.url,
    userAgent: req.get("user-agent"),
    userId: req.user?.id,
  };

  return {
    query: (text, params) => query(text, params, requestContext),
    withTransaction: (callback) => withTransaction(callback, requestContext),
    batchQuery: (queries) => batchQuery(queries, requestContext),
  };
};

// 🚀 AUTOMATIC INITIALIZATION on module load
if (process.env.DATABASE_URL) {
  setTimeout(() => {
    initializeDatabase().catch((error) => {
      dbLogger.error(
        "Background database initialization failed",
        logUtils.formatError(error)
      );
    });
  }, 100);
}

// 🔧 GRACEFUL SHUTDOWN HANDLING
process.on("SIGTERM", closeDatabase);
process.on("SIGINT", closeDatabase);

// Export all functions
export default {
  createPool,
  query,
  testConnection,
  getDatabaseStatus,
  healthCheck,
  closeDatabase,
  withTransaction,
  batchQuery,
  initializeDatabase,
  withRequestContext,
  getPoolStats: () => getPoolStats(),
  getPool: createPool, // Legacy compatibility
};
