// @ts-nocheck

// server/src/server.js - Complete School Management System API
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

// ========================= DATABASE SETUP =========================
let pool;
const createPool = () => {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3, // Increased for multiple connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("PostgreSQL pool error:", err.message);
    });
  }
  return pool;
};

const query = async (text, params = []) => {
  try {
    const poolInstance = createPool();
    if (!poolInstance) throw new Error("Database not configured");

    const client = await poolInstance.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Query error:", error.message);
    throw error;
  }
};

// ========================= MIDDLEWARE =========================
// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://school-management-frontend-bay.vercel.app",
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
  ].filter(Boolean),
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
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ========================= HELPER FUNCTIONS =========================
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    },
    process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
    { expiresIn: "7d" }
  );
};

const verifyToken = (req, res, next) => {
  const token =
    req.headers.authorization?.split(" ")[1] || req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Access token required",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

// ========================= ROOT & HEALTH ENDPOINTS =========================
app.get("/", (req, res) => {
  res.json({
    message: "School Management System API",
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    version: "3.0.0",
    database: "PostgreSQL (Supabase)",
    endpoints: {
      auth: "/api/v1/auth/*",
      users: "/api/v1/users/*",
      classes: "/api/v1/classes/*",
      assignments: "/api/v1/assignments/*",
      grades: "/api/v1/grades/*",
      attendance: "/api/v1/attendance/*",
    },
  });
});

app.get("/api/v1/health", async (req, res) => {
  try {
    let dbConnected = false;
    let dbVersion = null;

    if (process.env.DATABASE_URL) {
      try {
        const result = await query(
          "SELECT NOW() as current_time, version() as db_version"
        );
        dbConnected = true;
        dbVersion = result.rows[0].db_version.substring(0, 50) + "...";
      } catch (e) {
        console.error("DB health check failed:", e.message);
      }
    }

    res.json({
      status: "success",
      message: "School Management API is running",
      database: {
        configured: !!process.env.DATABASE_URL,
        connected: dbConnected,
        type: "PostgreSQL (Supabase)",
        version: dbVersion,
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
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

// Database test endpoint
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

// ========================= AUTHENTICATION ENDPOINTS =========================

// AUTH: Register (WORKING VERSION)
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
      console.log("🚀 Registration attempt:", req.body.email);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, password, role } = req.body;

      // Create username and name (WORKING VERSION)
      const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
      const fullName = `${firstName} ${lastName}`;

      console.log("🔍 Creating user:", { username, email, role });

      // Check for existing user
      const existing = await query(
        "SELECT id, email, username FROM users WHERE email = $1 OR username = $2",
        [email.toLowerCase(), username]
      );

      if (existing.rows.length > 0) {
        const existingUser = existing.rows[0];
        if (existingUser.email === email.toLowerCase()) {
          return res.status(409).json({
            status: "error",
            message: "Email address is already registered",
          });
        } else if (existingUser.username === username) {
          return res.status(409).json({
            status: "error",
            message:
              "This name combination is already taken. Please try a different name.",
          });
        }
      }

      // Hash password (FAST for serverless)
      console.log("🔐 Hashing password...");
      const saltRounds = 4; // Proven to work in serverless
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log("✅ Password hashed successfully");

      // Insert user (NULL-safe version)
      const result = await query(
        `INSERT INTO users (username, email, password, name, first_name, last_name, role, is_verified, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) 
         RETURNING id, username, email, name, first_name, last_name, role, created_at`,
        [
          username,
          email.toLowerCase(),
          hashedPassword,
          fullName, // This now works due to database fix
          firstName,
          lastName,
          role,
          false,
          "active",
        ]
      );

      const user = result.rows[0];
      console.log("✅ User created:", user.username);

      // Generate JWT token
      const token = generateToken(user);

      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            name: user.name,
            role: user.role,
            createdAt: user.created_at,
          },
          token: token,
        },
      });
    } catch (error) {
      console.error("💥 Registration error:", error);

      // Handle specific PostgreSQL errors
      if (error.code === "23505") {
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

      res.status(500).json({
        status: "error",
        message: "Registration failed",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// AUTH: Login
app.post(
  "/api/v1/auth/login",
  [
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("username")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Username cannot be empty"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      console.log("🔑 Login attempt:", {
        hasEmail: !!req.body.email,
        hasUsername: !!req.body.username,
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, username, password } = req.body;

      if (!email && !username) {
        return res.status(400).json({
          status: "error",
          message: "Email or username is required",
        });
      }

      // Build query for login
      let queryText;
      let queryParams;

      if (email) {
        queryText = `SELECT id, username, email, password, name, first_name, last_name, role, is_verified, status, created_at 
                     FROM users WHERE email = $1 AND status = 'active'`;
        queryParams = [email.toLowerCase()];
        console.log("🔍 Searching by email:", email.toLowerCase());
      } else {
        queryText = `SELECT id, username, email, password, name, first_name, last_name, role, is_verified, status, created_at 
                     FROM users WHERE username = $1 AND status = 'active'`;
        queryParams = [username];
        console.log("🔍 Searching by username:", username);
      }

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
      });

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        console.log("❌ Password mismatch");
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials",
        });
      }

      console.log("✅ Password verified, generating token...");

      // Update last login
      await query(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
        [user.id]
      );

      // Generate JWT token
      const token = generateToken(user);

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        name: user.name,
        role: user.role,
        isVerified: user.is_verified,
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

// AUTH: Get current user profile
app.get("/api/v1/auth/me", verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, username, email, name, first_name, last_name, role, is_verified, status, created_at, last_login
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const user = result.rows[0];
    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          name: user.name,
          role: user.role,
          isVerified: user.is_verified,
          status: user.status,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get user profile",
    });
  }
});

// AUTH: Logout (invalidate token - client-side mainly)
app.post("/api/v1/auth/logout", verifyToken, (req, res) => {
  // In a more advanced setup, you'd add the token to a blacklist
  res.json({
    status: "success",
    message: "Logged out successfully",
  });
});

// ========================= USER MANAGEMENT ENDPOINTS =========================

// Get all users (Admin only)
app.get(
  "/api/v1/users",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      console.log("👥 Get users request by admin:", req.user.email);

      const { role, status, page = 1, limit = 50 } = req.query;
      let queryText = `SELECT id, username, email, name, first_name, last_name, role, status, is_verified, created_at, last_login 
                     FROM users WHERE 1=1`;
      const queryParams = [];
      let paramCount = 0;

      if (role) {
        paramCount++;
        queryText += ` AND role = $${paramCount}`;
        queryParams.push(role);
      }

      if (status) {
        paramCount++;
        queryText += ` AND status = $${paramCount}`;
        queryParams.push(status);
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${
        paramCount + 1
      } OFFSET $${paramCount + 2}`;
      queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await query(queryText, queryParams);

      // Get total count
      const countResult = await query("SELECT COUNT(*) as total FROM users");
      const total = parseInt(countResult.rows[0].total);

      console.log(`✅ Found ${result.rows.length} users (${total} total)`);

      res.json({
        status: "success",
        data: {
          users: result.rows.map((user) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            name: user.name,
            role: user.role,
            status: user.status,
            isVerified: user.is_verified,
            createdAt: user.created_at,
            lastLogin: user.last_login,
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error("💥 Get users error:", error.message);
      res.status(500).json({
        status: "error",
        message: "Failed to fetch users",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Get user by ID
app.get("/api/v1/users/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they're admin
    if (req.user.role !== "admin" && req.user.userId !== parseInt(id)) {
      return res.status(403).json({
        status: "error",
        message: "You can only view your own profile",
      });
    }

    const result = await query(
      `SELECT id, username, email, name, first_name, last_name, role, status, is_verified, created_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const user = result.rows[0];
    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          name: user.name,
          role: user.role,
          status: user.status,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        },
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user",
    });
  }
});

// Update user profile
app.put(
  "/api/v1/users/:id",
  verifyToken,
  [
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Last name must be at least 2 characters"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("phone").optional().trim(),
    body("address").optional().trim(),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      // Users can only update their own profile unless they're admin
      if (req.user.role !== "admin" && req.user.userId !== parseInt(id)) {
        return res.status(403).json({
          status: "error",
          message: "You can only update your own profile",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, phone, address } = req.body;
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (firstName) {
        paramCount++;
        updates.push(`first_name = $${paramCount}`);
        values.push(firstName);
      }

      if (lastName) {
        paramCount++;
        updates.push(`last_name = $${paramCount}`);
        values.push(lastName);
      }

      if (firstName && lastName) {
        paramCount++;
        updates.push(`name = $${paramCount}`);
        values.push(`${firstName} ${lastName}`);
      }

      if (email) {
        paramCount++;
        updates.push(`email = $${paramCount}`);
        values.push(email.toLowerCase());
      }

      if (phone !== undefined) {
        paramCount++;
        updates.push(`phone = $${paramCount}`);
        values.push(phone);
      }

      if (address !== undefined) {
        paramCount++;
        updates.push(`address = $${paramCount}`);
        values.push(address);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "No valid fields to update",
        });
      }

      paramCount++;
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} 
       RETURNING id, username, email, name, first_name, last_name, role, status, is_verified, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      const user = result.rows[0];
      res.json({
        status: "success",
        message: "Profile updated successfully",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            name: user.name,
            role: user.role,
            status: user.status,
            isVerified: user.is_verified,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
        },
      });
    } catch (error) {
      console.error("Update user error:", error);

      if (error.code === "23505" && error.detail?.includes("email")) {
        return res.status(409).json({
          status: "error",
          message: "Email address is already in use",
        });
      }

      res.status(500).json({
        status: "error",
        message: "Failed to update profile",
      });
    }
  }
);

// ========================= PLACEHOLDER ENDPOINTS =========================
// These are basic endpoints - expand based on your needs

// Classes endpoints
app.get("/api/v1/classes", verifyToken, async (req, res) => {
  // TODO: Implement classes listing
  res.json({
    status: "success",
    message: "Classes endpoint - to be implemented",
    data: { classes: [] },
  });
});

app.post(
  "/api/v1/classes",
  verifyToken,
  checkRole(["admin", "teacher"]),
  async (req, res) => {
    // TODO: Implement class creation
    res.json({
      status: "success",
      message: "Create class endpoint - to be implemented",
    });
  }
);

// Assignments endpoints
app.get("/api/v1/assignments", verifyToken, async (req, res) => {
  // TODO: Implement assignments listing
  res.json({
    status: "success",
    message: "Assignments endpoint - to be implemented",
    data: { assignments: [] },
  });
});

// Grades endpoints
app.get("/api/v1/grades", verifyToken, async (req, res) => {
  // TODO: Implement grades listing
  res.json({
    status: "success",
    message: "Grades endpoint - to be implemented",
    data: { grades: [] },
  });
});

// Attendance endpoints
app.get("/api/v1/attendance", verifyToken, async (req, res) => {
  // TODO: Implement attendance listing
  res.json({
    status: "success",
    message: "Attendance endpoint - to be implemented",
    data: { attendance: [] },
  });
});

// ========================= ERROR HANDLING =========================

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "API endpoint not found",
    path: req.originalUrl,
    availableRoutes: [
      "GET /",
      "GET /api/v1/health",
      "GET /api/v1/db-test",
      "POST /api/v1/auth/register",
      "POST /api/v1/auth/login",
      "GET /api/v1/auth/me",
      "POST /api/v1/auth/logout",
      "GET /api/v1/users",
      "GET /api/v1/users/:id",
      "PUT /api/v1/users/:id",
      "GET /api/v1/classes",
      "POST /api/v1/classes",
      "GET /api/v1/assignments",
      "GET /api/v1/grades",
      "GET /api/v1/attendance",
    ],
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  console.error("Stack:", err.stack);

  res.status(err.status || 500).json({
    status: "error",
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ========================= SERVER EXPORT =========================
export default app;

// Local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 School Management System API running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  });
}
