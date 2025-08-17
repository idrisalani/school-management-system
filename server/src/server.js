// @ts-nocheck
// server/src/server.js - Secure PostgreSQL Version with Proper CORS
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
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

// 🔧 Bulletproof CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://school-management-frontend-bay.vercel.app", // EXACT current frontend URL
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-Access-Token",
  ],
  exposedHeaders: ["Content-Length"],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// 🔐 JWT Helper Functions
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
    { expiresIn: "24h" }
  );
};

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "School Management System API",
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    version: "2.1.0",
    database: "PostgreSQL (Supabase)",
  });
});

// Health check
app.get("/api/v1/health", async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: "success",
      message: "School Management API is running",
      database: {
        configured: !!process.env.DATABASE_URL,
        connected: dbConnected,
        type: "PostgreSQL (Supabase)",
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Auth health check
app.get("/api/v1/auth/health", (req, res) => {
  res.json({
    status: "success",
    message: "Auth routes are working",
    timestamp: new Date().toISOString(),
  });
});

// Database test
app.get("/api/v1/db-test", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      status: "error",
      message: "DATABASE_URL not configured",
      connected: false,
    });
  }

  try {
    const result = await query(
      "SELECT NOW() as current_time, version() as db_version"
    );
    res.json({
      status: "success",
      message: "Database connection successful!",
      connected: true,
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version.substring(0, 50) + "...",
      environment: process.env.NODE_ENV || "production",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      connected: false,
      error: error.message,
    });
  }
});

// 🔐 Secure Auth Login - Support both email and username
// 🔐 Fixed Auth Login - Matches your existing PostgreSQL schema
app.post(
  "/api/v1/auth/login",
  [body("password").notEmpty().withMessage("Password is required")],
  async (req, res) => {
    try {
      console.log("🔑 Login request received:", {
        hasEmail: !!req.body.email,
        hasUsername: !!req.body.username,
        timestamp: new Date().toISOString(),
      });

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, username, password } = req.body;

      // Validate that either email or username is provided
      if (!email && !username) {
        return res.status(400).json({
          status: "error",
          message: "Email or username is required",
        });
      }

      if (!process.env.DATABASE_URL) {
        return res.status(500).json({
          status: "error",
          message: "Database not configured",
        });
      }

      // Build query to support both email and username login
      // UPDATED to match your existing schema (no first_name, last_name)
      let queryText;
      let queryParams;

      if (email) {
        // Login with email - now includes separate name fields
        queryText = `SELECT id, username, email, name, first_name, last_name, role, password, created_at 
               FROM users 
               WHERE email = $1 AND status = 'active'`;
        queryParams = [email.toLowerCase()];
      } else {
        // Login with username - now includes separate name fields
        queryText = `SELECT id, username, email, name, first_name, last_name, role, password, created_at 
               FROM users 
               WHERE username = $1 AND status = 'active'`;
        queryParams = [username];
      }

      console.log("🔍 Searching for user...");

      // Get user with hashed password
      const result = await query(queryText, queryParams);

      if (result.rows.length === 0) {
        console.log("❌ User not found");
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials",
        });
      }

      const user = result.rows[0];
      console.log("✅ User found:", user.email);

      // Compare password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        console.log("❌ Password mismatch");
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials",
        });
      }

      console.log("✅ Password verified, generating token...");

      // Generate JWT token
      const token = generateToken(user);

      // Return user data (split name into firstName/lastName for frontend compatibility)
      const nameParts = user.name ? user.name.split(" ") : ["", ""];
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
      };

      console.log("🎉 Login successful for:", userResponse.email);

      res.json({
        status: "success",
        message: "Login successful",
        data: {
          user: userResponse,
          token: token,
        },
      });
    } catch (error) {
      console.error("💥 Login error:", error.message);
      res.status(500).json({
        status: "error",
        message: "Login failed",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// 🔐 Secure Auth Register
// If you choose Option 2 (add separate name columns), use this registration endpoint instead:

app.post(
  "/api/v1/auth/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters"),
    body("lastName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Last name must be at least 2 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .isIn(["student", "teacher", "parent"])
      .withMessage("Invalid role"),
  ],
  async (req, res) => {
    try {
      console.log("🚀 Registration request received:", {
        email: req.body.email,
        role: req.body.role,
        timestamp: new Date().toISOString(),
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, password, role } = req.body;

      // Create full name AND store separate first/last names
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const username = fullName;

      if (!process.env.DATABASE_URL) {
        return res.status(500).json({
          status: "error",
          message: "Database not configured",
        });
      }

      // Check if user already exists
      const existingUser = await query(
        "SELECT id FROM users WHERE email = $1 OR username = $2",
        [email.toLowerCase(), username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Email address is already registered",
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user with separate first/last names + combined name
      const result = await query(
        `INSERT INTO users (username, email, password, name, first_name, last_name, role, is_verified, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) 
         RETURNING id, username, email, name, first_name, last_name, role, created_at`,
        [
          username, // username
          email.toLowerCase(), // email
          hashedPassword, // password
          fullName, // name (full name for compatibility)
          firstName.trim(), // first_name (separate field)
          lastName.trim(), // last_name (separate field)
          role, // role
          false, // is_verified
          "active", // status
        ]
      );

      const user = result.rows[0];
      console.log("✅ User created successfully:", {
        id: user.id,
        email: user.email,
      });

      // Generate JWT token
      const token = generateToken(user);

      // Return user data with proper first/last names (no splitting needed!)
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name, // Direct from database
        lastName: user.last_name, // Direct from database
        name: user.name, // Full name also available
        role: user.role,
        createdAt: user.created_at,
      };

      console.log(
        "🎉 Registration completed successfully for:",
        userResponse.email
      );

      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        data: {
          user: userResponse,
          token: token,
        },
      });
    } catch (error) {
      console.error("💥 Registration error:", error);

      if (error.code === "23505") {
        const field = error.detail?.includes("email") ? "email" : "username";
        return res.status(409).json({
          status: "error",
          message: `${
            field === "email" ? "Email address" : "Username"
          } is already registered`,
        });
      }

      res.status(500).json({
        status: "error",
        message: "Registration failed",
        debug: {
          error: error.message,
          code: error.code,
        },
      });
    }
  }
);

// Get users - UPDATED to match your existing PostgreSQL schema
app.get("/api/v1/users", async (req, res) => {
  try {
    console.log("👥 Get users request received");

    // Updated query to include separate name fields
    const result = await query(
      `SELECT id, username, email, name, first_name, last_name, role, status, is_verified, created_at 
       FROM users ORDER BY created_at DESC LIMIT 100`
    );

    console.log(`✅ Found ${result.rows.length} users`);

    res.json({
      status: "success",
      data: {
        users: result.rows.map((user) => {
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name || "", // Direct from database
            lastName: user.last_name || "", // Direct from database
            name: user.name, // Full name also available
            role: user.role,
            status: user.status,
            isVerified: user.is_verified,
            createdAt: user.created_at,
          };
        }),
        total: result.rows.length,
      },
    });
  } catch (error) {
    console.error("💥 Get users error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    status: "error",
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "API endpoint not found",
    path: req.originalUrl,
    availableRoutes: [
      "GET /",
      "GET /api/v1/health",
      "GET /api/v1/auth/health",
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
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
  });
}
