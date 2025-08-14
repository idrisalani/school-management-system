// server/src/config/database.js - Enhanced PostgreSQL Configuration
import pkg from "pg";
import dotenv from "dotenv";

const { Pool } = pkg;
dotenv.config();

// Global connection pool
let pool = null;

// Create connection pool with enhanced configuration
export const createPool = () => {
  if (!pool) {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.warn(
        "⚠️  DATABASE_URL not configured - database will be disconnected"
      );
      return null;
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
      max: process.env.NODE_ENV === "production" ? 1 : 5, // Serverless limit
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      // Additional connection settings for reliability
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Handle pool errors
    pool.on("error", (err) => {
      console.error("❌ PostgreSQL pool error:", err.message);
    });

    // Handle pool connect events
    pool.on("connect", () => {
      console.log("🔗 PostgreSQL client connected");
    });

    // Handle pool remove events
    pool.on("remove", () => {
      console.log("🔌 PostgreSQL client disconnected");
    });

    console.log(
      `✅ PostgreSQL pool created for ${
        process.env.NODE_ENV || "development"
      } environment`
    );
  }

  return pool;
};

// Test database connection with enhanced feedback
export const testConnection = async () => {
  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.log("⚠️  DATABASE_URL not configured");
      return false;
    }

    const poolInstance = createPool();
    if (!poolInstance) {
      console.log("❌ Failed to create connection pool");
      return false;
    }

    const client = await poolInstance.connect();
    try {
      const result = await client.query(
        "SELECT NOW() as current_time, version() as db_version"
      );
      console.log("✅ PostgreSQL connection test successful");
      console.log(`📅 Database time: ${result.rows[0].current_time}`);
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ PostgreSQL connection test failed:", err.message);
    return false;
  }
};

// Execute query with automatic connection management and enhanced logging
export const query = async (text, params = []) => {
  const start = Date.now();

  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not configured");
    }

    const poolInstance = createPool();
    if (!poolInstance) {
      throw new Error("Failed to create connection pool");
    }

    const client = await poolInstance.connect();
    try {
      const result = await client.query(text, params);
      const duration = Date.now() - start;

      // Enhanced logging for development
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `📊 Query executed in ${duration}ms - Rows: ${result.rowCount || 0}`
        );
      }

      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Database query error:", {
      error: error.message,
      query: text.substring(0, 100) + "...", // Show more of the query
      params:
        params.length > 0 ? `${params.length} parameters` : "no parameters",
      duration: Date.now() - start + "ms",
    });
    throw error;
  }
};

// Get comprehensive database status
export const getDatabaseStatus = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        connected: false,
        error: "DATABASE_URL not configured",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      };
    }

    const poolInstance = createPool();
    if (!poolInstance) {
      return {
        connected: false,
        error: "Failed to create connection pool",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      };
    }

    const client = await poolInstance.connect();
    try {
      // Get comprehensive database information
      const result = await client.query(`
        SELECT 
          current_database() as database_name,
          current_user as username,
          version() as version,
          NOW() as current_time,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
      `);

      const row = result.rows[0];

      // Get pool statistics
      const poolStats = {
        totalCount: poolInstance.totalCount,
        idleCount: poolInstance.idleCount,
        waitingCount: poolInstance.waitingCount,
      };

      return {
        connected: true,
        database: row.database_name,
        username: row.username,
        version: row.version.substring(0, 50) + "...",
        currentTime: row.current_time,
        tableCount: parseInt(row.table_count),
        poolStats,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      };
    } finally {
      client.release();
    }
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    };
  }
};

// Enhanced health check with more details
export const healthCheck = async () => {
  try {
    const isConnected = await testConnection();
    const status = {
      status: isConnected ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      configured: !!process.env.DATABASE_URL,
    };

    // Add pool information if available
    if (pool) {
      status.pool = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      };
    }

    return status;
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      configured: !!process.env.DATABASE_URL,
    };
  }
};

// Transaction support - NEW FEATURE
export const withTransaction = async (callback) => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured");
  }

  const poolInstance = createPool();
  if (!poolInstance) {
    throw new Error("Failed to create connection pool");
  }

  const client = await poolInstance.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Batch query execution - NEW FEATURE
export const batchQuery = async (queries) => {
  return withTransaction(async (client) => {
    const results = [];
    for (const { text, params } of queries) {
      const result = await client.query(text, params || []);
      results.push(result);
    }
    return results;
  });
};

// Close database connection with enhanced cleanup
export const closeDatabase = async () => {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      console.log("🔌 PostgreSQL pool closed successfully");
    }
  } catch (error) {
    console.error("❌ Error closing PostgreSQL pool:", error);
  }
};

// Initialize database and create tables if they don't exist - NEW FEATURE
export const initializeDatabase = async () => {
  try {
    console.log("🚀 Initializing database...");

    const isConnected = await testConnection();
    if (!isConnected) {
      console.log("⚠️  Database connection failed during initialization");
      return false;
    }

    // Check if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const existingTables = tablesResult.rows.map((row) => row.table_name);
    console.log(
      `📊 Found ${existingTables.length} existing tables:`,
      existingTables
    );

    if (existingTables.length === 0) {
      console.log("⚠️  No tables found. Database schema needs to be created.");
      console.log(
        "💡 Run the SQL schema script in your database to create tables."
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    return false;
  }
};

// Export all functions with backward compatibility
export default {
  createPool,
  testConnection,
  query,
  getDatabaseStatus,
  healthCheck,
  closeDatabase,
  // New features
  withTransaction,
  batchQuery,
  initializeDatabase,
};
