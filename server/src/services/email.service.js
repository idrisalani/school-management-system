// server/src/services/email.service.js - Gmail Replacement Version with Email Verification
import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.transporter = null;
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
   * Initialize Gmail email service
   */
  init() {
    try {
      const gmailUser = process.env.GMAIL_USER;
      const gmailPassword = process.env.GMAIL_APP_PASSWORD;

      if (!gmailUser || !gmailPassword) {
        this.log("warn", "Gmail credentials not found, using mock mode");
        this.initMockMode("Gmail credentials missing");
        return;
      }

      // Validate email format
      if (!gmailUser.includes("@gmail.com")) {
        this.log("warn", "Invalid Gmail address format");
        this.initMockMode("Invalid Gmail address format");
        return;
      }

      // Initialize Gmail transporter
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPassword, // App Password, not regular password
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 10,
        secure: true,
        tls: {
          rejectUnauthorized: false,
        },
      });

      this.isConfigured = true;
      this.mode = "gmail";

      this.log("info", "Gmail email service initialized successfully");

      // Verify connection
      this.verifyConnection();
    } catch (error) {
      this.log("error", "Gmail initialization failed", { error: error.message });
      this.initMockMode(error.message);
    }
  }

  /**
   * Verify Gmail connection
   */
  async verifyConnection() {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      this.log("info", "Gmail SMTP connection verified successfully");
      return true;
    } catch (error) {
      this.log("error", "Gmail SMTP verification failed", { error: error.message });
      // Don't switch to mock mode, just log the error
      return false;
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
   * Send email - main method (same interface as before)
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

      if (this.mode === "gmail") {
        return this.sendGmailEmail(options);
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
   * Send email via Gmail (replaces sendBrevoEmail)
   */
  async sendGmailEmail(options) {
    try {
      const { to, subject, html, text } = options;

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || "School Management System",
          address: process.env.GMAIL_USER,
        },
        to: to,
        subject: subject,
        html: html || `<p>${text}</p>`,
        text: text || this.stripHtmlTags(html || ""),
        headers: {
          "X-Priority": "3",
          "X-Mailer": "School Management System v1.0",
        },
      };

      this.log("info", "Sending email via Gmail", {
        to: to,
        subject: subject,
        from: process.env.GMAIL_USER,
      });

      const result = await this.transporter.sendMail(mailOptions);

      this.log("info", "Gmail email sent successfully", {
        messageId: result.messageId,
        response: result.response,
        to: to,
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: "Gmail SMTP",
        mode: "gmail",
        response: result.response,
      };
    } catch (error) {
      this.log("error", "Gmail send failed", {
        error: error.message,
        errorCode: error.code,
        command: error.command,
      });

      let errorMessage = error.message;

      // Handle specific Gmail errors
      if (error.code === "EAUTH") {
        errorMessage = "Gmail authentication failed. Check your email and app password.";
      } else if (error.code === "EMESSAGE") {
        errorMessage = "Gmail message format error. Check email content.";
      } else if (error.responseCode === 550) {
        errorMessage = "Gmail rejected the email. Recipient may not exist.";
      }

      return {
        success: false,
        error: `Gmail Error: ${errorMessage}`,
        mode: "gmail",
        errorCode: error.code,
      };
    }
  }

  /**
   * Mock email for development (same as before)
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
   * Send welcome email (same interface, enhanced template)
   */
  async sendWelcomeEmail(userData, recipientEmail) {
    const { name, username, role } = userData;

    const subject = "🎓 Welcome to School Management System";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to School Management System</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content { 
            padding: 40px 30px;
          }
          .credentials { 
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
            padding: 25px; 
            border-left: 4px solid #10b981;
            margin: 30px 0;
            border-radius: 8px;
          }
          .credentials h3 {
            color: #065f46;
            margin: 0 0 15px 0;
            font-size: 18px;
          }
          .cred-item {
            margin: 8px 0;
            color: #064e3b;
            font-family: 'Courier New', monospace;
          }
          .button-container {
            text-align: center;
            margin: 40px 0;
          }
          .button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 40px;
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to School Management System!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <p>Welcome aboard! Your account has been successfully created and you're now part of our School Management System community.</p>
            
            <div class="credentials">
              <h3>📋 Your Account Details:</h3>
              <div class="cred-item"><strong>Username:</strong> ${username}</div>
              <div class="cred-item"><strong>Email:</strong> ${recipientEmail}</div>
              <div class="cred-item"><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</div>
            </div>
            
            <p>You can now log in to your account and start exploring all the features available to you as a ${role}.</p>
            
            <div class="button-container">
              <a href="${process.env.CLIENT_URL}/login" class="button">
                Login to Dashboard
              </a>
            </div>

            <div class="footer">
              <p>Need help? Contact us at <strong>${process.env.SUPPORT_EMAIL || "support@schoolms.com"}</strong></p>
              <p>Best regards,<br>The School Management Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to School Management System!

Hello ${name},

Your account has been successfully created.

Account Details:
- Username: ${username}
- Email: ${recipientEmail}  
- Role: ${role}

You can now log in and start using the system at: ${process.env.CLIENT_URL}/login

Need help? Contact us at ${process.env.SUPPORT_EMAIL || "support@schoolms.com"}

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
   * Send password reset email (same interface, enhanced template)
   */
  async sendPasswordResetEmail(resetData, recipientEmail) {
    const { resetLink, name } = resetData;

    const subject = "🔑 Password Reset - School Management System";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Request</title>
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
            background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content { 
            padding: 40px 30px;
          }
          .button-container {
            text-align: center;
            margin: 40px 0;
          }
          .button { 
            background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          }
          .warning {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-left: 4px solid #ef4444;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .warning h4 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .warning ul {
            color: #991b1b;
            margin: 0;
            padding-left: 20px;
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
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 40px;
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <p>You requested to reset your password for your School Management System account. Click the button below to create a new password:</p>
            
            <div class="button-container">
              <a href="${resetLink}" class="button">Reset My Password</a>
            </div>
            
            <div class="warning">
              <h4>⚠️ Important Security Information:</h4>
              <ul>
                <li>This reset link expires in <strong>1 hour</strong></li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your current password remains active until you complete the reset</li>
                <li>Only use this link if you initiated the password reset</li>
              </ul>
            </div>
            
            <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
            <div class="link-backup">${resetLink}</div>

            <div class="footer">
              <p>If you're having trouble, contact us at <strong>${process.env.SUPPORT_EMAIL || "support@schoolms.com"}</strong></p>
              <p>Best regards,<br>The School Management Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request - School Management System

Hello ${name},

You requested to reset your password for your School Management System account.

To reset your password, visit: ${resetLink}

Important Security Information:
- This link expires in 1 hour
- If you didn't request this, ignore this email  
- Your current password remains unchanged until you complete the reset
- Only use this link if you initiated the password reset

If you're having trouble, contact us at ${process.env.SUPPORT_EMAIL || "support@schoolms.com"}

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
   * Send email verification email - ADDED METHOD FOR AUTH CONTROLLER COMPATIBILITY
   */
  async sendEmailVerification(userData, recipientEmail, verificationToken) {
    const { name, firstName } = userData;
    const verificationLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;

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
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          .verification-info {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .verification-info h4 {
            color: #1e40af;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .verification-info ul {
            color: #1e3a8a;
            margin: 0;
            padding-left: 20px;
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
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 40px;
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Verify Your Email Address</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${firstName || name}</strong>,</p>
            
            <p>Thank you for registering with our School Management System! To activate your account and access all features, please verify your email address by clicking the button below:</p>
            
            <div class="button-container">
              <a href="${verificationLink}" class="button">
                Verify My Email Address
              </a>
            </div>
            
            <div class="verification-info">
              <h4>📋 Verification Details:</h4>
              <ul>
                <li>This verification link expires in <strong>24 hours</strong></li>
                <li>You must verify your email before you can log in</li>
                <li>Once verified, you'll have full access to your account</li>
                <li>If you didn't create this account, please ignore this email</li>
              </ul>
            </div>
            
            <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
            <div class="link-backup">${verificationLink}</div>

            <div class="footer">
              <p>Need help? Contact us at <strong>${process.env.SUPPORT_EMAIL || "support@schoolms.com"}</strong></p>
              <p>Best regards,<br>The School Management Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Email Verification Required - School Management System

Hello ${firstName || name},

Thank you for registering with our School Management System!

To verify your email address, visit: ${verificationLink}

Verification Details:
- This link expires in 24 hours
- You must verify your email before you can log in  
- Once verified, you'll have full access to your account
- If you didn't create this account, please ignore this email

Need help? Contact us at ${process.env.SUPPORT_EMAIL || "support@schoolms.com"}

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
   * Send test email (same interface)
   */
  async sendTestEmail(recipientEmail) {
    const subject = "✅ Test Email - School Management System";

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 32px;">✅</span>
            </div>
            <h2 style="color: #1f2937; margin: 0;">Email Service Test</h2>
          </div>
          
          <p style="color: #4b5563; font-size: 16px;">This is a test email from your School Management System email service.</p>
          
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-left: 4px solid #10b981; margin: 30px 0; border-radius: 8px;">
            <h3 style="color: #065f46; margin: 0 0 15px 0;">📊 Service Status:</h3>
            <p style="margin: 5px 0; color: #064e3b; font-family: 'Courier New', monospace;"><strong>Mode:</strong> ${this.mode}</p>
            <p style="margin: 5px 0; color: #064e3b; font-family: 'Courier New', monospace;"><strong>Configured:</strong> ${this.isConfigured ? "Yes" : "No"}</p>
            <p style="margin: 5px 0; color: #064e3b; font-family: 'Courier New', monospace;"><strong>Provider:</strong> Gmail SMTP</p>
            <p style="margin: 5px 0; color: #064e3b; font-family: 'Courier New', monospace;"><strong>Time:</strong> ${new Date().toISOString()}</p>
            ${this.mode === "mock" ? `<p style="margin: 5px 0; color: #064e3b; font-family: 'Courier New', monospace;"><strong>Mock Reason:</strong> ${this.initError}</p>` : ""}
          </div>
          
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px;">
            <p style="color: #059669; font-weight: bold; font-size: 18px; margin: 0;">🎉 Email service is working perfectly!</p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Sent from School Management System<br>
              <strong>From:</strong> ${process.env.GMAIL_USER || "Not configured"}
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `
Email Service Test - School Management System

Service Status:
- Mode: ${this.mode}
- Configured: ${this.isConfigured ? "Yes" : "No"}  
- Provider: Gmail SMTP
- Time: ${new Date().toISOString()}
${this.mode === "mock" ? `- Mock Reason: ${this.initError}` : ""}

🎉 Email service is working perfectly!

Sent from School Management System
From: ${process.env.GMAIL_USER || "Not configured"}
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: subject,
      html: html,
      text: text,
    });
  }

  /**
   * Strip HTML tags for plain text version
   */
  stripHtmlTags(html) {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Get service status (same interface)
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      mode: this.mode,
      hasGmailCredentials: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      gmailUser: process.env.GMAIL_USER || "Not configured",
      initError: this.initError,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
      },
    };
  }
}

// ES6 default export to match your existing import statements
export default new EmailService();
