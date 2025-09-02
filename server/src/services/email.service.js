// server/src/services/email.service.js - ES6 Version
import SibApiV3Sdk from "sib-api-v3-sdk";

class EmailService {
  constructor() {
    this.brevoClient = null;
    this.apiInstance = null;
    this.isConfigured = false;
    this.mode = "unknown";
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
        console.error(`[${timestamp}] [ERROR] ${message}${metaStr}`);
        break;
      case "warn":
        console.warn(`[${timestamp}] [WARN] ${message}${metaStr}`);
        break;
      case "info":
        console.log(`[${timestamp}] [INFO] ${message}${metaStr}`);
        break;
      default:
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`);
    }
  }

  /**
   * Initialize Brevo email service
   */
  init() {
    try {
      const apiKey = process.env.BREVO_API_KEY;

      if (!apiKey) {
        console.warn("⚠️ BREVO_API_KEY not found, email service will use mock mode");
        this.initMockMode();
        return;
      }

      if (!apiKey.startsWith("xkeysib-")) {
        console.warn("⚠️ Invalid Brevo API key format (should start with xkeysib-)");
        this.initMockMode();
        return;
      }

      // Initialize Brevo client
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const authentication = defaultClient.authentications["api-key"];
      authentication.apiKey = apiKey;

      this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      this.isConfigured = true;
      this.mode = "brevo";

      console.log("✅ Brevo email service initialized successfully");
      this.log("info", "Brevo email service initialized", { mode: "brevo" });
    } catch (error) {
      console.error("❌ Brevo initialization failed:", error.message);
      this.log("error", "Brevo initialization failed", { error: error.message });
      this.initMockMode();
    }
  }

  /**
   * Initialize mock mode for development/fallback
   */
  initMockMode() {
    this.isConfigured = true;
    this.mode = "mock";
    console.log("📧 Email service in mock mode (will log emails instead of sending)");
  }

  /**
   * Send email - main method
   */
  async sendEmail(options) {
    try {
      const { to, subject, html, text } = options;

      console.log(`📧 Sending email [${this.mode}]:`, {
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
      console.error("❌ Failed to send email:", error.message);
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
        email: "noreply@schoolms.com",
      };

      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html || `<p>${text}</p>`;
      sendSmtpEmail.textContent = text || "Please view this email in HTML mode.";

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      console.log("✅ Brevo email sent successfully:", result.response.statusCode);
      this.log("info", "Brevo email sent", {
        messageId: result.response.body?.messageId,
        to: to,
        subject: subject,
      });

      return {
        success: true,
        messageId: result.response.body?.messageId,
        provider: "Brevo API",
        mode: "brevo",
      };
    } catch (error) {
      console.error("❌ Brevo send failed:", error.message);

      let errorMessage = error.message;
      if (error.response && error.response.text) {
        try {
          const errorBody = JSON.parse(error.response.text);
          errorMessage = errorBody.message || errorBody.code || errorMessage;
        } catch (parseError) {
          errorMessage = error.response.text;
        }
      }

      return {
        success: false,
        error: `Brevo API Error: ${errorMessage}`,
        mode: "brevo",
      };
    }
  }

  /**
   * Mock email for development
   */
  async sendMockEmail(options) {
    const { to, subject, text, html } = options;

    console.log("\n📧 MOCK EMAIL SENT:");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text Preview:", text?.substring(0, 100) + "...");
    console.log("Has HTML:", !!html);
    console.log("─────────────────────────\n");

    this.log("info", "Mock email sent", {
      to: to,
      subject: subject,
      mode: "mock",
    });

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      provider: "Mock Service",
      mode: "mock",
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
    };
  }
}

// ES6 default export to match your import statements
export default new EmailService();
