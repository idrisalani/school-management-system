// server/src/routes/test-email.js - Gmail Version
import express from "express";
import emailService from "../services/email.service.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Helper function to safely extract string from query params
const getStringParam = (param, defaultValue = "") => {
  if (typeof param === "string") return param;
  if (Array.isArray(param)) return param[0] || defaultValue;
  return defaultValue;
};

/**
 * Test email endpoint to verify Gmail service is working
 * GET /api/v1/test-email?to=email@example.com
 */
router.get("/", async (req, res) => {
  try {
    const to = getStringParam(req.query.to);

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter "to" is required. Usage: /test-email?to=email@example.com',
        example: "GET /api/v1/test-email?to=your.email@gmail.com",
      });
    }

    // Basic email validation
    if (!to.includes("@") || to.length < 5) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address",
        provided: to,
      });
    }

    logger.info("Testing Gmail email service for:", { to });

    // Get email service status first
    const serviceStatus = emailService.getStatus();
    logger.info("Gmail email service status:", serviceStatus);

    // Send test email
    const result = await emailService.sendTestEmail(to);

    logger.info("Gmail test email result:", result);

    // Return comprehensive response with Gmail-specific info
    return res.json({
      success: result.success,
      message: result.success ? "Test email sent successfully via Gmail!" : "Test email failed",
      timestamp: new Date().toISOString(),
      emailService: {
        configured: serviceStatus.configured,
        mode: serviceStatus.mode,
        provider: serviceStatus.mode === "gmail" ? "Gmail SMTP" : serviceStatus.mode,
        gmailUser: serviceStatus.gmailUser,
        hasGmailCredentials: serviceStatus.hasGmailCredentials,
        initError: serviceStatus.initError,
      },
      emailResult: {
        messageId: result.messageId,
        mode: result.mode,
        provider: result.provider || "Gmail SMTP",
        response: result.response,
        error: result.error,
      },
      instructions: result.success
        ? `✅ Check the inbox for ${to} for the test email. It may take a few minutes to arrive.`
        : `❌ Email sending failed. ${result.error || "Check Gmail credentials and configuration."}`,
      troubleshooting: !result.success
        ? {
            commonIssues: [
              "Gmail App Password not generated or incorrect",
              "2-Factor Authentication not enabled on Gmail account",
              "GMAIL_USER not set to a valid @gmail.com address",
              "Firewall blocking SMTP connections (port 587/465)",
            ],
            checkEnvironment: "Use GET /api/v1/test-email/env-test to verify configuration",
          }
        : undefined,
    });
  } catch (error) {
    logger.error("Gmail test email endpoint error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error during Gmail email test",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      emailServiceStatus: emailService.getStatus(),
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Test welcome email specifically
 * POST /api/v1/test-email/welcome
 */
router.post("/welcome", async (req, res) => {
  try {
    const { to, name = "Test User", username = "testuser", role = "student" } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email "to" is required in request body',
        example: { to: "test@example.com", name: "John Doe", username: "johndoe", role: "student" },
      });
    }

    logger.info("Testing welcome email for:", { to, name, username, role });

    // Send welcome email with test data
    const result = await emailService.sendWelcomeEmail(
      {
        name,
        username,
        role,
      },
      to
    );

    logger.info("Welcome email test result:", result);

    return res.json({
      success: result.success,
      message: result.success ? "Welcome test email sent via Gmail!" : "Welcome test email failed",
      emailService: emailService.getStatus(),
      emailResult: result,
      testData: { name, username, role },
      instructions: result.success
        ? `✅ Check ${to} for the welcome email test message.`
        : `❌ Welcome email test failed: ${result.error}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Welcome email test error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error during welcome email test",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Test password reset email specifically
 * POST /api/v1/test-email/reset
 */
router.post("/reset", async (req, res) => {
  try {
    const { to, name = "Test User" } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email "to" is required in request body',
        example: { to: "test@example.com", name: "John Doe" },
      });
    }

    logger.info("Testing password reset email for:", { to, name });

    // Create test reset link with timestamp for uniqueness
    const resetToken = `test-token-${Date.now()}`;
    const resetLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // Send password reset email
    const result = await emailService.sendPasswordResetEmail(
      {
        resetLink,
        name,
      },
      to
    );

    logger.info("Password reset test result:", result);

    return res.json({
      success: result.success,
      message: result.success
        ? "Password reset test email sent via Gmail!"
        : "Password reset test failed",
      emailService: emailService.getStatus(),
      emailResult: result,
      testData: {
        resetLink: resetLink,
        name: name,
        tokenUsed: resetToken,
      },
      instructions: result.success
        ? `✅ Check ${to} for the password reset test email. The reset link is for testing only.`
        : `❌ Password reset test failed: ${result.error}`,
      timestamp: new Date().toISOString(),
      note: "This is a test reset link - it will not actually reset any passwords.",
    });
  } catch (error) {
    logger.error("Password reset test error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error during password reset test",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Test email verification email
 * POST /api/v1/test-email/verification
 */
router.post("/verification", async (req, res) => {
  try {
    const { to, name = "Test User", firstName = "Test" } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email "to" is required in request body',
        example: { to: "test@example.com", name: "John Doe", firstName: "John" },
      });
    }

    logger.info("Testing email verification for:", { to, name, firstName });

    // Create test verification link
    const verificationToken = `verify-token-${Date.now()}`;
    const verificationLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;

    // Send email using the template format expected by sendTemplate method
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 600;">📧 Email Verification Test</h1>
          </div>
          <p>Hi <strong>${firstName || name}</strong>,</p>
          <p>This is a test email verification message from your School Management System.</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              Test Verification Link
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px;">This is a test - the verification link will not actually verify any accounts.</p>
        </div>
      </div>
    `;

    const result = await emailService.sendEmail({
      to: to,
      subject: "📧 Email Verification Test - School Management System",
      html: emailHtml,
      text: `Hi ${firstName || name}, this is a test email verification from School Management System. Test link: ${verificationLink}`,
    });

    logger.info("Email verification test result:", result);

    return res.json({
      success: result.success,
      message: result.success
        ? "Email verification test sent via Gmail!"
        : "Email verification test failed",
      emailService: emailService.getStatus(),
      emailResult: result,
      testData: {
        verificationLink: verificationLink,
        name: name,
        firstName: firstName,
        tokenUsed: verificationToken,
      },
      instructions: result.success
        ? `✅ Check ${to} for the email verification test message.`
        : `❌ Email verification test failed: ${result.error}`,
      timestamp: new Date().toISOString(),
      note: "This is a test verification link - it will not actually verify any accounts.",
    });
  } catch (error) {
    logger.error("Email verification test error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error during email verification test",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get Gmail service configuration and environment info
 * GET /api/v1/test-email/env-test
 */
router.get("/env-test", (req, res) => {
  const serviceStatus = emailService.getStatus();

  res.json({
    timestamp: new Date().toISOString(),
    emailService: {
      provider: "Gmail SMTP",
      status: serviceStatus,
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || "false",
      CLIENT_URL: process.env.CLIENT_URL || "NOT_SET",
      SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "NOT_SET",
    },
    gmailConfig: {
      GMAIL_USER: process.env.GMAIL_USER ? `SET (${process.env.GMAIL_USER})` : "NOT_SET",
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD
        ? `SET (${process.env.GMAIL_APP_PASSWORD.length} chars, ends with: ...${process.env.GMAIL_APP_PASSWORD.slice(-4)})`
        : "NOT_SET",
      EMAIL_FROM: process.env.EMAIL_FROM || "NOT_SET",
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "NOT_SET",
    },
    validation: {
      hasRequiredCredentials: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      gmailUserValid: process.env.GMAIL_USER
        ? process.env.GMAIL_USER.includes("@gmail.com")
        : false,
      appPasswordValid: process.env.GMAIL_APP_PASSWORD
        ? process.env.GMAIL_APP_PASSWORD.length === 16
        : false,
    },
    instructions: {
      setup: [
        "1. Enable 2-Factor Authentication on your Gmail account",
        "2. Go to Google Account → Security → 2-Step Verification → App passwords",
        "3. Generate an App Password for 'Mail'",
        "4. Set GMAIL_USER=your.email@gmail.com",
        "5. Set GMAIL_APP_PASSWORD=your_16_character_password",
        "6. Test with: GET /api/v1/test-email?to=your.email@gmail.com",
      ],
      troubleshooting: [
        "If authentication fails, regenerate the App Password",
        "Make sure 2FA is enabled on your Gmail account",
        "Check that GMAIL_USER is a valid @gmail.com address",
        "Verify the App Password is exactly 16 characters",
      ],
    },
  });
});

/**
 * Gmail service health check
 * GET /api/v1/test-email/health
 */
router.get("/health", async (req, res) => {
  try {
    const serviceStatus = emailService.getStatus();
    const isHealthy = serviceStatus.configured && serviceStatus.hasGmailCredentials;

    // If configured, try to verify connection (non-blocking)
    let connectionStatus = "unknown";
    if (emailService.verifyConnection) {
      try {
        const connected = await emailService.verifyConnection();
        connectionStatus = connected ? "connected" : "failed";
      } catch (error) {
        connectionStatus = "error";
      }
    }

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "healthy" : "unhealthy",
      service: "Gmail Email Service",
      timestamp: new Date().toISOString(),
      checks: {
        configured: serviceStatus.configured,
        hasCredentials: serviceStatus.hasGmailCredentials,
        mode: serviceStatus.mode,
        connection: connectionStatus,
      },
      details: serviceStatus,
      uptime: process.uptime(),
      message: isHealthy
        ? "Gmail email service is ready"
        : `Gmail email service is not properly configured: ${serviceStatus.initError}`,
    });
  } catch (error) {
    logger.error("Email service health check failed:", error);

    res.status(503).json({
      status: "error",
      service: "Gmail Email Service",
      timestamp: new Date().toISOString(),
      error: error.message,
      message: "Health check failed",
    });
  }
});

export default router;
