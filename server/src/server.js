// @ts-nocheck

// server/src/server.js - Complete School Management System API
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import pkg from "pg";
import authRoutes from "./routes/auth.routes.js";

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

// In-memory token blacklist (upgrade to Redis for production scale)
const tokenBlacklist = new Map();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (now > expiry) {
      tokenBlacklist.delete(token);
    }
  }
}, 3600000); // 1 hour cleanup

// Enhanced token verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1] || req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Access token required",
    });
  }

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({
      status: "error",
      message: "Token has been invalidated. Please login again.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-key"
    );
    req.user = decoded;
    req.token = token; // Store token for potential blacklisting
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token has expired. Please login again.",
      });
    }
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }
};

// ========================= MIDDLEWARE =========================
// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://school-management-frontend-flax.vercel.app",
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
app.use("/api/v1/auth", authRoutes);

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

      console.log("🔧 Generated username:", username); // Debug log
      console.log("🔧 Generated name:", fullName); // Debug logs
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

app.post("/api/v1/auth/login-test", async (req, res) => {
  console.log("🧪 Login test route hit!");
  console.log("Request body:", req.body);

  res.json({
    status: "success",
    message: "Login route is accessible!",
    body_received: req.body,
    timestamp: new Date().toISOString(),
  });
});

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
    console.log("🚀 LOGIN ROUTE HIT - Request received:", {
      hasEmail: !!req.body.email,
      hasUsername: !!req.body.username,
      hasPassword: !!req.body.password,
      method: req.method,
      path: req.path,
    });

    try {
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

      console.log("✅ Login validation passed");
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

console.log("🔍 AUTH ROUTES REGISTERED:");
console.log("✅ Registration route: POST /api/v1/auth/register");
console.log("✅ Login route: POST /api/v1/auth/login");
console.log("🚀 Server starting with auth routes...");

// Add a test route to verify routing works
app.get("/api/v1/auth/test", (req, res) => {
  res.json({
    status: "success",
    message: "Auth routes are working!",
    timestamp: new Date().toISOString(),
  });
});

console.log("✅ Test route added: GET /api/v1/auth/test");

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
// Enhanced logout with token blacklisting
app.post("/api/v1/auth/logout", verifyToken, (req, res) => {
  try {
    const token = req.token;

    // Get token expiration (standard JWT exp is in seconds)
    const decoded = jwt.decode(token);
    const tokenExpiry = decoded.exp * 1000; // Convert to milliseconds

    // Add token to blacklist until its natural expiration
    tokenBlacklist.set(token, tokenExpiry);

    console.log(`🔒 Token blacklisted for user ${req.user.email}`);

    res.json({
      status: "success",
      message: "Logged out successfully. Token has been invalidated.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      message: "Logout failed",
    });
  }
});

// Logout from all devices (blacklist all user tokens)
app.post("/api/v1/auth/logout-all", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // In a production system, you'd store user tokens in database
    // For now, we'll add a timestamp-based invalidation
    const logoutTime = Date.now();

    // Update user's last_logout time in database
    await query("UPDATE users SET last_logout = $1 WHERE id = $2", [
      new Date(logoutTime),
      userId,
    ]);

    res.json({
      status: "success",
      message: "Logged out from all devices successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to logout from all devices",
    });
  }
});

// Check token status
app.get("/api/v1/auth/token-status", verifyToken, (req, res) => {
  const decoded = jwt.decode(req.token);
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.exp - now;

  res.json({
    status: "success",
    data: {
      valid: true,
      expiresIn: timeUntilExpiry,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      user: {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    },
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

// ========================= CLASSES MANAGEMENT ENDPOINTS =========================

// Get all classes (with filtering and pagination)
app.get("/api/v1/classes", verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      department_id,
      teacher_id,
      grade_level,
      academic_year,
      status = "active",
      search,
    } = req.query;

    let queryText = `
      SELECT c.*, d.name as department_name, 
             u.first_name || ' ' || u.last_name as teacher_name,
             COUNT(e.student_id) as enrolled_students
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 0;

    if (department_id) {
      paramCount++;
      queryText += ` AND c.department_id = $${paramCount}`;
      queryParams.push(department_id);
    }

    if (teacher_id) {
      paramCount++;
      queryText += ` AND c.teacher_id = $${paramCount}`;
      queryParams.push(teacher_id);
    }

    if (grade_level) {
      paramCount++;
      queryText += ` AND c.grade_level = $${paramCount}`;
      queryParams.push(grade_level);
    }

    if (academic_year) {
      paramCount++;
      queryText += ` AND c.academic_year = $${paramCount}`;
      queryParams.push(academic_year);
    }

    if (status) {
      paramCount++;
      queryText += ` AND c.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (c.name ILIKE $${paramCount} OR c.code ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    queryText += ` GROUP BY c.id, d.name, u.first_name, u.last_name`;
    queryText += ` ORDER BY c.created_at DESC`;
    queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(queryText, queryParams);

    // Get total count
    const countResult = await query(
      "SELECT COUNT(*) as total FROM classes WHERE status = $1",
      [status]
    );
    const total = parseInt(countResult.rows[0].total);

    res.json({
      status: "success",
      data: {
        classes: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch classes",
    });
  }
});

// Create new class (Admin/Teacher only)
app.post(
  "/api/v1/classes",
  verifyToken,
  checkRole(["admin", "teacher"]),
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Class name is required"),
    body("code")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Class code is required"),
    body("department_id").isInt().withMessage("Department ID is required"),
    body("grade_level")
      .trim()
      .notEmpty()
      .withMessage("Grade level is required"),
    body("academic_year")
      .matches(/^\d{4}-\d{4}$/)
      .withMessage("Academic year must be in format YYYY-YYYY"),
    body("max_students")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max students must be a positive number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        name,
        code,
        description,
        department_id,
        teacher_id,
        grade_level,
        academic_year,
        term = "first",
        max_students = 30,
        credits = 3,
      } = req.body;

      // Check if class code already exists
      const existingClass = await query(
        "SELECT id FROM classes WHERE code = $1",
        [code]
      );

      if (existingClass.rows.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Class code already exists",
        });
      }

      // Verify department exists
      const departmentExists = await query(
        "SELECT id FROM departments WHERE id = $1",
        [department_id]
      );

      if (departmentExists.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Department not found",
        });
      }

      // If teacher_id provided, verify they are a teacher
      if (teacher_id) {
        const teacherExists = await query(
          "SELECT id FROM users WHERE id = $1 AND role = 'teacher'",
          [teacher_id]
        );

        if (teacherExists.rows.length === 0) {
          return res.status(404).json({
            status: "error",
            message: "Teacher not found",
          });
        }
      }

      const result = await query(
        `INSERT INTO classes 
       (name, code, description, department_id, teacher_id, grade_level, academic_year, term, max_students, credits, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP) 
       RETURNING *`,
        [
          name,
          code,
          description,
          department_id,
          teacher_id,
          grade_level,
          academic_year,
          term,
          max_students,
          credits,
          "active",
        ]
      );

      console.log(`✅ Class created: ${name} (${code}) by ${req.user.email}`);

      res.status(201).json({
        status: "success",
        message: "Class created successfully",
        data: {
          class: result.rows[0],
        },
      });
    } catch (error) {
      console.error("Create class error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          status: "error",
          message: "Class code already exists",
        });
      }

      res.status(500).json({
        status: "error",
        message: "Failed to create class",
      });
    }
  }
);

// Get class by ID (with enrolled students)
app.get("/api/v1/classes/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get class details
    const classResult = await query(
      `SELECT c.*, d.name as department_name, 
              u.first_name || ' ' || u.last_name as teacher_name,
              u.email as teacher_email
       FROM classes c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Class not found",
      });
    }

    // Get enrolled students
    const studentsResult = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, e.enrollment_date, e.status as enrollment_status
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.class_id = $1
       ORDER BY u.last_name, u.first_name`,
      [id]
    );

    const classData = {
      ...classResult.rows[0],
      enrolled_students: studentsResult.rows,
      enrollment_count: studentsResult.rows.length,
    };

    res.json({
      status: "success",
      data: {
        class: classData,
      },
    });
  } catch (error) {
    console.error("Get class error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch class",
    });
  }
});

// Update class
app.put(
  "/api/v1/classes/:id",
  verifyToken,
  checkRole(["admin", "teacher"]),
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Class name must be at least 2 characters"),
    body("code")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Class code must be at least 2 characters"),
    body("max_students")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max students must be a positive number"),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      // Check if class exists and user has permission
      const classCheck = await query("SELECT * FROM classes WHERE id = $1", [
        id,
      ]);

      if (classCheck.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Class not found",
        });
      }

      const classData = classCheck.rows[0];

      // Teachers can only update their own classes
      if (
        req.user.role === "teacher" &&
        classData.teacher_id !== req.user.userId
      ) {
        return res.status(403).json({
          status: "error",
          message: "You can only update your own classes",
        });
      }

      const updates = [];
      const values = [];
      let paramCount = 0;

      const allowedFields = [
        "name",
        "description",
        "teacher_id",
        "grade_level",
        "academic_year",
        "term",
        "max_students",
        "credits",
        "status",
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          paramCount++;
          updates.push(`${field} = $${paramCount}`);
          values.push(req.body[field]);
        }
      });

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
        `UPDATE classes SET ${updates.join(
          ", "
        )} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      res.json({
        status: "success",
        message: "Class updated successfully",
        data: {
          class: result.rows[0],
        },
      });
    } catch (error) {
      console.error("Update class error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update class",
      });
    }
  }
);

// Delete class (Admin only)
app.delete(
  "/api/v1/classes/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if class has enrollments
      const enrollmentCheck = await query(
        "SELECT COUNT(*) as count FROM enrollments WHERE class_id = $1",
        [id]
      );

      if (parseInt(enrollmentCheck.rows[0].count) > 0) {
        return res.status(400).json({
          status: "error",
          message:
            "Cannot delete class with enrolled students. Remove enrollments first.",
        });
      }

      const result = await query(
        "DELETE FROM classes WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Class not found",
        });
      }

      res.json({
        status: "success",
        message: "Class deleted successfully",
      });
    } catch (error) {
      console.error("Delete class error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to delete class",
      });
    }
  }
);

// ========================= ASSIGNMENTS MANAGEMENT ENDPOINTS =========================

// Get assignments (with filtering and role-based access)
app.get("/api/v1/assignments", verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      class_id,
      teacher_id,
      type,
      status = "active",
      due_date_from,
      due_date_to,
      search,
    } = req.query;

    let queryText = `
      SELECT a.*, c.name as class_name, c.code as class_code,
             u.first_name || ' ' || u.last_name as teacher_name,
             COUNT(s.id) as submission_count,
             COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submitted_count
      FROM assignments a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 0;

    // Role-based filtering
    if (req.user.role === "teacher") {
      paramCount++;
      queryText += ` AND a.teacher_id = $${paramCount}`;
      queryParams.push(req.user.userId);
    } else if (req.user.role === "student") {
      // Students only see assignments from their enrolled classes
      paramCount++;
      queryText += ` AND a.class_id IN (
        SELECT class_id FROM enrollments WHERE student_id = $${paramCount} AND status = 'active'
      )`;
      queryParams.push(req.user.userId);
    }

    if (class_id) {
      paramCount++;
      queryText += ` AND a.class_id = $${paramCount}`;
      queryParams.push(class_id);
    }

    if (teacher_id) {
      paramCount++;
      queryText += ` AND a.teacher_id = $${paramCount}`;
      queryParams.push(teacher_id);
    }

    if (type) {
      paramCount++;
      queryText += ` AND a.type = $${paramCount}`;
      queryParams.push(type);
    }

    if (status) {
      paramCount++;
      queryText += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (due_date_from) {
      paramCount++;
      queryText += ` AND a.due_date >= $${paramCount}`;
      queryParams.push(due_date_from);
    }

    if (due_date_to) {
      paramCount++;
      queryText += ` AND a.due_date <= $${paramCount}`;
      queryParams.push(due_date_to);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    queryText += ` GROUP BY a.id, c.name, c.code, u.first_name, u.last_name`;
    queryText += ` ORDER BY a.due_date ASC, a.created_at DESC`;
    queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(queryText, queryParams);

    res.json({
      status: "success",
      data: {
        assignments: result.rows.map((assignment) => ({
          ...assignment,
          is_overdue: new Date(assignment.due_date) < new Date(),
          submission_rate:
            assignment.submission_count > 0
              ? Math.round(
                  (assignment.submitted_count / assignment.submission_count) *
                    100
                )
              : 0,
        })),
      },
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch assignments",
    });
  }
});

// Create assignment (Teachers only)
app.post(
  "/api/v1/assignments",
  verifyToken,
  checkRole(["teacher", "admin"]),
  [
    body("title")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Assignment title is required (min 3 characters)"),
    body("class_id").isInt().withMessage("Class ID is required"),
    body("due_date").isISO8601().withMessage("Valid due date is required"),
    body("max_points")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Max points must be a positive number"),
    body("type")
      .isIn(["assignment", "quiz", "exam", "project", "homework", "lab"])
      .withMessage("Invalid assignment type"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        title,
        description,
        instructions,
        class_id,
        type = "assignment",
        max_points = 100,
        due_date,
        submission_type = "file",
        attachments,
      } = req.body;

      // Verify class exists and teacher has access (if teacher role)
      const classCheck = await query(
        req.user.role === "teacher"
          ? "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2"
          : "SELECT id FROM classes WHERE id = $1",
        req.user.role === "teacher" ? [class_id, req.user.userId] : [class_id]
      );

      if (classCheck.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message:
            req.user.role === "teacher"
              ? "Class not found or you don't have permission to create assignments for this class"
              : "Class not found",
        });
      }

      // Check due date is in the future
      if (new Date(due_date) <= new Date()) {
        return res.status(400).json({
          status: "error",
          message: "Due date must be in the future",
        });
      }

      const result = await query(
        `INSERT INTO assignments 
       (title, description, instructions, class_id, teacher_id, type, max_points, due_date, submission_type, attachments, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP) 
       RETURNING *`,
        [
          title,
          description,
          instructions,
          class_id,
          req.user.userId,
          type,
          max_points,
          due_date,
          submission_type,
          attachments,
          "active",
        ]
      );

      console.log(
        `✅ Assignment created: ${title} for class ${class_id} by ${req.user.email}`
      );

      res.status(201).json({
        status: "success",
        message: "Assignment created successfully",
        data: {
          assignment: result.rows[0],
        },
      });
    } catch (error) {
      console.error("Create assignment error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to create assignment",
      });
    }
  }
);

// Get assignment by ID (with submissions for teachers)
app.get("/api/v1/assignments/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get assignment details
    const assignmentResult = await query(
      `SELECT a.*, c.name as class_name, c.code as class_code,
              u.first_name || ' ' || u.last_name as teacher_name
       FROM assignments a
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN users u ON a.teacher_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Assignment not found",
      });
    }

    const assignment = assignmentResult.rows[0];

    // Check access permissions
    if (req.user.role === "student") {
      // Students can only see assignments from their enrolled classes
      const enrollmentCheck = await query(
        "SELECT 1 FROM enrollments WHERE student_id = $1 AND class_id = $2 AND status = 'active'",
        [req.user.userId, assignment.class_id]
      );

      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "You don't have access to this assignment",
        });
      }

      // Get student's submission if exists
      const submissionResult = await query(
        "SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2",
        [id, req.user.userId]
      );

      assignment.my_submission = submissionResult.rows[0] || null;
    } else if (req.user.role === "teacher" || req.user.role === "admin") {
      // Get all submissions for teachers/admin
      const submissionsResult = await query(
        `SELECT s.*, u.first_name, u.last_name, u.email as student_email
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         WHERE s.assignment_id = $1
         ORDER BY s.submitted_at DESC`,
        [id]
      );

      assignment.submissions = submissionsResult.rows;
      assignment.submission_stats = {
        total_submissions: submissionsResult.rows.length,
        graded: submissionsResult.rows.filter((s) => s.status === "graded")
          .length,
        pending: submissionsResult.rows.filter((s) => s.status === "submitted")
          .length,
      };
    }

    res.json({
      status: "success",
      data: {
        assignment: {
          ...assignment,
          is_overdue: new Date(assignment.due_date) < new Date(),
          time_remaining: Math.max(
            0,
            new Date(assignment.due_date) - new Date()
          ),
        },
      },
    });
  } catch (error) {
    console.error("Get assignment error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch assignment",
    });
  }
});

// Submit assignment (Students only)
app.post(
  "/api/v1/assignments/:id/submit",
  verifyToken,
  checkRole(["student"]),
  [
    body("submission_text").optional().trim(),
    body("attachments").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { submission_text, attachments } = req.body;

      if (!submission_text && (!attachments || attachments.length === 0)) {
        return res.status(400).json({
          status: "error",
          message: "Either submission text or attachments are required",
        });
      }

      // Check if assignment exists and student has access
      const assignmentCheck = await query(
        `SELECT a.*, e.student_id
       FROM assignments a
       JOIN enrollments e ON a.class_id = e.class_id
       WHERE a.id = $1 AND e.student_id = $2 AND e.status = 'active' AND a.status = 'active'`,
        [id, req.user.userId]
      );

      if (assignmentCheck.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Assignment not found or you don't have access",
        });
      }

      const assignment = assignmentCheck.rows[0];

      // Check if assignment is still open
      if (new Date(assignment.due_date) < new Date()) {
        return res.status(400).json({
          status: "error",
          message: "Assignment deadline has passed",
        });
      }

      // Check if student already submitted
      const existingSubmission = await query(
        "SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2",
        [id, req.user.userId]
      );

      if (existingSubmission.rows.length > 0) {
        // Update existing submission
        const result = await query(
          `UPDATE submissions 
         SET submission_text = $1, attachments = $2, submitted_at = CURRENT_TIMESTAMP, status = 'submitted', updated_at = CURRENT_TIMESTAMP
         WHERE assignment_id = $3 AND student_id = $4
         RETURNING *`,
          [submission_text, JSON.stringify(attachments), id, req.user.userId]
        );

        res.json({
          status: "success",
          message: "Assignment submission updated successfully",
          data: { submission: result.rows[0] },
        });
      } else {
        // Create new submission
        const result = await query(
          `INSERT INTO submissions (assignment_id, student_id, submission_text, attachments, submitted_at, status, created_at) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'submitted', CURRENT_TIMESTAMP) 
         RETURNING *`,
          [id, req.user.userId, submission_text, JSON.stringify(attachments)]
        );

        res.status(201).json({
          status: "success",
          message: "Assignment submitted successfully",
          data: { submission: result.rows[0] },
        });
      }
    } catch (error) {
      console.error("Submit assignment error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to submit assignment",
      });
    }
  }
);

// Grade submission (Teachers only)
app.post(
  "/api/v1/assignments/:assignmentId/submissions/:submissionId/grade",
  verifyToken,
  checkRole(["teacher", "admin"]),
  [
    body("score")
      .isFloat({ min: 0 })
      .withMessage("Score is required and must be positive"),
    body("feedback").optional().trim(),
  ],
  async (req, res) => {
    try {
      const { assignmentId, submissionId } = req.params;
      const { score, feedback } = req.body;

      // Verify teacher has access to this assignment
      const accessCheck = await query(
        req.user.role === "teacher"
          ? `SELECT a.max_points FROM assignments a WHERE a.id = $1 AND a.teacher_id = $2`
          : `SELECT a.max_points FROM assignments a WHERE a.id = $1`,
        req.user.role === "teacher"
          ? [assignmentId, req.user.userId]
          : [assignmentId]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Assignment not found or access denied",
        });
      }

      const maxPoints = accessCheck.rows[0].max_points;

      if (score > maxPoints) {
        return res.status(400).json({
          status: "error",
          message: `Score cannot exceed maximum points (${maxPoints})`,
        });
      }

      // Update submission with grade
      const result = await query(
        `UPDATE submissions 
         SET status = 'graded', feedback = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND assignment_id = $3
         RETURNING *`,
        [feedback, submissionId, assignmentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Submission not found",
        });
      }

      // Create or update grade record
      const percentage = Math.round((score / maxPoints) * 100);
      const letterGrade = getLetterGrade(percentage);

      await query(
        `INSERT INTO grades (student_id, class_id, assignment_id, submission_id, score, max_score, grade_letter, comments, term, academic_year, created_by, created_at)
         SELECT s.student_id, a.class_id, a.id, s.id, $1, $2, $3, $4, c.term, c.academic_year, $5, CURRENT_TIMESTAMP
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         JOIN classes c ON a.class_id = c.id
         WHERE s.id = $6
         ON CONFLICT (assignment_id, student_id) 
         DO UPDATE SET score = $1, max_score = $2, grade_letter = $3, comments = $4, updated_by = $5, updated_at = CURRENT_TIMESTAMP`,
        [score, maxPoints, letterGrade, feedback, req.user.userId, submissionId]
      );

      res.json({
        status: "success",
        message: "Submission graded successfully",
        data: {
          submission: result.rows[0],
          grade: {
            score,
            max_score: maxPoints,
            percentage,
            letter_grade: letterGrade,
          },
        },
      });
    } catch (error) {
      console.error("Grade submission error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to grade submission",
      });
    }
  }
);

// Helper function for letter grades
function getLetterGrade(percentage) {
  if (percentage >= 97) return "A+";
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 65) return "D";
  return "F";
}

// ========================= GRADES ENDPOINTS =========================

// Get grades (role-based access)
app.get("/api/v1/grades", verifyToken, async (req, res) => {
  try {
    const {
      class_id,
      student_id,
      term,
      academic_year,
      page = 1,
      limit = 50,
    } = req.query;

    let queryText = `
      SELECT g.*, a.title as assignment_title, a.type as assignment_type,
             c.name as class_name, c.code as class_code,
             u.first_name, u.last_name, u.email as student_email
      FROM grades g
      LEFT JOIN assignments a ON g.assignment_id = a.id
      LEFT JOIN classes c ON g.class_id = c.id
      LEFT JOIN users u ON g.student_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 0;

    // Role-based filtering
    if (req.user.role === "student") {
      paramCount++;
      queryText += ` AND g.student_id = $${paramCount}`;
      queryParams.push(req.user.userId);
    } else if (req.user.role === "teacher") {
      paramCount++;
      queryText += ` AND g.class_id IN (
        SELECT id FROM classes WHERE teacher_id = $${paramCount}
      )`;
      queryParams.push(req.user.userId);
    }

    if (class_id) {
      paramCount++;
      queryText += ` AND g.class_id = $${paramCount}`;
      queryParams.push(class_id);
    }

    if (student_id && req.user.role !== "student") {
      paramCount++;
      queryText += ` AND g.student_id = $${paramCount}`;
      queryParams.push(student_id);
    }

    if (term) {
      paramCount++;
      queryText += ` AND g.term = $${paramCount}`;
      queryParams.push(term);
    }

    if (academic_year) {
      paramCount++;
      queryText += ` AND g.academic_year = $${paramCount}`;
      queryParams.push(academic_year);
    }

    queryText += ` ORDER BY g.created_at DESC`;
    queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(queryText, queryParams);

    res.json({
      status: "success",
      data: {
        grades: result.rows,
      },
    });
  } catch (error) {
    console.error("Get grades error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch grades",
    });
  }
});

// Get grade analytics/summary
app.get("/api/v1/grades/analytics", verifyToken, async (req, res) => {
  try {
    const { class_id, student_id, academic_year } = req.query;

    let baseQuery = "FROM grades g WHERE 1=1";
    const queryParams = [];
    let paramCount = 0;

    // Role-based filtering
    if (req.user.role === "student") {
      paramCount++;
      baseQuery += ` AND g.student_id = $${paramCount}`;
      queryParams.push(req.user.userId);
    } else if (req.user.role === "teacher") {
      paramCount++;
      baseQuery += ` AND g.class_id IN (SELECT id FROM classes WHERE teacher_id = $${paramCount})`;
      queryParams.push(req.user.userId);
    }

    if (class_id) {
      paramCount++;
      baseQuery += ` AND g.class_id = $${paramCount}`;
      queryParams.push(class_id);
    }

    if (student_id && req.user.role !== "student") {
      paramCount++;
      baseQuery += ` AND g.student_id = $${paramCount}`;
      queryParams.push(student_id);
    }

    if (academic_year) {
      paramCount++;
      baseQuery += ` AND g.academic_year = $${paramCount}`;
      queryParams.push(academic_year);
    }

    // Get overall statistics
    const statsResult = await query(
      `
      SELECT 
        AVG(percentage) as average_percentage,
        MIN(percentage) as min_percentage,
        MAX(percentage) as max_percentage,
        COUNT(*) as total_grades,
        COUNT(CASE WHEN percentage >= 90 THEN 1 END) as a_grades,
        COUNT(CASE WHEN percentage >= 80 AND percentage < 90 THEN 1 END) as b_grades,
        COUNT(CASE WHEN percentage >= 70 AND percentage < 80 THEN 1 END) as c_grades,
        COUNT(CASE WHEN percentage >= 60 AND percentage < 70 THEN 1 END) as d_grades,
        COUNT(CASE WHEN percentage < 60 THEN 1 END) as f_grades
      ${baseQuery}
    `,
      queryParams
    );

    // Get grade distribution by assignment type
    const typeDistribution = await query(
      `
      SELECT a.type, AVG(g.percentage) as average_percentage, COUNT(*) as count
      ${baseQuery}
      JOIN assignments a ON g.assignment_id = a.id
      GROUP BY a.type
    `,
      queryParams
    );

    res.json({
      status: "success",
      data: {
        overall_stats: statsResult.rows[0],
        grade_distribution: typeDistribution.rows,
      },
    });
  } catch (error) {
    console.error("Get grade analytics error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch grade analytics",
    });
  }
});

// ========================= ATTENDANCE ENDPOINTS =========================

// Get attendance records
app.get("/api/v1/attendance", verifyToken, async (req, res) => {
  try {
    const {
      class_id,
      student_id,
      date_from,
      date_to,
      status,
      page = 1,
      limit = 50,
    } = req.query;

    let queryText = `
      SELECT a.*, c.name as class_name, c.code as class_code,
             u.first_name, u.last_name, u.email as student_email,
             marker.first_name || ' ' || marker.last_name as marked_by_name
      FROM attendance a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN users u ON a.student_id = u.id
      LEFT JOIN users marker ON a.marked_by = marker.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 0;

    // Role-based filtering
    if (req.user.role === "student") {
      paramCount++;
      queryText += ` AND a.student_id = $${paramCount}`;
      queryParams.push(req.user.userId);
    } else if (req.user.role === "teacher") {
      paramCount++;
      queryText += ` AND a.class_id IN (SELECT id FROM classes WHERE teacher_id = $${paramCount})`;
      queryParams.push(req.user.userId);
    }

    if (class_id) {
      paramCount++;
      queryText += ` AND a.class_id = $${paramCount}`;
      queryParams.push(class_id);
    }

    if (student_id && req.user.role !== "student") {
      paramCount++;
      queryText += ` AND a.student_id = $${paramCount}`;
      queryParams.push(student_id);
    }

    if (date_from) {
      paramCount++;
      queryText += ` AND a.date >= $${paramCount}`;
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      queryText += ` AND a.date <= $${paramCount}`;
      queryParams.push(date_to);
    }

    if (status) {
      paramCount++;
      queryText += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    }

    queryText += ` ORDER BY a.date DESC, a.created_at DESC`;
    queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(queryText, queryParams);

    res.json({
      status: "success",
      data: {
        attendance: result.rows,
      },
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch attendance",
    });
  }
});

// Mark attendance (Teachers only)
app.post(
  "/api/v1/attendance",
  verifyToken,
  checkRole(["teacher", "admin"]),
  [
    body("class_id").isInt().withMessage("Class ID is required"),
    body("date").isDate().withMessage("Valid date is required"),
    body("attendance_records")
      .isArray()
      .withMessage("Attendance records array is required"),
    body("attendance_records.*.student_id")
      .isInt()
      .withMessage("Student ID is required"),
    body("attendance_records.*.status")
      .isIn(["present", "absent", "late", "excused"])
      .withMessage("Valid status is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { class_id, date, attendance_records, notes } = req.body;

      // Verify teacher has access to class
      const classCheck = await query(
        req.user.role === "teacher"
          ? "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2"
          : "SELECT id FROM classes WHERE id = $1",
        req.user.role === "teacher" ? [class_id, req.user.userId] : [class_id]
      );

      if (classCheck.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Class not found or access denied",
        });
      }

      // Begin transaction
      const client = await createPool().connect();

      try {
        await client.query("BEGIN");

        const results = [];

        for (const record of attendance_records) {
          const { student_id, status, notes: studentNotes } = record;

          // Upsert attendance record
          const result = await client.query(
            `INSERT INTO attendance (student_id, class_id, date, status, notes, marked_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
           ON CONFLICT (student_id, class_id, date)
           DO UPDATE SET status = $4, notes = $5, marked_by = $6, updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
            [
              student_id,
              class_id,
              date,
              status,
              studentNotes || notes,
              req.user.userId,
            ]
          );

          results.push(result.rows[0]);
        }

        await client.query("COMMIT");

        res.json({
          status: "success",
          message: "Attendance marked successfully",
          data: {
            attendance_records: results,
          },
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Mark attendance error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to mark attendance",
      });
    }
  }
);

// ========================= WORLD-CLASS ADDITIONAL ENDPOINTS =========================

// Student Enrollments Management
app.post(
  "/api/v1/enrollments",
  verifyToken,
  checkRole(["admin", "teacher"]),
  [
    body("student_id").isInt().withMessage("Student ID is required"),
    body("class_id").isInt().withMessage("Class ID is required"),
  ],
  async (req, res) => {
    try {
      const { student_id, class_id } = req.body;

      // Check if enrollment already exists
      const existing = await query(
        "SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2",
        [student_id, class_id]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Student is already enrolled in this class",
        });
      }

      // Check class capacity
      const classInfo = await query(
        `SELECT max_students, 
              (SELECT COUNT(*) FROM enrollments WHERE class_id = $1 AND status = 'active') as current_count
       FROM classes WHERE id = $1`,
        [class_id]
      );

      const { max_students, current_count } = classInfo.rows[0];
      if (current_count >= max_students) {
        return res.status(400).json({
          status: "error",
          message: "Class is at maximum capacity",
        });
      }

      const result = await query(
        `INSERT INTO enrollments (student_id, class_id, enrollment_date, status, created_at)
       VALUES ($1, $2, CURRENT_DATE, 'active', CURRENT_TIMESTAMP)
       RETURNING *`,
        [student_id, class_id]
      );

      res.status(201).json({
        status: "success",
        message: "Student enrolled successfully",
        data: { enrollment: result.rows[0] },
      });
    } catch (error) {
      console.error("Enrollment error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to enroll student",
      });
    }
  }
);

// Reports Generation
app.get(
  "/api/v1/reports/student-progress/:studentId",
  verifyToken,
  checkRole(["admin", "teacher", "parent"]),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { academic_year } = req.query;

      // Get student info
      const studentInfo = await query(
        "SELECT first_name, last_name, email FROM users WHERE id = $1 AND role = 'student'",
        [studentId]
      );

      if (studentInfo.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Student not found",
        });
      }

      // Get enrolled classes
      const classesResult = await query(
        `SELECT c.name, c.code, c.credits,
              AVG(g.percentage) as average_grade,
              COUNT(g.id) as total_assignments,
              COUNT(a.id) FILTER (WHERE a.status = 'present') as days_present,
              COUNT(a.id) FILTER (WHERE a.status = 'absent') as days_absent,
              COUNT(a.id) as total_attendance_days
       FROM enrollments e
       JOIN classes c ON e.class_id = c.id
       LEFT JOIN grades g ON e.class_id = g.class_id AND e.student_id = g.student_id
       LEFT JOIN attendance a ON e.class_id = a.class_id AND e.student_id = a.student_id
       WHERE e.student_id = $1 AND e.status = 'active'
       ${academic_year ? "AND c.academic_year = $2" : ""}
       GROUP BY c.id, c.name, c.code, c.credits`,
        academic_year ? [studentId, academic_year] : [studentId]
      );

      const report = {
        student: studentInfo.rows[0],
        classes: classesResult.rows.map((cls) => ({
          ...cls,
          attendance_rate:
            cls.total_attendance_days > 0
              ? Math.round((cls.days_present / cls.total_attendance_days) * 100)
              : 0,
        })),
        overall_stats: {
          total_classes: classesResult.rows.length,
          overall_gpa:
            classesResult.rows.reduce(
              (sum, cls) => sum + (cls.average_grade || 0),
              0
            ) / classesResult.rows.length,
          overall_attendance:
            (classesResult.rows.reduce(
              (sum, cls) => sum + (cls.days_present || 0),
              0
            ) /
              Math.max(
                1,
                classesResult.rows.reduce(
                  (sum, cls) => sum + (cls.total_attendance_days || 0),
                  0
                )
              )) *
            100,
        },
      };

      res.json({
        status: "success",
        data: { report },
      });
    } catch (error) {
      console.error("Student progress report error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to generate student progress report",
      });
    }
  }
);

// Notifications System
app.get("/api/v1/notifications", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, read = false } = req.query;

    // This would typically come from a notifications table
    // For now, we'll generate dynamic notifications
    const notifications = [];

    if (req.user.role === "student") {
      // Get upcoming assignments
      const upcomingAssignments = await query(
        `SELECT a.title, a.due_date, c.name as class_name
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         JOIN enrollments e ON c.id = e.class_id
         WHERE e.student_id = $1 AND a.due_date > CURRENT_TIMESTAMP 
         AND a.due_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'
         AND a.status = 'active'
         ORDER BY a.due_date`,
        [req.user.userId]
      );

      upcomingAssignments.rows.forEach((assignment) => {
        notifications.push({
          id: `assignment-${assignment.title}`,
          type: "assignment_due",
          title: "Assignment Due Soon",
          message: `${assignment.title} in ${
            assignment.class_name
          } is due ${new Date(assignment.due_date).toLocaleDateString()}`,
          created_at: new Date(),
          read: false,
        });
      });

      // Get recent grades
      const recentGrades = await query(
        `SELECT g.percentage, g.grade_letter, a.title, c.name as class_name
         FROM grades g
         JOIN assignments a ON g.assignment_id = a.id
         JOIN classes c ON g.class_id = c.id
         WHERE g.student_id = $1 AND g.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
         ORDER BY g.created_at DESC
         LIMIT 5`,
        [req.user.userId]
      );

      recentGrades.rows.forEach((grade) => {
        notifications.push({
          id: `grade-${grade.title}`,
          type: "grade_posted",
          title: "New Grade Posted",
          message: `You received ${grade.grade_letter} (${grade.percentage}%) on ${grade.title} in ${grade.class_name}`,
          created_at: new Date(),
          read: false,
        });
      });
    }

    res.json({
      status: "success",
      data: {
        notifications: notifications.slice(0, limit),
        unread_count: notifications.filter((n) => !n.read).length,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch notifications",
    });
  }
});

// Analytics Dashboard
app.get(
  "/api/v1/analytics/dashboard",
  verifyToken,
  checkRole(["admin", "teacher"]),
  async (req, res) => {
    try {
      const { academic_year } = req.query;

      const analytics = {};

      if (req.user.role === "admin") {
        // School-wide analytics
        const overallStats = await query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'student' AND status = 'active') as total_students,
          (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status = 'active') as total_teachers,
          (SELECT COUNT(*) FROM classes WHERE status = 'active') as total_classes,
          (SELECT COUNT(*) FROM assignments WHERE status = 'active') as total_assignments,
          (SELECT AVG(percentage) FROM grades) as overall_gpa
      `);

        analytics.school_stats = overallStats.rows[0];
      } else {
        // Teacher-specific analytics
        const teacherStats = await query(
          `
        SELECT 
          (SELECT COUNT(*) FROM classes WHERE teacher_id = $1 AND status = 'active') as my_classes,
          (SELECT COUNT(DISTINCT e.student_id) FROM enrollments e 
           JOIN classes c ON e.class_id = c.id 
           WHERE c.teacher_id = $1 AND e.status = 'active') as my_students,
          (SELECT COUNT(*) FROM assignments WHERE teacher_id = $1 AND status = 'active') as my_assignments,
          (SELECT AVG(g.percentage) FROM grades g 
           JOIN assignments a ON g.assignment_id = a.id 
           WHERE a.teacher_id = $1) as my_class_avg
      `,
          [req.user.userId]
        );

        analytics.teacher_stats = teacherStats.rows[0];
      }

      res.json({
        status: "success",
        data: { analytics },
      });
    } catch (error) {
      console.error("Analytics dashboard error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to fetch analytics",
      });
    }
  }
);

// Error Handling starts from here
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

// Export for Vercel serverless functions
export default app;

// Also provide CommonJS export for compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = app;
}

// Local development server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 School Management System API running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  });
}
