// server/working-server.js - Simplified Working Version
// @ts-nocheck
import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";

const { Pool } = pkg;
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log("🚀 Starting School Management System Server...");
console.log(`📝 PORT: ${PORT}`);
console.log(`📝 NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(`📝 DATABASE_URL configured: ${!!process.env.DATABASE_URL}`);

// PostgreSQL Connection (simplified)
let pool = null;

const createPool = () => {
  if (!pool && process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      pool.on("error", (err) => {
        console.error("❌ PostgreSQL pool error:", err.message);
      });

      console.log("✅ PostgreSQL pool created");
    } catch (error) {
      console.error("❌ Failed to create PostgreSQL pool:", error.message);
      pool = null;
    }
  }
  return pool;
};

const testConnection = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.log("⚠️  No DATABASE_URL configured");
      return false;
    }

    const poolInstance = createPool();
    if (!poolInstance) {
      console.log("❌ No database pool available");
      return false;
    }

    const client = await poolInstance.connect();
    await client.query("SELECT NOW()");
    client.release();
    console.log("✅ Database connection test successful");
    return true;
  } catch (err) {
    console.error("❌ Database connection test failed:", err.message);
    return false;
  }
};

const query = async (text, params = []) => {
  try {
    const poolInstance = createPool();
    if (!poolInstance) throw new Error("Database not configured");

    const client = await poolInstance.connect();
    const result = await client.query(text, params);
    client.release();
    return result;
  } catch (error) {
    console.error("❌ Query error:", error.message);
    throw error;
  }
};

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://school-management-system-smoky-seven.vercel.app",
      "https://school-management-system-668kkjtnr-schoolms.vercel.app",
      /\.vercel\.app$/,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.get("/", (req, res) => {
  console.log("📝 Root route accessed");
  res.json({
    message: "School Management System API is running!",
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "2.0.0",
  });
});

// Health check
app.get("/api/v1/health", async (req, res) => {
  console.log("📝 Health check accessed");

  try {
    const dbConnected = await testConnection();

    res.json({
      status: "healthy",
      message: "API is healthy!",
      database: {
        configured: !!process.env.DATABASE_URL,
        connected: dbConnected,
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("❌ Health check error:", error.message);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Test endpoint
app.get("/api/v1/test", async (req, res) => {
  console.log("📝 Test endpoint accessed");

  try {
    const dbConnected = await testConnection();

    res.json({
      message: "Backend test successful!",
      backend: "connected",
      database: {
        type: "PostgreSQL",
        configured: !!process.env.DATABASE_URL,
        connected: dbConnected,
      },
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Test endpoint error:", error.message);
    res.status(500).json({
      message: "Backend test failed!",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Database test endpoint
app.get("/api/v1/db-test", async (req, res) => {
  console.log("📝 Database test accessed");

  try {
    const result = await query(
      "SELECT NOW() as current_time, version() as db_version"
    );

    res.json({
      message: "Database connection and query successful!",
      connected: true,
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version.substring(0, 50) + "...",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("❌ Database test error:", error.message);
    res.status(500).json({
      message: "Database connection failed",
      connected: false,
      error: error.message,
      environment: process.env.NODE_ENV || "development",
    });
  }
});

// Auth endpoints
app.post("/api/v1/auth/login", async (req, res) => {
  console.log("📝 Login attempt");

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const result = await query(
      `SELECT id, username, email, first_name, last_name, role, created_at 
       FROM users 
       WHERE email = $1 AND password = $2 AND status = 'active'`,
      [email, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✅ Login successful for user: ${user.email}`);

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at,
        },
        message: "Login successful",
      });
    } else {
      console.log(`❌ Login failed for email: ${email}`);
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({
      success: false,
      error: "Login failed",
      message: error.message,
    });
  }
});

app.post("/api/v1/auth/register", async (req, res) => {
  console.log("📝 Registration attempt");

  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role = "student",
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Username, email, and password are required",
      });
    }

    // Check if user exists
    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    // Create new user
    const result = await query(
      `INSERT INTO users (username, email, password, first_name, last_name, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, email, first_name, last_name, role, created_at`,
      [username, email, password, firstName, lastName, role]
    );

    const user = result.rows[0];
    console.log(`✅ User registered successfully: ${user.email}`);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("❌ Registration error:", error.message);
    res.status(500).json({
      success: false,
      error: "Registration failed",
      message: error.message,
    });
  }
});

// Get users
app.get("/api/v1/users", async (req, res) => {
  console.log("📝 Get users request");

  try {
    const result = await query(
      `SELECT id, username, email, first_name, last_name, role, status, created_at 
       FROM users ORDER BY created_at DESC LIMIT 100`
    );

    res.json({
      success: true,
      users: result.rows.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
      })),
      total: result.rows.length,
    });
  } catch (error) {
    console.error("❌ Get users error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      message: error.message,
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: "Not found",
    message: "API endpoint not found",
    availableRoutes: [
      "GET /",
      "GET /api/v1/health",
      "GET /api/v1/test",
      "GET /api/v1/db-test",
      "POST /api/v1/auth/login",
      "POST /api/v1/auth/register",
      "GET /api/v1/users",
    ],
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("🔄 Initializing server...");

    // Test database connection if configured
    if (process.env.DATABASE_URL) {
      console.log("🔄 Testing database connection...");
      const connected = await testConnection();
      console.log(
        `🗄️  Database: ${connected ? "Connected ✅" : "Connection failed ❌"}`
      );
    } else {
      console.log(
        "⚠️  No database configured - API will work without database features"
      );
    }

    // Start the server
    const server = app.listen(PORT, () => {
      console.log("🎉 SERVER STARTED SUCCESSFULLY!");
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
      console.log(`🔍 Test endpoint: http://localhost:${PORT}/api/v1/test`);
      console.log(`🗄️  Database test: http://localhost:${PORT}/api/v1/db-test`);
      console.log("🚀 Server is ready for requests!");
    });

    // Handle server errors
    server.on("error", (error) => {
      console.error("❌ Server error:", error.message);
      if (error.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${PORT} is already in use. Try a different port.`
        );
      }
      process.exit(1);
    });

    server.on("listening", () => {
      console.log(
        "🎯 Server successfully bound to port and is listening for connections"
      );
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log("\n🔄 Shutting down gracefully...");
      server.close(async () => {
        try {
          if (pool) {
            await pool.end();
            console.log("🔌 Database pool closed");
          }
          console.log("✅ Server shutdown complete");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error.message);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
