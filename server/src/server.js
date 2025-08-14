// @ts-nocheck
// server/src/server.js - TypeScript Error-Free Vercel Version
import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const app = express();

// PostgreSQL Connection for Serverless
let pool;

const createPool = () => {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("PostgreSQL pool error:", err.message);
    });
  }
  return pool;
};

const testConnection = async () => {
  try {
    if (!process.env.DATABASE_URL) return false;
    const poolInstance = createPool();
    if (!poolInstance) return false;

    const client = await poolInstance.connect();
    await client.query("SELECT NOW()");
    client.release();
    return true;
  } catch (err) {
    console.error("Database connection failed:", err.message);
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
    console.error("Query error:", error.message);
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

// Root endpoint
app.get("/", function (req, res) {
  return res.json({
    message: "School Management System API",
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    version: "2.0.0",
    database: "PostgreSQL",
  });
});

// Health check
app.get("/api/v1/health", function (req, res) {
  testConnection()
    .then(function (dbConnected) {
      return res.json({
        status: "healthy",
        database: {
          configured: !!process.env.DATABASE_URL,
          connected: dbConnected,
        },
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
        uptime: process.uptime(),
      });
    })
    .catch(function (error) {
      return res.status(500).json({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });
});

// Test endpoint
app.get("/api/v1/test", function (req, res) {
  testConnection()
    .then(function (dbConnected) {
      return res.json({
        message: "Backend test successful!",
        backend: "connected",
        database: {
          type: "PostgreSQL",
          configured: !!process.env.DATABASE_URL,
          connected: dbConnected,
        },
        environment: process.env.NODE_ENV || "production",
        timestamp: new Date().toISOString(),
      });
    })
    .catch(function (error) {
      return res.status(500).json({
        message: "Backend test failed!",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });
});

// Database test
app.get("/api/v1/db-test", function (req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      message: "DATABASE_URL not configured",
      connected: false,
    });
  }

  query("SELECT NOW() as current_time, version() as db_version")
    .then(function (result) {
      return res.json({
        message: "Database connection successful!",
        connected: true,
        timestamp: result.rows[0].current_time,
        version: result.rows[0].db_version.substring(0, 50) + "...",
        environment: process.env.NODE_ENV || "production",
      });
    })
    .catch(function (error) {
      return res.status(500).json({
        message: "Database connection failed",
        connected: false,
        error: error.message,
      });
    });
});

// Auth login
app.post("/api/v1/auth/login", function (req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      success: false,
      error: "Database not configured",
    });
  }

  query(
    `SELECT id, username, email, first_name, last_name, role, created_at 
     FROM users 
     WHERE email = $1 AND password = $2 AND status = 'active'`,
    [email, password]
  )
    .then(function (result) {
      if (result.rows.length > 0) {
        const user = result.rows[0];

        return res.json({
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
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
      }
    })
    .catch(function (error) {
      console.error("Login error:", error.message);
      return res.status(500).json({
        success: false,
        error: "Login failed",
        message: error.message,
      });
    });
});

// Auth register
app.post("/api/v1/auth/register", function (req, res) {
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
  query("SELECT id FROM users WHERE email = $1 OR username = $2", [
    email,
    username,
  ])
    .then(function (existingUser) {
      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: "User already exists",
        });
      }

      // Create new user
      return query(
        `INSERT INTO users (username, email, password, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, username, email, first_name, last_name, role, created_at`,
        [username, email, password, firstName, lastName, role]
      );
    })
    .then(function (result) {
      if (!result) return; // Already handled above

      const user = result.rows[0];

      return res.status(201).json({
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
    })
    .catch(function (error) {
      console.error("Registration error:", error.message);
      return res.status(500).json({
        success: false,
        error: "Registration failed",
        message: error.message,
      });
    });
});

// Get users
app.get("/api/v1/users", function (req, res) {
  query(
    `SELECT id, username, email, first_name, last_name, role, status, created_at 
     FROM users ORDER BY created_at DESC LIMIT 100`
  )
    .then(function (result) {
      return res.json({
        success: true,
        users: result.rows.map(function (user) {
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            status: user.status,
            createdAt: user.created_at,
          };
        }),
        total: result.rows.length,
      });
    })
    .catch(function (error) {
      console.error("Get users error:", error.message);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch users",
        message: error.message,
      });
    });
});

// Error handling
app.use(function (err, req, res, next) {
  console.error("Unhandled error:", err.message);
  return res.status(err.status || 500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use("*", function (req, res) {
  return res.status(404).json({
    success: false,
    error: "Not found",
    message: "API endpoint not found",
    path: req.originalUrl,
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

// For Vercel serverless deployment
export default app;

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, function () {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
