// server/src/routes/test-email.js - TypeScript Fixed Version
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
 * Test email endpoint to verify Gmail SMTP is working
 * GET /api/v1/test-email?to=email@example.com
 */
router.get("/", async (req, res) => {
  try {
    const to = getStringParam(req.query.to);

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter "to" is required. Usage: /test-email?to=email@example.com',
      });
    }

    logger.info("Testing email service for:", { to });

    // Get email service status first
    const serviceStatus = emailService.getStatus();
    logger.info("Email service status:", serviceStatus);

    // Send test email
    const result = await emailService.sendTestEmail(to);

    logger.info("Test email result:", result);

    // Return comprehensive response
    return res.json({
      success: result.success,
      message: result.success ? "Test email sent successfully!" : "Test email failed",
      emailService: {
        configured: serviceStatus.configured,
        mode: serviceStatus.mode,
        provider: serviceStatus.provider,
        gmailUser: serviceStatus.config.gmailUser,
      },
      emailResult: {
        messageId: result.messageId,
        mode: result.mode,
        provider: result.provider,
        error: result.error,
      },
      instructions: result.success
        ? `Check the inbox for ${to} for the test email.`
        : "Email sending failed. Check the error details above.",
    });
  } catch (error) {
    logger.error("Test email endpoint error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error during email test",
      details: error.message,
      emailServiceStatus: emailService.getStatus(),
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
      });
    }

    logger.info("Testing password reset email for:", { to, name });

    // Create test reset link
    const resetLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=test-token-123`;

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
      message: result.success ? "Password reset test email sent!" : "Password reset test failed",
      emailService: emailService.getStatus(),
      emailResult: result,
      resetLink: resetLink,
      instructions: result.success
        ? `Check ${to} for the password reset test email.`
        : "Password reset test failed. Check error details.",
    });
  } catch (error) {
    logger.error("Password reset test error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error during password reset test",
      details: error.message,
    });
  }
});

export default router;
