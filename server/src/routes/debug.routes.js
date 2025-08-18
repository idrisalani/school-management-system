// @ts-nocheck
// server/src/routes/debug.routes.js
// Fixed PostgreSQL debug routes

const express = require("express");
const { Pool } = require("pg");
const router = express.Router();

// PostgreSQL Debug endpoint - REMOVE IN PRODUCTION
router.get("/postgresql", async (req, res) => {
  try {
    console.log("🔍 PostgreSQL debug endpoint called");

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.length
          : 0,
        hasJwtSecret: !!process.env.JWT_SECRET,
        vercelEnv: process.env.VERCEL_ENV,
        // Show first part of connection string (safe)
        databaseUrlPreview: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.substring(0, 30) + "..."
          : "Not set",
      },
      database: {
        type: "PostgreSQL",
        connectionStatus: "Not tested yet",
      },
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        platform: process.platform,
      },
    };

    // Test PostgreSQL connection
    if (process.env.DATABASE_URL) {
      try {
        console.log("🐘 Testing PostgreSQL connection...");

        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl:
            process.env.NODE_ENV === "production"
              ? { rejectUnauthorized: false }
              : false,
          max: 1,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });

        const client = await pool.connect();

        try {
          // Test basic connection
          const timeResult = await client.query("SELECT NOW() as current_time");
          debugInfo.database.connectionStatus = "SUCCESS";
          debugInfo.database.currentTime = timeResult.rows[0].current_time;

          // Test database version
          const versionResult = await client.query(
            "SELECT version() as version"
          );
          debugInfo.database.version = versionResult.rows[0].version;

          // Check if users table exists
          const tableCheck = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'users'
            ) as table_exists;
          `);
          debugInfo.database.usersTableExists = tableCheck.rows[0].table_exists;

          // Get users table structure if it exists
          if (tableCheck.rows[0].table_exists) {
            const columnsResult = await client.query(`
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns 
              WHERE table_name = 'users' AND table_schema = 'public'
              ORDER BY ordinal_position;
            `);
            debugInfo.database.usersTableColumns = columnsResult.rows;

            // Get user count
            const countResult = await client.query(
              "SELECT COUNT(*) as user_count FROM users"
            );
            debugInfo.database.userCount = parseInt(
              countResult.rows[0].user_count
            );
          }
        } finally {
          client.release();
        }

        await pool.end();
      } catch (dbError) {
        console.error("💥 Database connection failed:", dbError);
        debugInfo.database.connectionStatus = "FAILED";
        debugInfo.database.error = dbError.message;
        debugInfo.database.errorCode = dbError.code;
        debugInfo.database.errorDetails = {
          name: dbError.name,
          code: dbError.code,
          severity: dbError.severity,
        };
      }
    } else {
      debugInfo.database.connectionStatus = "NO_CONNECTION_STRING";
    }

    console.log("📊 PostgreSQL debug info collected:", debugInfo);

    return res.json({
      success: true,
      message: "PostgreSQL debug information collected",
      data: debugInfo,
    });
  } catch (error) {
    console.error("💥 Debug endpoint error:", error);

    return res.status(500).json({
      success: false,
      message: "Debug endpoint failed",
      error: error.message,
    });
  }
});

// Test user registration data
router.post("/test-registration", async (req, res) => {
  try {
    console.log("🧪 Testing registration data processing");

    const testData = {
      firstName: "Test",
      lastName: "User",
      email: `test.${Date.now()}@example.com`,
      password: "TestPassword123!",
      role: "student",
    };

    console.log("📝 Processing test data:", testData);

    // Create username (same logic as registration)
    const username = `${testData.firstName.toLowerCase()}.${testData.lastName.toLowerCase()}`;
    const fullName = `${testData.firstName} ${testData.lastName}`;

    console.log("🔧 Generated username:", username);
    console.log("🔧 Generated full name:", fullName);

    // Test bcrypt hashing
    const bcrypt = require("bcryptjs");
    const startTime = Date.now();
    const hashedPassword = await bcrypt.hash(testData.password, 10);
    const hashTime = Date.now() - startTime;

    console.log("🔐 Password hashing completed in", hashTime, "ms");

    return res.json({
      success: true,
      message: "Registration data processing test completed",
      data: {
        originalData: testData,
        processedData: {
          username,
          fullName,
          hashedPasswordLength: hashedPassword.length,
          hashingTimeMs: hashTime,
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime(),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("💥 Registration test error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration test failed",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

module.exports = router;
