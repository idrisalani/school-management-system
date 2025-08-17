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
// 🔧 UPDATED Login Endpoint - No major changes needed, but enhanced logging

app.post(
  "/api/v1/auth/login",
  [body("password").notEmpty().withMessage("Password is required")],
  async (req, res) => {
    try {
      console.log("🔑 Login request received:", {
        hasEmail: !!req.body.email,
        hasUsername: !!req.body.username,
        usernameFormat: req.body.username
          ? req.body.username.includes(".")
            ? "firstname.lastname"
            : "legacy"
          : "none",
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
      let queryText;
      let queryParams;

      if (email) {
        // Login with email
        queryText = `SELECT id, username, email, name, first_name, last_name, role, password, created_at 
               FROM users 
               WHERE email = $1 AND status = 'active'`;
        queryParams = [email.toLowerCase()];
        console.log("🔍 Searching by email:", email.toLowerCase());
      } else {
        // Login with username (now supports both firstname.lastname AND legacy "First Last" format)
        queryText = `SELECT id, username, email, name, first_name, last_name, role, password, created_at 
               FROM users 
               WHERE username = $1 AND status = 'active'`;
        queryParams = [username];
        console.log("🔍 Searching by username:", username);
      }

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
      console.log("✅ User found:", {
        email: user.email,
        username: user.username,
        usernameFormat: user.username.includes(".")
          ? "firstname.lastname"
          : "legacy",
      });

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

      // Return user data with actual separate name fields
      const userResponse = {
        id: user.id,
        username: user.username, // Could be john.smith or "John Smith" (legacy)
        email: user.email,
        firstName: user.first_name || "", // Direct from database
        lastName: user.last_name || "", // Direct from database
        name: user.name, // Full name also available
        role: user.role,
        createdAt: user.created_at,
      };

      console.log("🎉 Login successful for:", {
        email: userResponse.email,
        username: userResponse.username,
        usernameFormat: userResponse.username.includes(".")
          ? "NEW (firstname.lastname)"
          : "LEGACY (First Last)",
      });

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
// 🔐 REPLACE your existing registration endpoint in server.js with this:

// 🔐 UPDATED Registration Endpoint - Creates username as firstname.lastname

// 🔧 FIXED Registration Endpoint - Prevents NULL name values

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
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role,
        timestamp: new Date().toISOString(),
      });

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, password, role } = req.body;

      // FIXED: Ensure name fields are never null/undefined/empty
      const cleanFirstName = (firstName || "").toString().trim();
      const cleanLastName = (lastName || "").toString().trim();

      // Double-check we have valid names
      if (!cleanFirstName || !cleanLastName) {
        console.log("❌ Invalid name data:", { cleanFirstName, cleanLastName });
        return res.status(400).json({
          status: "error",
          message: "First name and last name are required",
        });
      }

      // Create username and full name with guaranteed non-null values
      const username = `${cleanFirstName.toLowerCase()}.${cleanLastName.toLowerCase()}`;
      const fullName = `${cleanFirstName} ${cleanLastName}`;

      console.log("🔍 Processing registration for:", {
        username, // john.smith
        fullName, // John Smith (guaranteed non-null)
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: email.toLowerCase(),
      });

      // Verify fullName is not null/empty before proceeding
      if (!fullName || fullName.trim() === "" || fullName.trim() === " ") {
        console.log("❌ Full name is invalid:", {
          fullName,
          length: fullName.length,
        });
        return res.status(400).json({
          status: "error",
          message: "Invalid name combination",
        });
      }

      if (!process.env.DATABASE_URL) {
        console.log("❌ DATABASE_URL not configured");
        return res.status(500).json({
          status: "error",
          message: "Database not configured",
        });
      }

      console.log("🔍 Checking for existing user...");

      // Check if user already exists
      const existingUser = await query(
        "SELECT id, email, username FROM users WHERE email = $1 OR username = $2",
        [email.toLowerCase(), username]
      );

      if (existingUser.rows.length > 0) {
        const existing = existingUser.rows[0];
        if (existing.email === email.toLowerCase()) {
          console.log("❌ Email already exists:", email);
          return res.status(409).json({
            status: "error",
            message: "Email address is already registered",
          });
        } else if (existing.username === username) {
          console.log("❌ Username already exists:", username);
          return res.status(409).json({
            status: "error",
            message:
              "This name combination is already taken. Please try a different name.",
          });
        }
      }

      console.log("✅ Email and username available, hashing password...");

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      console.log("✅ Password hashed, creating user...");
      console.log("📊 Final values check:", {
        username: username || "NULL",
        email: email.toLowerCase() || "NULL",
        name: fullName || "NULL",
        first_name: cleanFirstName || "NULL",
        last_name: cleanLastName || "NULL",
        role: role || "NULL",
      });

      // Insert user with explicit null checks
      const result = await query(
        `INSERT INTO users (username, email, password, name, first_name, last_name, role, is_verified, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) 
         RETURNING id, username, email, name, first_name, last_name, role, created_at`,
        [
          username || null, // $1 - username (allow null if somehow empty)
          email.toLowerCase() || null, // $2 - email
          hashedPassword || null, // $3 - password
          fullName || null, // $4 - name (this was the issue!)
          cleanFirstName || null, // $5 - first_name
          cleanLastName || null, // $6 - last_name
          role || null, // $7 - role
          false, // $8 - is_verified
          "active", // $9 - status
        ]
      );

      const user = result.rows[0];
      console.log("✅ User created successfully:", {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || "fallback-secret-key",
        { expiresIn: "7d" }
      );

      // Return user data
      const userResponse = {
        id: user.id,
        username: user.username, // john.smith
        email: user.email,
        firstName: user.first_name, // John
        lastName: user.last_name, // Smith
        name: user.name, // John Smith
        role: user.role,
        createdAt: user.created_at,
      };

      console.log(
        "🎉 Registration completed successfully for:",
        userResponse.email
      );
      console.log("🎯 New username format:", userResponse.username);

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
      console.error("📍 Error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        detail: error.detail,
      });

      // Handle specific PostgreSQL errors
      if (error.code === "23505") {
        // Unique constraint violation
        if (error.detail?.includes("username")) {
          return res.status(409).json({
            status: "error",
            message:
              "This name combination is already taken. Please try a different name.",
          });
        } else if (error.detail?.includes("email")) {
          return res.status(409).json({
            status: "error",
            message: "Email address is already registered",
          });
        }
      }

      if (error.code === "23502") {
        // Not-null constraint violation
        console.error("❌ NULL constraint violation:", error.detail);
        return res.status(400).json({
          status: "error",
          message: "Missing required field - please fill in all information",
          debug: error.detail,
        });
      }

      res.status(500).json({
        status: "error",
        message: "Registration failed",
        debug:
          process.env.NODE_ENV === "development"
            ? {
                error: error.message,
                code: error.code,
              }
            : undefined,
      });
    }
  }
);

// Add this DEBUG endpoint temporarily to your server.js (REMOVE in production)
app.get("/api/v1/debug/registration", async (req, res) => {
  try {
    console.log("🔍 Registration debug endpoint called");

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
      },
      database: {
        connectionStatus: "testing...",
      },
    };

    // Test database connection
    if (process.env.DATABASE_URL) {
      try {
        console.log("🐘 Testing PostgreSQL connection...");

        // Test basic connection
        const timeResult = await query("SELECT NOW() as current_time");
        debugInfo.database.connectionStatus = "SUCCESS";
        debugInfo.database.currentTime = timeResult.rows[0].current_time;

        // Check if users table exists and has the right columns
        const tableStructure = await query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'users' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `);

        debugInfo.database.usersTableExists = tableStructure.rows.length > 0;
        debugInfo.database.usersTableColumns = tableStructure.rows.map(
          (row) => ({
            name: row.column_name,
            type: row.data_type,
            nullable: row.is_nullable === "YES",
          })
        );

        // Check for specific columns we need
        const requiredColumns = [
          "first_name",
          "last_name",
          "name",
          "email",
          "password",
          "role",
        ];
        const existingColumns = tableStructure.rows.map(
          (row) => row.column_name
        );

        debugInfo.database.hasRequiredColumns = {
          first_name: existingColumns.includes("first_name"),
          last_name: existingColumns.includes("last_name"),
          name: existingColumns.includes("name"),
          email: existingColumns.includes("email"),
          password: existingColumns.includes("password"),
          role: existingColumns.includes("role"),
          username: existingColumns.includes("username"),
          is_verified: existingColumns.includes("is_verified"),
          status: existingColumns.includes("status"),
        };

        // Test a simple query
        const userCount = await query("SELECT COUNT(*) as count FROM users");
        debugInfo.database.userCount = parseInt(userCount.rows[0].count);
      } catch (dbError) {
        console.error("💥 Database test failed:", dbError);
        debugInfo.database.connectionStatus = "FAILED";
        debugInfo.database.error = dbError.message;
        debugInfo.database.errorCode = dbError.code;
      }
    } else {
      debugInfo.database.connectionStatus = "NO_CONNECTION_STRING";
    }

    console.log("📊 Registration debug info collected:", debugInfo);

    res.json({
      status: "success",
      message: "Registration debug information collected",
      data: debugInfo,
    });
  } catch (error) {
    console.error("💥 Debug endpoint error:", error);

    res.status(500).json({
      status: "error",
      message: "Debug endpoint failed",
      error: error.message,
    });
  }
});

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
