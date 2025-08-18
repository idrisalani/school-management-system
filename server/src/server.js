// server/src/server.js - Minimal Working Version
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

// Simple CORS - allow all for now
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

app.use(express.json({ limit: "10mb" }));

// PostgreSQL connection
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
  }
  return pool;
};

const query = async (text, params = []) => {
  const poolInstance = createPool();
  if (!poolInstance) throw new Error("Database not configured");
  const client = await poolInstance.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "School Management System API",
    status: "online",
    timestamp: new Date().toISOString(),
    version: "2.1.0",
  });
});

// Health check
app.get("/api/v1/health", async (req, res) => {
  try {
    let dbConnected = false;
    if (process.env.DATABASE_URL) {
      try {
        await query("SELECT NOW()");
        dbConnected = true;
      } catch (e) {
        console.error("DB test failed:", e.message);
      }
    }

    res.json({
      status: "success",
      message: "API is running",
      database: {
        configured: !!process.env.DATABASE_URL,
        connected: dbConnected,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error.message,
    });
  }
});

// SIMPLE Registration - Fixed for serverless
app.post(
  "/api/v1/auth/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name required"),
    body("lastName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Last name required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be 8+ characters"),
    body("role")
      .isIn(["student", "teacher", "parent"])
      .withMessage("Invalid role"),
  ],
  async (req, res) => {
    try {
      console.log("🚀 Registration attempt:", req.body.email);

      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, password, role } = req.body;

      // Create username and name
      // Create username and name with NULL protection
      const cleanFirstName = (firstName || "").toString().trim();
      const cleanLastName = (lastName || "").toString().trim();

      if (!cleanFirstName || !cleanLastName) {
        return res.status(400).json({
          status: "error",
          message: "First name and last name are required and cannot be empty",
        });
      }

      const username = `${cleanFirstName.toLowerCase()}.${cleanLastName.toLowerCase()}`;
      const fullName = `${cleanFirstName} ${cleanLastName}`;

      console.log("🔍 Generated values:", {
        username,
        fullName,
        length: fullName.length,
      });
      console.log("🔍 Creating user:", { username, email });

      // Check for existing user
      const existing = await query(
        "SELECT id FROM users WHERE email = $1 OR username = $2",
        [email.toLowerCase(), username]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Email or name combination already exists",
        });
      }

      // Hash password with FAST salt rounds for serverless
      console.log("🔐 Hashing password...");
      const saltRounds = 4; // FAST for serverless
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log("✅ Password hashed successfully");

      // Insert user
      // Insert user with guaranteed non-null name
      const safeName = `${firstName} ${lastName}`; // Direct concatenation
      console.log("🔍 About to insert:", {
        username,
        email: email.toLowerCase(),
        safeName,
      });

      const result = await query(
        `INSERT INTO users (username, email, password, name, first_name, last_name, role, is_verified, status, created_at) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) 
   RETURNING id, username, email, name, first_name, last_name, role, created_at`,
        [
          username,
          email.toLowerCase(),
          hashedPassword,
          safeName, // ← Guaranteed non-null
          firstName,
          lastName,
          role,
          false,
          "active",
        ]
      );

      const user = result.rows[0];
      console.log("✅ User created:", user.username);

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" }
      );

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
      res.status(500).json({
        status: "error",
        message: "Registration failed",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

export default app;

// Local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
