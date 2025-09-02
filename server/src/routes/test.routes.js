// server/src/routes/test.routes.js - Logger-Free Version
const express = require("express");
const router = express.Router();

// Import email service with fallback
let emailService;
try {
  emailService = require("../services/email.service");
} catch (error) {
  console.warn("Could not import email service for testing");
  emailService = null;
}

// Helper function for query params
const getStringParam = (param, defaultValue = "") => {
  if (typeof param === "string") return param;
  if (Array.isArray(param)) return param[0] || defaultValue;
  return defaultValue;
};

// Simple logging functions to replace logger
const log = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, Object.keys(meta).length > 0 ? meta : "");
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, Object.keys(meta).length > 0 ? meta : "");
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, Object.keys(meta).length > 0 ? meta : "");
  },
  debug: (message, meta = {}) => {
    console.log(`[DEBUG] ${message}`, Object.keys(meta).length > 0 ? meta : "");
  },
};

/**
 * DATABASE TESTING ENDPOINTS
 */

// Test database connection
router.get("/db-connection", async (req, res) => {
  try {
    const { pool } = req.app.locals;

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Database pool not available",
        message: "PostgreSQL connection not configured",
      });
    }

    // Test simple query
    const result = await pool.query("SELECT NOW() as current_time, version() as db_version");

    return res.json({
      success: true,
      message: "Database connection successful",
      data: result.rows[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Database connection test failed:", { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Database connection failed",
    });
  }
});

// Test simple user insert
router.post("/simple-insert", async (req, res) => {
  try {
    const { pool } = req.app.locals;

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Database pool not available",
      });
    }

    // Test data
    const testData = {
      first_name: "Test",
      last_name: "User",
      email: `test${Date.now()}@example.com`,
      username: `test.user.${Date.now()}`,
      password_hash: "test_hash_123",
      role: "student",
    };

    // Insert test user
    const query = `
      INSERT INTO users (first_name, last_name, email, username, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, first_name, last_name, role, created_at
    `;

    const values = [
      testData.first_name,
      testData.last_name,
      testData.email,
      testData.username,
      testData.password_hash,
      testData.role,
    ];

    const result = await pool.query(query, values);

    log.info("Test user inserted successfully", { userId: result.rows[0].id });

    return res.status(201).json({
      success: true,
      message: "Test user inserted successfully",
      user: result.rows[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Test insert error:", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Test insert failed",
      error: error.message,
      details: error.detail || "No additional details",
    });
  }
});

// Get all users (for testing)
router.get("/users", async (req, res) => {
  try {
    const { pool } = req.app.locals;

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Database pool not available",
      });
    }

    const result = await pool.query(`
      SELECT id, username, email, first_name, last_name, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    return res.json({
      success: true,
      message: `Found ${result.rows.length} users`,
      users: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    log.error("Get users test failed:", { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to fetch users",
    });
  }
});

/**
 * EMAIL TESTING ENDPOINTS
 */

// Test email service - GET endpoint
router.get("/email", async (req, res) => {
  try {
    if (!emailService) {
      return res.status(500).json({
        success: false,
        error: "Email service not available",
        message: "Email service could not be loaded",
      });
    }

    const to = getStringParam(req.query.to);

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter "to" is required',
        usage: "GET /api/test/email?to=your-email@example.com",
      });
    }

    log.info("Testing email service", { to });

    // Get email service status
    const serviceStatus = emailService.getStatus();
    log.info("Email service status:", serviceStatus);

    // Send test email
    const result = await emailService.sendTestEmail(to);

    log.info("Test email result:", result);

    return res.json({
      success: result.success,
      message: result.success ? "Test email sent successfully!" : "Test email failed",
      emailService: serviceStatus,
      emailResult: result,
      instructions: result.success
        ? `Check the inbox for ${to} for the test email.`
        : "Email sending failed. Check the error details above.",
    });
  } catch (error) {
    log.error("Test email endpoint error:", { error: error.message });
    return res.status(500).json({
      success: false,
      error: "Internal server error during email test",
      details: error.message,
      emailServiceStatus: emailService?.getStatus() || "Service unavailable",
    });
  }
});

// Test email service - POST endpoint
router.post("/email", async (req, res) => {
  try {
    if (!emailService) {
      return res.status(500).json({
        success: false,
        error: "Email service not available",
      });
    }

    const { to, subject, message } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email "to" is required in request body',
      });
    }

    log.info("Testing custom email", { to, subject });

    // Send custom test email
    const result = await emailService.sendEmail({
      to: to,
      subject: subject || "Custom Test Email - School Management System",
      text: message || "This is a custom test email from your School Management System.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Custom Test Email</h2>
          <p>${message || "This is a custom test email from your School Management System."}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p style="color: #28a745;">Email service is working!</p>
        </div>
      `,
    });

    return res.json({
      success: result.success,
      message: result.success ? "Custom email sent successfully!" : "Custom email failed",
      emailResult: result,
      emailService: emailService.getStatus(),
    });
  } catch (error) {
    log.error("Custom test email error:", { error: error.message });
    return res.status(500).json({
      success: false,
      error: "Internal server error during custom email test",
      details: error.message,
    });
  }
});

// Test welcome email
router.post("/email/welcome", async (req, res) => {
  try {
    if (!emailService) {
      return res.status(500).json({
        success: false,
        error: "Email service not available",
      });
    }

    const { to, name = "Test User", username = "testuser", role = "student" } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email "to" is required in request body',
      });
    }

    log.info("Testing welcome email", { to, name, role });

    // Send welcome email
    const result = await emailService.sendWelcomeEmail(
      {
        name,
        username,
        role,
      },
      to
    );

    return res.json({
      success: result.success,
      message: result.success ? "Welcome email sent successfully!" : "Welcome email failed",
      emailResult: result,
      emailService: emailService.getStatus(),
    });
  } catch (error) {
    log.error("Welcome email test error:", { error: error.message });
    return res.status(500).json({
      success: false,
      error: "Internal server error during welcome email test",
      details: error.message,
    });
  }
});

// Get email service status
router.get("/email/status", (req, res) => {
  try {
    if (!emailService) {
      return res.json({
        available: false,
        error: "Email service not loaded",
        configured: false,
        mode: "unavailable",
      });
    }

    const status = emailService.getStatus();

    return res.json({
      available: true,
      ...status,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasBrevoKey: !!process.env.BREVO_API_KEY,
        brevoKeyFormat: process.env.BREVO_API_KEY
          ? process.env.BREVO_API_KEY.startsWith("xkeysib-")
            ? "Valid"
            : "Invalid"
          : "Missing",
      },
    });
  } catch (error) {
    log.error("Email status check error:", { error: error.message });
    return res.status(500).json({
      available: false,
      error: error.message,
      configured: false,
    });
  }
});

/**
 * SYSTEM TESTING ENDPOINTS
 */

// Environment variables check
router.get("/env", (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || "not-set",
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "not-set",
    BREVO_API_KEY: process.env.BREVO_API_KEY
      ? `set (${process.env.BREVO_API_KEY.substring(0, 8)}...)`
      : "not-set",
    PORT: process.env.PORT || "not-set",
    VERCEL: process.env.VERCEL ? "true" : "false",
  };

  return res.json({
    success: true,
    message: "Environment variables check",
    environment: envVars,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      services: {},
    };

    // Check database
    try {
      const { pool } = req.app.locals;
      if (pool) {
        await pool.query("SELECT 1");
        health.services.database = "connected";
      } else {
        health.services.database = "not-configured";
      }
    } catch (error) {
      health.services.database = "error";
      health.services.databaseError = error.message;
    }

    // Check email service
    try {
      if (emailService) {
        const emailStatus = emailService.getStatus();
        health.services.email = emailStatus.configured ? "configured" : "not-configured";
        health.services.emailMode = emailStatus.mode;
      } else {
        health.services.email = "not-available";
      }
    } catch (error) {
      health.services.email = "error";
      health.services.emailError = error.message;
    }

    return res.json(health);
  } catch (error) {
    log.error("Health check error:", { error: error.message });
    return res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
