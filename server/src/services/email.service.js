// @ts-nocheck

// server/src/services/email.service.js - Reconciled Email Service
import nodemailer from "nodemailer";
import logger from "../utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Email Service Class - Combines reliability with rich features
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.mode = "unknown"; // 'production', 'development', 'mock'
    this.config = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter with multiple fallback strategies
   */
  async initializeTransporter() {
    try {
      // Get configuration from multiple possible environment variable formats
      const config = this.getEmailConfiguration();
      this.config = config;

      // Strategy 1: Production SMTP (if fully configured)
      if (config.host && config.user && config.pass) {
        await this.initializeProductionSMTP(config);
        return;
      }

      // Strategy 2: Development mode (console logging)
      if (
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "dev"
      ) {
        this.initializeDevelopmentMode();
        return;
      }

      // Strategy 3: Mock mode (always works, logs instead of sending)
      this.initializeMockMode();
    } catch (error) {
      logger.error(
        "Email service initialization failed, falling back to mock mode:",
        error
      );
      this.initializeMockMode();
    }
  }

  /**
   * Get email configuration from environment variables (supports multiple formats)
   */
  getEmailConfiguration() {
    return {
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
      port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587"),
      secure: (process.env.SMTP_SECURE || process.env.EMAIL_SECURE) === "true",
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      from:
        process.env.EMAIL_FROM ||
        process.env.SMTP_FROM ||
        process.env.FROM_EMAIL,
      service: process.env.EMAIL_SERVICE || process.env.SMTP_SERVICE,
    };
  }

  /**
   * Initialize production SMTP transporter
   */
  async initializeProductionSMTP(config) {
    try {
      const transportConfig = {
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates in development
        },
      };

      // If service is specified (Gmail, Yahoo, etc.), use it
      if (config.service) {
        transportConfig.service = config.service;
        delete transportConfig.host;
        delete transportConfig.port;
      }

      this.transporter = nodemailer.createTransport(transportConfig);

      // Verify connection
      await this.transporter.verify();

      this.isConfigured = true;
      this.mode = "production";

      logger.info(
        "📧 Email service initialized successfully (Production SMTP)",
        {
          host: config.host || config.service,
          port: config.port,
          secure: config.secure,
          user: config.user?.substring(0, 3) + "***", // Mask email for security
        }
      );
    } catch (error) {
      logger.warn(
        "Production SMTP failed, falling back to development mode:",
        error.message
      );
      this.initializeDevelopmentMode();
    }
  }

  /**
   * Initialize development mode (console/stream transport)
   */
  initializeDevelopmentMode() {
    this.transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });

    this.isConfigured = true;
    this.mode = "development";

    logger.info(
      "📧 Email service initialized (Development Mode - Console Logging)"
    );
  }

  /**
   * Initialize mock mode (for when all else fails)
   */
  initializeMockMode() {
    // Create a proper mock transporter that matches nodemailer interface
    this.transporter = {
      sendMail: async (options) => {
        logger.info("📧 Mock Email Send:", {
          to: options.to,
          subject: options.subject,
          from: options.from,
          hasHtml: !!options.html,
          hasText: !!options.text,
          textPreview: options.text?.substring(0, 100) + "...",
        });

        // Return proper SentMessageInfo structure
        return {
          messageId: `mock-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          envelope: {
            from: options.from || "noreply@schoolms.com",
            to: Array.isArray(options.to) ? options.to : [options.to],
          },
          response: "250 Message queued as mock email",
          accepted: Array.isArray(options.to) ? options.to : [options.to],
          rejected: [],
          pending: [],
        };
      },
      verify: async () => true,
    };

    this.isConfigured = true;
    this.mode = "mock";

    logger.info("📧 Email service initialized (Mock Mode - Logging Only)");
  }

  /**
   * Send email with comprehensive error handling
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(options) {
    try {
      if (!this.isConfigured) {
        await this.initializeTransporter();
      }

      const { to, subject, text, html, from, replyTo, attachments, cc, bcc } =
        options;

      // Use configured default or fallback
      const fromAddress =
        from ||
        this.config?.from ||
        this.config?.user ||
        "noreply@schoolms.com";

      const mailOptions = {
        from: fromAddress,
        to: to,
        subject: subject,
        text: text,
        html: html,
        replyTo: replyTo,
        attachments: attachments,
        cc: cc,
        bcc: bcc,
      };

      logger.info(`📧 Sending email [${this.mode}]:`, {
        to: to,
        subject: subject,
        from: fromAddress,
        mode: this.mode,
      });

      const result = await this.transporter.sendMail(mailOptions);

      logger.info("📧 Email sent successfully:", {
        messageId: result.messageId,
        to: to,
        subject: subject,
        mode: this.mode,
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
        mode: this.mode,
      };
    } catch (error) {
      logger.error("📧 Failed to send email:", {
        error: error.message,
        to: options.to,
        subject: options.subject,
        mode: this.mode,
      });

      // Return error but don't throw to avoid breaking main application flow
      return {
        success: false,
        error: error.message,
        mode: this.mode,
      };
    }
  }

  /**
   * Send welcome email with professional styling
   * @param {Object} data - Email data
   * @param {string} to - Recipient email
   * @returns {Promise<Object>} Send result
   */
  async sendWelcomeEmail(data, to) {
    const { name, username, email, verificationLink, role = "User" } = data;

    const subject = "Welcome to School Management System";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to School Management System</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            background-color: #f8fafc;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            font-size: 24px; 
            font-weight: 700; 
            margin-bottom: 8px;
          }
          .header p { 
            opacity: 0.9; 
            font-size: 16px; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .welcome-message { 
            font-size: 18px; 
            color: #2d3748; 
            margin-bottom: 24px; 
          }
          .credentials-box { 
            background-color: #f7fafc; 
            border: 1px solid #e2e8f0;
            border-left: 4px solid #667eea;
            padding: 20px; 
            border-radius: 8px; 
            margin: 24px 0; 
          }
          .credentials-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #2d3748; 
            margin-bottom: 12px; 
          }
          .credential-item { 
            margin: 8px 0; 
            font-size: 14px; 
          }
          .credential-label { 
            font-weight: 600; 
            color: #4a5568; 
          }
          .credential-value { 
            color: #2d3748; 
            font-family: 'Monaco', 'Menlo', monospace;
            background-color: #edf2f7;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .verify-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            text-decoration: none; 
            padding: 16px 32px; 
            border-radius: 8px; 
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0; 
            transition: transform 0.2s ease;
          }
          .verify-button:hover { 
            transform: translateY(-2px); 
          }
          .next-steps { 
            background-color: #f0fff4; 
            border: 1px solid #9ae6b4;
            border-radius: 8px; 
            padding: 20px; 
            margin: 24px 0; 
          }
          .next-steps h3 { 
            color: #22543d; 
            margin-bottom: 12px; 
            font-size: 16px;
          }
          .next-steps ul { 
            list-style: none; 
            padding-left: 0; 
          }
          .next-steps li { 
            padding: 4px 0; 
            color: #2f855a;
            position: relative;
            padding-left: 20px;
          }
          .next-steps li:before { 
            content: "✓"; 
            position: absolute;
            left: 0;
            color: #38a169;
            font-weight: bold;
          }
          .warning { 
            background-color: #fffbeb; 
            border: 1px solid #f6e05e;
            border-radius: 8px; 
            padding: 16px; 
            margin: 20px 0; 
          }
          .warning-text { 
            color: #744210; 
            font-size: 14px; 
          }
          .footer { 
            background-color: #f7fafc; 
            text-align: center; 
            padding: 30px; 
            border-top: 1px solid #e2e8f0;
          }
          .footer-text { 
            color: #718096; 
            font-size: 12px; 
            line-height: 1.5;
          }
          .link { 
            color: #667eea; 
            text-decoration: none; 
          }
          .link:hover { 
            text-decoration: underline; 
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Welcome to School Management System</h1>
            <p>Your account has been successfully created</p>
          </div>
          
          <div class="content">
            <div class="welcome-message">
              Hello <strong>${name}</strong>! 👋
            </div>
            
            <p>Welcome to our School Management System! We're excited to have you join our platform as a <strong>${role}</strong>.</p>
            
            <div class="credentials-box">
              <div class="credentials-title">🔐 Your Login Credentials</div>
              <div class="credential-item">
                <span class="credential-label">Username:</span>
                <span class="credential-value">${username}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Role:</span>
                <span class="credential-value">${role}</span>
              </div>
            </div>

            <p>To complete your registration and secure your account, please verify your email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="verify-button">
                🔗 Verify Email Address
              </a>
            </div>
            
            <div class="warning">
              <div class="warning-text">
                <strong>⏰ Important:</strong> This verification link expires in 24 hours for security reasons.
              </div>
            </div>

            <div class="next-steps">
              <h3>🚀 What's Next?</h3>
              <ul>
                <li>Verify your email address using the button above</li>
                <li>Log in to your account with your credentials</li>
                <li>Complete your profile information</li>
                <li>Explore the system features</li>
                <li>Contact support if you need assistance</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-family: monospace; font-size: 12px; background-color: #f7fafc; padding: 8px; border-radius: 4px; margin: 12px 0;">
              ${verificationLink}
            </p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          
          <div class="footer">
            <div class="footer-text">
              © ${new Date().getFullYear()} School Management System. All rights reserved.<br>
              This is an automated message, please do not reply to this email.<br>
              <a href="#" class="link">Privacy Policy</a> | <a href="#" class="link">Terms of Service</a> | <a href="#" class="link">Support</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to School Management System!

Hello ${name}!

Your account has been successfully created. Welcome to our School Management System!

Your Login Credentials:
- Username: ${username}
- Email: ${email}
- Role: ${role}

To complete your registration, please verify your email address by visiting:
${verificationLink}

This verification link will expire in 24 hours.

What's Next?
✓ Verify your email address
✓ Log in to your account
✓ Complete your profile
✓ Start using the system

If you have any questions or need assistance, please contact our support team.

© ${new Date().getFullYear()} School Management System. All rights reserved.
    `;

    return this.sendEmail({
      to,
      subject,
      text,
      html,
    });
  }

  /**
   * Send password reset email with professional styling
   * @param {Object} data - Email data
   * @param {string} to - Recipient email
   * @returns {Promise<Object>} Send result
   */
  async sendPasswordResetEmail(data, to) {
    const { resetLink, name = "User" } = data;

    const subject = "Password Reset Request - School Management System";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            background-color: #f8fafc;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            font-size: 24px; 
            font-weight: 700; 
            margin-bottom: 8px;
          }
          .content { 
            padding: 40px 30px; 
          }
          .reset-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
            color: white; 
            text-decoration: none; 
            padding: 16px 32px; 
            border-radius: 8px; 
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0; 
            transition: transform 0.2s ease;
          }
          .reset-button:hover { 
            transform: translateY(-2px); 
          }
          .warning { 
            background-color: #fef5e7; 
            border: 1px solid #f6ad55;
            border-left: 4px solid #ed8936;
            padding: 20px; 
            border-radius: 8px; 
            margin: 24px 0; 
          }
          .warning h3 { 
            color: #c05621; 
            margin-bottom: 12px; 
            font-size: 16px;
          }
          .warning ul { 
            color: #c05621; 
            margin-left: 20px; 
          }
          .warning li { 
            margin: 4px 0; 
          }
          .footer { 
            background-color: #f7fafc; 
            text-align: center; 
            padding: 30px; 
            border-top: 1px solid #e2e8f0;
          }
          .footer-text { 
            color: #718096; 
            font-size: 12px; 
            line-height: 1.5;
          }
          .link { 
            color: #f56565; 
            text-decoration: none; 
          }
          .link:hover { 
            text-decoration: underline; 
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello ${name},</p>
            
            <p>You have requested to reset your password for your School Management System account.</p>
            
            <p>To create a new password, click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="reset-button">
                🔑 Reset Password
              </a>
            </div>

            <div class="warning">
              <h3>⚠️ Important Security Information</h3>
              <ul>
                <li>This link will expire in <strong>1 hour</strong></li>
                <li>The link can only be used <strong>once</strong></li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your current password remains unchanged until you use this link</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #f56565; font-family: monospace; font-size: 12px; background-color: #fef5e7; padding: 8px; border-radius: 4px; margin: 12px 0;">
              ${resetLink}
            </p>
            
            <p>If you need another reset link, please request a new one from the login page.</p>
            
            <p><strong>Stay secure:</strong> Never share this link with anyone else.</p>
          </div>
          
          <div class="footer">
            <div class="footer-text">
              © ${new Date().getFullYear()} School Management System. All rights reserved.<br>
              This is an automated security message, please do not reply to this email.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request - School Management System

Hello ${name},

You have requested to reset your password for your School Management System account.

To create a new password, visit:
${resetLink}

⚠️ Important Security Information:
- This link will expire in 1 hour
- The link can only be used once
- If you didn't request this reset, please ignore this email
- Your current password remains unchanged until you use this link

If you need another reset link, please request a new one from the login page.

Stay secure: Never share this link with anyone else.

© ${new Date().getFullYear()} School Management System. All rights reserved.
    `;

    return this.sendEmail({
      to,
      subject,
      text,
      html,
    });
  }

  /**
   * Send template email with validation
   * @param {string} template - Template name
   * @param {Object} data - Template data
   * @param {string} to - Recipient email
   * @returns {Promise<Object>} Send result
   */
  async sendTemplate(template, data, to) {
    try {
      // Validate template name
      const supportedTemplates = ["welcomeEmail", "passwordReset"];
      if (!supportedTemplates.includes(template)) {
        logger.error(
          `Unknown email template: ${template}. Supported: ${supportedTemplates.join(
            ", "
          )}`
        );
        return {
          success: false,
          error: `Unknown email template: ${template}`,
        };
      }

      // Validate recipient
      if (!to || !this.isValidEmail(to)) {
        logger.error(`Invalid recipient email: ${to}`);
        return {
          success: false,
          error: "Invalid recipient email address",
        };
      }

      switch (template) {
        case "welcomeEmail":
          return this.sendWelcomeEmail(data, to);

        case "passwordReset":
          return this.sendPasswordResetEmail(data, to);

        default:
          return {
            success: false,
            error: `Template ${template} not implemented`,
          };
      }
    } catch (error) {
      logger.error("Template email failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send test email
   * @param {string} to - Test recipient
   * @returns {Promise<Object>} Send result
   */
  async sendTestEmail(to) {
    const subject = "✅ Test Email from School Management System";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">📧 Email Service Test</h2>
        <p>This is a test email from the School Management System.</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
          <p><strong>Service Mode:</strong> ${this.mode}</p>
          <p><strong>Time Sent:</strong> ${new Date().toISOString()}</p>
          <p><strong>Email Configured:</strong> ${
            this.isConfigured ? "✅ Yes" : "❌ No"
          }</p>
        </div>
        <p style="color: #059669; font-weight: bold;">✅ If you received this email, the email service is working correctly!</p>
      </div>
    `;

    const text = `
Email Service Test

This is a test email from the School Management System.

Service Mode: ${this.mode}
Time Sent: ${new Date().toISOString()}
Email Configured: ${this.isConfigured ? "Yes" : "No"}

✅ If you received this email, the email service is working correctly!
    `;

    return this.sendEmail({
      to,
      subject,
      text,
      html,
    });
  }

  /**
   * Verify email connection
   * @returns {Promise<boolean>} Connection status
   */
  async verifyConnection() {
    if (!this.transporter) return false;

    try {
      if (this.mode === "mock" || this.mode === "development") {
        return true; // Always return true for non-production modes
      }

      await this.transporter.verify();
      logger.info("📧 Email service connection verified");
      return true;
    } catch (error) {
      logger.error("📧 Email service connection failed:", error);
      return false;
    }
  }

  /**
   * Get comprehensive service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      mode: this.mode,
      config: {
        host: this.config?.host || "Not configured",
        port: this.config?.port || "Not configured",
        secure: this.config?.secure || false,
        user: this.config?.user
          ? this.config.user.substring(0, 3) + "***"
          : "Not configured",
        from: this.config?.from || "Not configured",
        service: this.config?.service || "None",
      },
      supportedTemplates: ["welcomeEmail", "passwordReset"],
      lastInitialized: new Date().toISOString(),
    };
  }

  /**
   * Validate email address format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Reinitialize the service (useful for config changes)
   * @returns {Promise<void>}
   */
  async reinitialize() {
    logger.info("📧 Reinitializing email service...");
    this.transporter = null;
    this.isConfigured = false;
    this.mode = "unknown";
    this.config = null;
    await this.initializeTransporter();
  }
}

// Create and export singleton instance
const emailService = new EmailService();

export default emailService;
