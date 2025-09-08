// server/src/routes/test-email.js - Minimal Brevo Version (preserving all original functionality)
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
 * Test email endpoint to verify Brevo service is working
 * GET /api/v1/test-email?to=email@example.com
 */
router.get("/", async (req, res) => {
  try {
    const to = getStringParam(req.query.to);

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter "to" is required. Usage: /test-email?to=email@example.com',
        example: "GET /api/v1/test-email?to=your.email@example.com",
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

    logger.info("Testing Brevo email service for:", { to });

    // Get email service status first
    const serviceStatus = emailService.getStatus();
    logger.info("Brevo email service status:", serviceStatus);

    // Send test email
    const result = await emailService.sendTestEmail(to);

    logger.info("Brevo test email result:", result);

    // Return comprehensive response with Brevo-specific info
    return res.json({
      success: result.success,
      message: result.success ? "Test email sent successfully via Brevo!" : "Test email failed",
      timestamp: new Date().toISOString(),
      emailService: {
        configured: serviceStatus.configured,
        mode: serviceStatus.mode,
        provider: serviceStatus.mode === "brevo" ? "Brevo API" : serviceStatus.mode,
        brevoApiKey: serviceStatus.brevoApiKeyPrefix,
        hasBrevoCredentials: serviceStatus.hasBrevoApiKey,
        initError: serviceStatus.initError,
      },
      emailResult: {
        messageId: result.messageId,
        mode: result.mode,
        provider: result.provider || "Brevo API",
        response: result.response,
        error: result.error,
      },
      instructions: result.success
        ? `✅ Check the inbox for ${to} for the test email. It may take a few minutes to arrive.`
        : `❌ Email sending failed. ${result.error || "Check Brevo credentials and configuration."}`,
      troubleshooting: !result.success
        ? {
            commonIssues: [
              "Brevo API key not generated or incorrect",
              "Brevo API key doesn't start with 'xkeysib-'",
              "BREVO_API_KEY not set or invalid",
              "Network connectivity issues or firewall blocking API calls",
            ],
            checkEnvironment: "Use GET /api/v1/test-email/env-test to verify configuration",
          }
        : undefined,
    });
  } catch (error) {
    logger.error("Brevo test email endpoint error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error during Brevo email test",
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
      message: result.success ? "Welcome test email sent via Brevo!" : "Welcome test email failed",
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
        ? "Password reset test email sent via Brevo!"
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
        ? "Email verification test sent via Brevo!"
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
 * Get Brevo service configuration and environment info
 * GET /api/v1/test-email/env-test
 */
router.get("/env-test", (req, res) => {
  const serviceStatus = emailService.getStatus();

  res.json({
    timestamp: new Date().toISOString(),
    emailService: {
      provider: "Brevo API",
      status: serviceStatus,
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || "false",
      CLIENT_URL: process.env.CLIENT_URL || "NOT_SET",
      SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "NOT_SET",
    },
    brevoConfig: {
      BREVO_API_KEY: process.env.BREVO_API_KEY
        ? `SET (${process.env.BREVO_API_KEY.substring(0, 10)}...)`
        : "NOT_SET",
      EMAIL_FROM: process.env.EMAIL_FROM || "NOT_SET",
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "NOT_SET",
    },
    validation: {
      hasRequiredCredentials: !!process.env.BREVO_API_KEY,
      brevoApiKeyValid: process.env.BREVO_API_KEY
        ? process.env.BREVO_API_KEY.startsWith("xkeysib-")
        : false,
      emailFromValid: process.env.EMAIL_FROM ? process.env.EMAIL_FROM.includes("@") : false,
    },
    instructions: {
      setup: [
        "1. Create account at https://brevo.com",
        "2. Go to Settings → SMTP & API → API Keys",
        "3. Generate an API key for 'School Management System'",
        "4. Set BREVO_API_KEY=xkeysib-xxxxxxxx...",
        "5. Set EMAIL_FROM=your-verified-sender@yourdomain.com",
        "6. Set EMAIL_FROM_NAME=School Management System",
        "7. Test with: GET /api/v1/test-email?to=your.email@example.com",
      ],
      troubleshooting: [
        "If authentication fails, check your API key starts with 'xkeysib-'",
        "Make sure your sender email is verified in Brevo dashboard",
        "Check your Brevo account quota and limits",
        "Verify BREVO_API_KEY is correctly set in environment variables",
      ],
    },
  });
});

/**
 * Brevo service health check
 * GET /api/v1/test-email/health
 */
router.get("/health", async (req, res) => {
  try {
    const serviceStatus = emailService.getStatus();
    const isHealthy = serviceStatus.configured && serviceStatus.hasBrevoApiKey;

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
      service: "Brevo Email Service",
      timestamp: new Date().toISOString(),
      checks: {
        configured: serviceStatus.configured,
        hasCredentials: serviceStatus.hasBrevoApiKey,
        mode: serviceStatus.mode,
        connection: connectionStatus,
      },
      details: serviceStatus,
      uptime: process.uptime(),
      message: isHealthy
        ? "Brevo email service is ready"
        : `Brevo email service is not properly configured: ${serviceStatus.initError}`,
    });
  } catch (error) {
    logger.error("Email service health check failed:", error);

    res.status(503).json({
      status: "error",
      service: "Brevo Email Service",
      timestamp: new Date().toISOString(),
      error: error.message,
      message: "Health check failed",
    });
  }
});

// Add this to your server/src/routes/test-email.js file
// Add this new endpoint to test email verification template

/**
 * Test email verification template specifically
 * POST /api/v1/test-email/verification (second implementation - keeping original structure)
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

    logger.info("Testing email verification template for:", { to, name, firstName });

    // Create test verification token and link
    const verificationToken = `verify-test-${Date.now()}`;
    const verificationLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;

    // Create verification email HTML template
    const subject = "📧 Verify Your Email - School Management System";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification Required</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            background-color: white;
            margin: 20px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .emoji-icon {
            font-size: 48px;
            margin-bottom: 20px;
            display: block;
          }
          .content { 
            padding: 40px 30px;
          }
          .button-container {
            text-align: center;
            margin: 40px 0;
          }
          .button { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white; 
            padding: 18px 36px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          }
          .info-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-left: 4px solid #0ea5e9;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .info-box h4 {
            color: #0c4a6e;
            margin: 0 0 15px 0;
            font-size: 18px;
          }
          .info-box ul {
            color: #075985;
            margin: 0;
            padding-left: 20px;
          }
          .info-box li {
            margin: 8px 0;
          }
          .link-backup {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #374151;
            border: 1px solid #d1d5db;
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 40px;
            color: #9ca3af;
            font-size: 14px;
          }
          .test-notice {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .test-notice strong {
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="emoji-icon">📧</span>
            <h1>Verify Your Email Address</h1>
          </div>
          <div class="content">
            <div class="test-notice">
              <strong>🧪 THIS IS A TEST EMAIL</strong><br>
              This verification link will not actually verify any accounts.
            </div>

            <p>Hello <strong>${firstName || name}</strong>,</p>
            
            <p>Welcome to School Management System! To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
            
            <div class="button-container">
              <a href="${verificationLink}" class="button">Verify My Email Address</a>
            </div>
            
            <div class="info-box">
              <h4>Why verify your email address?</h4>
              <ul>
                <li><strong>Account Security:</strong> Protect your account with password recovery</li>
                <li><strong>Important Updates:</strong> Receive notifications about grades and assignments</li>
                <li><strong>Full Access:</strong> Unlock all School Management System features</li>
                <li><strong>Communication:</strong> Connect with teachers, classmates, and parents</li>
              </ul>
            </div>
            
            <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
            <div class="link-backup">${verificationLink}</div>

            <div class="footer">
              <p><strong>⏰ This verification link expires in 24 hours.</strong></p>
              <p>If you didn't create this account, please ignore this email and no action is required.</p>
              <p>Need help? Contact our support team at <strong>${process.env.SUPPORT_EMAIL || "support@schoolms.com"}</strong></p>
              <p>Best regards,<br>The School Management Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Email Verification - School Management System

Hello ${firstName || name},

Welcome to School Management System! Please verify your email address to complete your registration and secure your account.

Verification Link: ${verificationLink}

Why verify your email address?
- Account Security: Protect your account with password recovery
- Important Updates: Receive notifications about grades and assignments  
- Full Access: Unlock all School Management System features
- Communication: Connect with teachers, classmates, and parents

This verification link expires in 24 hours.

If you didn't create this account, please ignore this email.

Need help? Contact us at ${process.env.SUPPORT_EMAIL || "idris.bin.muslih@outlook.com"}

Best regards,
The School Management Team

---
THIS IS A TEST EMAIL - This verification link will not actually verify any accounts.
    `;

    // Send the verification email
    const result = await emailService.sendEmail({
      to: to,
      subject: subject,
      html: html,
      text: text,
    });

    logger.info("Email verification test result:", result);

    return res.json({
      success: result.success,
      message: result.success
        ? "Email verification test sent via Brevo!"
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
        ? `✅ Check ${to} for the email verification test message. The email includes a professional template with your school branding.`
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

export default router;
