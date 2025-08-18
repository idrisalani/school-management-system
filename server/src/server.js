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
      console.log("🚀 RAW REQUEST BODY:", JSON.stringify(req.body));

      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ VALIDATION ERRORS:", errors.array());
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
          debug: "Validation step failed",
        });
      }

      const { firstName, lastName, email, password, role } = req.body;

      console.log("📝 EXTRACTED VALUES:", {
        firstName: `"${firstName}"`,
        lastName: `"${lastName}"`,
        email: `"${email}"`,
        role: `"${role}"`,
        firstNameType: typeof firstName,
        lastNameType: typeof lastName,
        firstNameLength: firstName ? firstName.length : "NULL",
        lastNameLength: lastName ? lastName.length : "NULL",
      });

      // Create values with extensive logging
      const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
      const fullName = `${firstName} ${lastName}`;

      console.log("🔧 GENERATED VALUES:", {
        username: `"${username}"`,
        fullName: `"${fullName}"`,
        fullNameLength: fullName.length,
        usernameLength: username.length,
      });

      // Check for existing user
      console.log("🔍 CHECKING FOR EXISTING USER...");
      const existing = await query(
        "SELECT id, email, username FROM users WHERE email = $1 OR username = $2",
        [email.toLowerCase(), username]
      );

      console.log("📊 EXISTING USER CHECK:", {
        found: existing.rows.length,
        existingEmails: existing.rows.map((r) => r.email),
        existingUsernames: existing.rows.map((r) => r.username),
      });

      if (existing.rows.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Email or username already exists",
          debug: "User already exists",
          existing: existing.rows[0],
        });
      }

      // Hash password
      console.log("🔐 STARTING PASSWORD HASH...");
      const startTime = Date.now();
      const saltRounds = 4;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const hashTime = Date.now() - startTime;
      console.log(
        `✅ PASSWORD HASHED in ${hashTime}ms, length: ${hashedPassword.length}`
      );

      // Prepare insert values with extreme logging
      const insertValues = [
        username, // $1
        email.toLowerCase(), // $2
        hashedPassword, // $3
        fullName, // $4 - THE PROBLEMATIC ONE
        firstName, // $5
        lastName, // $6
        role, // $7
        false, // $8
        "active", // $9
      ];

      console.log("📋 INSERT VALUES DEBUG:", {
        param1_username: `"${insertValues[0]}" (${typeof insertValues[0]})`,
        param2_email: `"${insertValues[1]}" (${typeof insertValues[1]})`,
        param3_password: `"${insertValues[2].substring(
          0,
          10
        )}..." (${typeof insertValues[2]})`,
        param4_name: `"${insertValues[3]}" (${typeof insertValues[3]}) LENGTH:${
          insertValues[3]?.length
        }`,
        param5_firstName: `"${insertValues[4]}" (${typeof insertValues[4]})`,
        param6_lastName: `"${insertValues[5]}" (${typeof insertValues[5]})`,
        param7_role: `"${insertValues[6]}" (${typeof insertValues[6]})`,
        param8_verified: `${insertValues[7]} (${typeof insertValues[7]})`,
        param9_status: `"${insertValues[8]}" (${typeof insertValues[8]})`,
      });

      // Check if any critical values are null/undefined
      const nullChecks = {
        username_null: insertValues[0] == null,
        email_null: insertValues[1] == null,
        password_null: insertValues[2] == null,
        name_null: insertValues[3] == null,
        firstName_null: insertValues[4] == null,
        lastName_null: insertValues[5] == null,
        role_null: insertValues[6] == null,
      };

      console.log("🚨 NULL CHECKS:", nullChecks);

      if (nullChecks.name_null) {
        return res.status(400).json({
          status: "error",
          message: "Name value is null before database insert",
          debug: "Pre-insert null check failed",
          nullChecks,
          originalInput: { firstName, lastName, email, role },
        });
      }

      // Execute insert
      console.log("💾 EXECUTING DATABASE INSERT...");
      const result = await query(
        `INSERT INTO users (username, email, password, name, first_name, last_name, role, is_verified, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) 
         RETURNING id, username, email, name, first_name, last_name, role, created_at`,
        insertValues
      );

      const user = result.rows[0];
      console.log("✅ USER CREATED SUCCESSFULLY:", {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      });

      // Generate token
      console.log("🎫 GENERATING JWT TOKEN...");
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" }
      );
      console.log("✅ TOKEN GENERATED");

      console.log("🎉 REGISTRATION COMPLETED SUCCESSFULLY");

      return res.status(201).json({
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
        debug: "Registration completed without errors",
      });
    } catch (error) {
      console.error("💥 REGISTRATION ERROR DETAILS:");
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
      console.error("Error code:", error.code);
      console.error("Error detail:", error.detail);
      console.error("Error constraint:", error.constraint);
      console.error("Full error:", error);

      return res.status(500).json({
        status: "error",
        message: "Registration failed",
        error: error.message,
        errorName: error.name,
        errorCode: error.code,
        errorDetail: error.detail,
        errorConstraint: error.constraint,
        debug: "Caught in registration catch block",
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
