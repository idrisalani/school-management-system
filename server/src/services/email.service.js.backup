// server/src/services/email.service.js - Enhanced version with existing API
import {
  SESClient,
  SendEmailCommand,
  GetSendQuotaCommand,
} from "@aws-sdk/client-ses";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import nodemailer from "nodemailer";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/errors.js";

/**
 * @typedef {"high" | "normal" | "low"} EmailPriority
 */

/**
 * @typedef {Object} EmailOptions
 * @property {string|string[]} to - Recipient email(s)
 * @property {string} subject - Email subject
 * @property {string} html - HTML content
 * @property {string} [text] - Plain text content
 * @property {Array<any>} [attachments] - Email attachments
 * @property {EmailPriority} [priority] - Email priority level
 */

/**
 * @typedef {Object} EmailTemplate
 * @property {string} subject - Email subject
 * @property {string} html - HTML content
 */

// Environment validation
const requiredEnvVars = {
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.AWS_SES_SOURCE_EMAIL,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
};

// Validate environment variables (warn instead of throw for better development experience)
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    logger.warn(`${key} is not defined in environment variables`);
  }
});

class EmailService {
  /** @private */
  from = requiredEnvVars.EMAIL_FROM || "noreply@example.com";

  /**
   * Rate limiting configuration
   * @private
   */
  rateLimits = {
    maxBulkEmails: 50,
    bulkEmailInterval: 1000, // 1 second between bulk chunks
    retryAttempts: 3,
    retryDelay: 1000, // 1 second between retries
  };

  constructor() {
    // Only initialize if AWS credentials are available
    if (
      requiredEnvVars.AWS_ACCESS_KEY_ID &&
      requiredEnvVars.AWS_SECRET_ACCESS_KEY &&
      requiredEnvVars.AWS_REGION
    ) {
      this.ses = new SESClient({
        region: requiredEnvVars.AWS_REGION,
        credentials: defaultProvider(),
      });

      this.transporter = nodemailer.createTransport({
        SES: { ses: this.ses, aws: { SendEmailCommand } },
        sendingRate: 14, // AWS SES limit per second
      });

      this.isConfigured = true;
      this.initialize();
    } else {
      logger.warn("AWS SES not configured, email service will be limited");
      this.isConfigured = false;
    }
  }

  /**
   * Initialize email service
   * @private
   */
  async initialize() {
    try {
      if (this.isConfigured) {
        await this.verifyEmailService();
        logger.info("Email service initialized successfully");
      }
    } catch (error) {
      logger.error("Failed to initialize email service:", error);
      // Don't throw, just log the error for better development experience
    }
  }

  /**
   * Verify email service configuration
   * @returns {Promise<void>}
   * @private
   */
  async verifyEmailService() {
    try {
      if (!this.ses) return;

      const command = new GetSendQuotaCommand({});
      const quota = await this.ses.send(command);
      logger.info("Email service quota:", quota);
    } catch (error) {
      logger.error("Email service verification failed:", error);
      throw new Error("Failed to verify email service configuration");
    }
  }

  /**
   * Send a single email with retry logic
   * @param {EmailOptions} options - Email options
   * @returns {Promise<void>}
   * @throws {ApiError}
   */
  async sendEmail(options, attempt = 1) {
    if (!this.isConfigured || !this.transporter) {
      logger.warn(
        "Email service not configured, email not sent:",
        options.subject
      );
      return;
    }

    try {
      /** @type {nodemailer.SendMailOptions} */
      const mailOptions = {
        from: this.from,
        to: Array.isArray(options.to) ? options.to.join(",") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        attachments: options.attachments || [],
        priority: options.priority || "normal",
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${mailOptions.to}`);
    } catch (error) {
      if (attempt < this.rateLimits.retryAttempts) {
        logger.warn(`Retrying email send attempt ${attempt + 1}`);
        await new Promise((resolve) =>
          setTimeout(resolve, this.rateLimits.retryDelay)
        );
        return this.sendEmail(options, attempt + 1);
      }
      logger.error("Email sending failed:", error);
      throw new ApiError(500, "Failed to send email");
    }
  }

  /**
   * Send bulk emails with rate limiting
   * @param {EmailOptions} options - Bulk email options
   * @returns {Promise<void>}
   * @throws {ApiError}
   */
  async sendBulkEmail(options) {
    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const chunks = this.chunkArray(recipients, this.rateLimits.maxBulkEmails);

      for (const chunk of chunks) {
        await this.sendEmail({ ...options, to: chunk });
        await new Promise((resolve) =>
          setTimeout(resolve, this.rateLimits.bulkEmailInterval)
        );
      }

      logger.info(`Bulk email sent to ${recipients.length} recipients`);
    } catch (error) {
      logger.error("Bulk email sending failed:", error);
      throw new ApiError(500, "Failed to send bulk email");
    }
  }

  /**
   * Send email using a template
   * @param {string} templateName - Name of the template
   * @param {Object} data - Template data
   * @param {string|string[]} to - Recipient email(s)
   * @returns {Promise<void>}
   * @throws {ApiError}
   */
  async sendTemplate(templateName, data, to) {
    try {
      const template = this.getTemplate(templateName, data);
      await this.sendEmail({
        to,
        subject: template.subject,
        html: template.html,
      });
      logger.info(
        `Template email '${templateName}' sent to ${
          Array.isArray(to) ? to.join(", ") : to
        }`
      );
    } catch (error) {
      logger.error("Template email sending failed:", error);
      throw new ApiError(500, "Failed to send template email");
    }
  }

  /**
   * Get email template with dynamic data
   * @param {string} templateName - Name of the template
   * @param {Object} data - Template data
   * @returns {EmailTemplate}
   * @throws {ApiError}
   */
  getTemplate(templateName, data) {
    const templates = {
      welcomeEmail: {
        subject: "Welcome to EduManager - Your Login Credentials",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to EduManager</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .credentials { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎓 Welcome to EduManager</h1>
                <p>Your School Management System</p>
              </div>
              
              <div class="content">
                <h2>Hello ${data.name}!</h2>
                
                <p>Welcome to EduManager! Your account has been successfully created.</p>
                
                ${
                  data.username
                    ? `
                <div class="credentials">
                  <h3>📋 Your Login Credentials</h3>
                  <p><strong>Username:</strong> ${data.username}</p>
                  <p><strong>Email:</strong> ${
                    data.email || "Your registered email"
                  }</p>
                  <p>You can login using either your username or email address.</p>
                </div>
                `
                    : ""
                }
                
                <p><strong>Next Steps:</strong></p>
                <ol>
                  <li>Click the verification button below to verify your email</li>
                  ${
                    data.username
                      ? `<li>Use your username (<strong>${data.username}</strong>) and password to login</li>`
                      : "<li>Use your email and password to login</li>"
                  }
                  <li>Complete your profile setup</li>
                  <li>Start using EduManager!</li>
                </ol>
                
                <div style="text-align: center;">
                  <a href="${data.verificationLink}" class="button">
                    ✅ Verify Email Address
                  </a>
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${
                  data.verificationLink
                }</p>
                
                <div class="warning">
                  <strong>Security Note:</strong> Keep your login credentials safe and don't share them with anyone.
                </div>
              </div>
              
              <div class="footer">
                <p>Need help? Contact our support team</p>
                <p>© 2025 EduManager. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      passwordReset: {
        subject: "Password Reset Request - EduManager",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - EduManager</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>EduManager Security</p>
              </div>
              
              <div class="content">
                <h2>Hello${data.name ? ` ${data.name}` : ""}!</h2>
                
                <p>You have requested to reset your password for your EduManager account.</p>
                
                <p>Click the button below to set a new password:</p>
                
                <div style="text-align: center;">
                  <a href="${data.resetLink}" class="button">
                    🔄 Reset Password
                  </a>
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #dc3545;">${
                  data.resetLink
                }</p>
                
                <div class="warning">
                  <strong>⏰ Important:</strong> This link will expire in 1 hour for security reasons.
                </div>
                
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
              
              <div class="footer">
                <p>For security questions, contact our support team</p>
                <p>© 2025 EduManager. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      assignmentNotification: {
        subject: `New Assignment: ${data.assignmentTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Assignment - EduManager</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #17a2b8; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .assignment-details { background: #fff; border-left: 4px solid #17a2b8; padding: 20px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📝 New Assignment Posted</h1>
                <p>${data.courseName}</p>
              </div>
              
              <div class="content">
                <div class="assignment-details">
                  <h2>${data.assignmentTitle}</h2>
                  <p><strong>Due Date:</strong> ${data.dueDate}</p>
                  <p><strong>Description:</strong></p>
                  <p>${data.description}</p>
                </div>
                
                <div style="text-align: center;">
                  <a href="${data.link}" class="button">
                    📋 View Assignment Details
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      gradeNotification: {
        subject: "Grade Posted - EduManager",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Grade Update - EduManager</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #ffc107; color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .grade-details { background: #fff; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; text-align: center; }
              .grade-score { font-size: 48px; font-weight: bold; color: #ffc107; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 New Grade Posted</h1>
                <p>${data.courseName}</p>
              </div>
              
              <div class="content">
                <div class="grade-details">
                  <h2>${data.assignmentTitle}</h2>
                  <div class="grade-score">${data.grade}</div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${data.link}" class="button">
                    📈 View Detailed Results
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      absenceNotification: {
        subject: "Attendance Alert - EduManager",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Attendance Alert - EduManager</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .alert-details { background: #fff; border-left: 4px solid #ff6b6b; padding: 20px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Attendance Alert</h1>
                <p>EduManager Attendance System</p>
              </div>
              
              <div class="content">
                <div class="alert-details">
                  <h2>Absence Recorded</h2>
                  <p><strong>Student:</strong> ${data.studentName}</p>
                  <p><strong>Date:</strong> ${data.date}</p>
                  <p><strong>Course:</strong> ${data.courseName}</p>
                  <p>This is to inform you of a recorded absence.</p>
                </div>
                
                <div style="text-align: center;">
                  <a href="${data.link}" class="button">
                    📋 View Attendance Record
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      },
    };

    const template = templates[templateName];
    if (!template) {
      throw new ApiError(400, `Email template '${templateName}' not found`);
    }

    return template;
  }

  /**
   * Strip HTML tags from content
   * @param {string} html - HTML content
   * @returns {string} Plain text content
   */
  stripHtml(html) {
    return html.replace(/<[^>]+>/g, "");
  }

  /**
   * Split array into chunks
   * @param {Array<any>} array - Array to split
   * @param {number} size - Chunk size
   * @returns {Array<Array<any>>} Array of chunks
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Check if email service is configured
   * @returns {boolean}
   */
  isEmailConfigured() {
    return this.isConfigured;
  }

  /**
   * Get email service status
   * @returns {Object}
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      provider: "AWS SES + Nodemailer",
      from: this.from,
      templatesAvailable: [
        "welcomeEmail",
        "passwordReset",
        "assignmentNotification",
        "gradeNotification",
        "absenceNotification",
      ],
    };
  }
}

/** @type {EmailService} */
const emailService = new EmailService();
export default emailService;
