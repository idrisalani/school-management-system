// server/src/services/email.service.js - Clean Brevo-Only Version
import SibApiV3Sdk from "sib-api-v3-sdk";

class EmailService {
  constructor() {
    this.apiInstance = null;
    this.isConfigured = false;
    this.mode = "unknown";
    this.initError = null;
    this.init();
  }

  /**
   * Simple logging without external dependencies
   */
  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";

    switch (level.toLowerCase()) {
      case "error":
        console.error(`[${timestamp}] [EMAIL-ERROR] ${message}${metaStr}`);
        break;
      case "warn":
        console.warn(`[${timestamp}] [EMAIL-WARN] ${message}${metaStr}`);
        break;
      case "info":
        console.log(`[${timestamp}] [EMAIL-INFO] ${message}${metaStr}`);
        break;
      default:
        console.log(`[${timestamp}] [EMAIL-${level.toUpperCase()}] ${message}${metaStr}`);
    }
  }

  /**
   * Initialize Brevo email service
   */
  init() {
    try {
      const apiKey = process.env.BREVO_API_KEY;

      if (!apiKey) {
        this.log("warn", "BREVO_API_KEY not found, using mock mode");
        this.initMockMode("No API key provided");
        return;
      }

      if (!apiKey.startsWith("xkeysib-")) {
        this.log("warn", "Invalid Brevo API key format");
        this.initMockMode("Invalid API key format");
        return;
      }

      // Initialize Brevo client
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const authentication = defaultClient.authentications["api-key"];
      authentication.apiKey = apiKey;

      this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      this.isConfigured = true;
      this.mode = "brevo";

      this.log("info", "Brevo email service initialized successfully");
    } catch (error) {
      this.log("error", "Brevo initialization failed", { error: error.message });
      this.initMockMode(error.message);
    }
  }

  /**
   * Initialize mock mode for development/fallback
   */
  initMockMode(reason = "Unknown") {
    this.isConfigured = true;
    this.mode = "mock";
    this.initError = reason;
    this.log("info", "Email service in mock mode", { reason });
  }

  /**
   * Send email - main method
   */
  async sendEmail(options) {
    try {
      const { to, subject, html, text } = options;

      this.log("info", "Sending email", {
        to: to,
        subject: subject,
        mode: this.mode,
      });

      if (this.mode === "mock") {
        return this.sendMockEmail(options);
      }

      if (this.mode === "brevo") {
        return this.sendBrevoEmail(options);
      }

      throw new Error(`Unknown email mode: ${this.mode}`);
    } catch (error) {
      this.log("error", "Email send failed", {
        error: error.message,
        to: options.to,
        subject: options.subject,
      });

      return {
        success: false,
        error: error.message,
        mode: this.mode,
      };
    }
  }

  /**
   * Send email via Brevo API
   */
  async sendBrevoEmail(options) {
    try {
      const { to, subject, html, text } = options;

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

      sendSmtpEmail.sender = {
        name: "School Management System",
        email: "idris.bin.muslih@outlook.com", // Use your verified sender
      };

      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html || `<p>${text}</p>`;
      sendSmtpEmail.textContent = text || "Please view this email in HTML mode.";

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      // Handle different possible response structures
      const statusCode = result?.response?.statusCode || result?.statusCode || "unknown";
      const messageId =
        result?.response?.body?.messageId ||
        result?.body?.messageId ||
        result?.messageId ||
        `brevo-${Date.now()}`;

      this.log("info", "Brevo email sent successfully", {
        statusCode: statusCode,
        messageId: messageId,
        to: to,
        resultStructure: Object.keys(result || {}).join(","),
      });

      return {
        success: true,
        messageId: messageId,
        provider: "Brevo API",
        mode: "brevo",
        statusCode: statusCode,
      };
    } catch (error) {
      this.log("error", "Brevo send failed", {
        error: error.message,
        errorType: error.constructor.name,
        statusCode: error.status || error.statusCode || "unknown",
      });

      let errorMessage = error.message;

      // Handle different error response structures
      if (error.response) {
        if (error.response.text) {
          try {
            const errorBody = JSON.parse(error.response.text);
            errorMessage = errorBody.message || errorBody.code || errorBody.error || errorMessage;
          } catch (parseError) {
            errorMessage = error.response.text;
          }
        } else if (error.response.data) {
          errorMessage = error.response.data.message || error.response.data.error || errorMessage;
        }
      } else if (error.body) {
        errorMessage = error.body.message || error.body.error || errorMessage;
      }

      return {
        success: false,
        error: `Brevo API Error: ${errorMessage}`,
        mode: "brevo",
        statusCode: error.status || error.statusCode || "unknown",
      };
    }
  }

  /**
   * Mock email for development
   */
  async sendMockEmail(options) {
    const { to, subject, text, html } = options;

    this.log("info", "MOCK EMAIL SENT", {
      to: to,
      subject: subject,
      textPreview: text?.substring(0, 100),
      hasHtml: !!html,
      reason: this.initError,
    });

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      provider: "Mock Service",
      mode: "mock",
      note: "This is a mock email - no actual email was sent",
    };
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(userData, recipientEmail) {
    const { name, username, role } = userData;

    const subject = "Welcome to School Management System";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to School Management System</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .content { 
            background: white; 
            padding: 30px; 
            border: 1px solid #ddd;
            border-radius: 0 0 10px 10px;
          }
          .credentials { 
            background: #f8f9fa; 
            padding: 20px; 
            border-left: 4px solid #667eea;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to School Management System!</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          
          <p>Welcome to our School Management System! Your account has been successfully created.</p>
          
          <div class="credentials">
            <h3>Your Login Details:</h3>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Email:</strong> ${recipientEmail}</p>
            <p><strong>Role:</strong> ${role}</p>
          </div>
          
          <p>You can now log in to your account and start using the system.</p>
          
          <p>Best regards,<br>The School Management Team</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to School Management System!

Hello ${name},

Your account has been successfully created.

Login Details:
- Username: ${username}
- Email: ${recipientEmail}  
- Role: ${role}

You can now log in and start using the system.

Best regards,
The School Management Team
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: subject,
      html: html,
      text: text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(resetData, recipientEmail) {
    const { resetLink, name } = resetData;

    const subject = "Password Reset - School Management System";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Request</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header { 
            background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .content { 
            background: white; 
            padding: 30px; 
            border: 1px solid #ddd;
            border-radius: 0 0 10px 10px;
          }
          .button { 
            display: inline-block; 
            background: #f56565; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          
          <p>You requested to reset your password for your School Management System account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <a href="${resetLink}" class="button">Reset Password</a>
          
          <div class="warning">
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link expires in 1 hour</li>
              <li>If you didn't request this, ignore this email</li>
              <li>Your current password remains unchanged until you use this link</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy this link: ${resetLink}</p>
          
          <p>Best regards,<br>The School Management Team</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request - School Management System

Hello ${name},

You requested to reset your password for your School Management System account.

To reset your password, visit: ${resetLink}

Important:
- This link expires in 1 hour
- If you didn't request this, ignore this email  
- Your current password remains unchanged until you use this link

Best regards,
The School Management Team
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: subject,
      html: html,
      text: text,
    });
  }

  /**
   * Send test email
   */
  async sendTestEmail(recipientEmail) {
    const subject = "Test Email - School Management System";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Email Service Test</h2>
        <p>This is a test email from your School Management System.</p>
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #28a745;">
          <h3>Service Status:</h3>
          <p><strong>Mode:</strong> ${this.mode}</p>
          <p><strong>Configured:</strong> ${this.isConfigured ? "Yes" : "No"}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          ${this.mode === "mock" ? `<p><strong>Mock Reason:</strong> ${this.initError}</p>` : ""}
        </div>
        <p style="color: #28a745; font-weight: bold;">✅ If you received this email, the service is working!</p>
      </div>
    `;

    const text = `
Email Service Test

Service Status:
- Mode: ${this.mode}
- Configured: ${this.isConfigured ? "Yes" : "No"}  
- Time: ${new Date().toISOString()}
${this.mode === "mock" ? `- Mock Reason: ${this.initError}` : ""}

✅ If you received this email, the service is working!
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: subject,
      html: html,
      text: text,
    });
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      mode: this.mode,
      hasApiKey: !!process.env.BREVO_API_KEY,
      apiKeyFormat: process.env.BREVO_API_KEY
        ? process.env.BREVO_API_KEY.startsWith("xkeysib-")
          ? "Valid"
          : "Invalid"
        : "Missing",
      initError: this.initError,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
      },
    };
  }
}

// ES6 default export to match your import statements
export default new EmailService();
