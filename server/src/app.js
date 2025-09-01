// @ts-nocheck
// server/src/app.js - PostgreSQL Version
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import pkg from "pg";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
import path from "path";
import rateLimit, { MemoryStore } from "express-rate-limit";

const { Pool } = pkg;
dotenv.config();

// Initialize express app
const app = express();

// PostgreSQL Connection Pool
let pool = null;

const createPool = () => {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: process.env.NODE_ENV === "production" ? 1 : 5,
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

// Database initialization function (replaces MongoDB version)
const initializeDatabase = async () => {
  try {
    console.log("🚀 Initializing PostgreSQL database...");

    const isConnected = await testConnection();
    if (!isConnected) {
      console.warn("⚠️  Database not connected - continuing without database");
      return false;
    }

    // Check if core tables exist
    const result = await query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'classes', 'assignments', 'attendance', 'grades')
    `);

    const tableCount = parseInt(result.rows[0].table_count);
    console.log(`✅ Database initialized with ${tableCount} core tables`);

    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    return false;
  }
};

// Validate configuration function
const validateConfig = () => {
  const required = [];

  if (!process.env.DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL not configured - database features disabled");
  }

  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(", ")}`);
  }

  console.log("✅ Configuration validated");
};

// Simple logger
const logger = {
  info: (message, meta = {}) => console.log(`ℹ️  ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`⚠️  ${message}`, meta),
  error: (message, meta = {}) => console.error(`❌ ${message}`, meta),
};

// Debug logging middleware
const requestLogger = (req, res, next) => {
  logger.info("Incoming Request:", {
    method: req.method,
    path: req.path,
    body: req.body ? Object.keys(req.body) : "none",
    contentType: req.headers["content-type"] || "none",
  });
  next();
};

// Rate limiting configurations
const authRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: "Too many login attempts from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  store: new MemoryStore(),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts from this IP, please try again later.",
    });
  },
};

const generalRateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  store: new MemoryStore(),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
    });
  },
};

// Security settings
const helmetOptions = {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
};

// Request ID middleware
const addRequestId = (req, res, next) => {
  req.requestId = uuid();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};

// Response time middleware
const addResponseTime = (req, res, next) => {
  const startHrTime = process.hrtime();
  const originalJson = res.json;

  res.json = function (body) {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    res.setHeader("X-Response-Time", `${elapsedTimeInMs.toFixed(3)}ms`);
    return originalJson.call(this, body);
  };

  next();
};

// Health check endpoint
const healthCheck = async (req, res) => {
  try {
    const dbConnected = await testConnection();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: "2.0.0",
      database: {
        type: "PostgreSQL",
        configured: !!process.env.DATABASE_URL,
        connected: dbConnected,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Configure middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Add request ID and timing
app.use(addRequestId);
app.use(addResponseTime);

// Debug logging
if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
}

// Security middleware
app.use(helmet(helmetOptions));

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://school-management-frontend-flax.vercel.app", // Add this line
      "https://school-management-backend-sandy.vercel.app",
      process.env.ALLOWED_ORIGINS,
      /\.vercel\.app$/,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(compression());

// Rate limiting
const authLimiter = rateLimit(authRateLimitConfig);
const apiLimiter = rateLimit(generalRateLimitConfig);

app.use("/api/v1/auth", authLimiter);
app.use("/api/v1", apiLimiter);

// Logging middleware
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Basic API routes (replacing complex route imports for now)
const apiRouter = express.Router();

// Health check route
apiRouter.get("/health", healthCheck);

// Test endpoint
apiRouter.get("/test", async (req, res) => {
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
    res.status(500).json({
      message: "Backend test failed!",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Database test endpoint
apiRouter.get("/db-test", async (req, res) => {
  try {
    const result = await query("SELECT NOW() as current_time, version() as db_version");

    res.json({
      message: "Database connection and query successful!",
      connected: true,
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version,
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      connected: false,
      error: error.message,
      environment: process.env.NODE_ENV || "development",
    });
  }
});

// Auth routes
apiRouter.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role = "student" } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Username, email, and password are required",
      });
    }

    // Check if user exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1 OR username = $2", [
      email,
      username,
    ]);

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
    logger.error("Registration error:", error.message);
    res.status(500).json({
      success: false,
      error: "Registration failed",
      message: error.message,
    });
  }
});

apiRouter.post("/auth/login", async (req, res) => {
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
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }
  } catch (error) {
    logger.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      error: "Login failed",
      message: error.message,
    });
  }
});

// Basic CRUD endpoints
apiRouter.get("/users", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, username, email, first_name, last_name, role, status, created_at 
       FROM users ORDER BY created_at DESC`
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
    logger.error("Get users error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      message: error.message,
    });
  }
});

// Mount API router
app.use("/api/v1", apiRouter);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const staticPath = path.resolve(process.cwd(), "client", "build");
  app.use(express.static(staticPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    message: "API endpoint not found",
    availableRoutes: [
      "GET /api/v1/health",
      "GET /api/v1/test",
      "GET /api/v1/db-test",
      "POST /api/v1/auth/register",
      "POST /api/v1/auth/login",
      "GET /api/v1/users",
    ],
  });
});

// Graceful shutdown function
const gracefulShutdown = async () => {
  logger.info("Starting graceful shutdown...");

  try {
    if (pool) {
      await pool.end();
      logger.info("Database pool closed");
    }
  } catch (error) {
    logger.error("Error during graceful shutdown:", error.message);
  }
};

// Process event handlers
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error.message);
  gracefulShutdown().then(() => process.exit(1));
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
  gracefulShutdown().then(() => process.exit(1));
});

// Initialize server
const initializeServer = async () => {
  try {
    // Validate configuration
    validateConfig();

    // Initialize database
    await initializeDatabase();
    logger.info("Database initialized successfully");

    // Return the configured app
    return app;
  } catch (error) {
    logger.error("Failed to initialize server:", error.message);
    process.exit(1);
  }
};

// Export the app and initialization function
export { app, initializeServer };
