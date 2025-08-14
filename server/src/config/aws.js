// server/src/config/aws.js - Complete AWS Service with Enhanced Email Templates
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
  GetSendQuotaCommand,
  GetIdentityVerificationAttributesCommand,
} from "@aws-sdk/client-ses";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";

/**
 * @typedef {Object} EmailTemplate
 * @property {string} subject - Email subject
 * @property {(data: any) => string} html - HTML content generator function
 * @property {(data: any) => string} text - Plain text content generator function
 */

/**
 * Enhanced email templates for the application with username support
 * @type {Record<string, Record<string, EmailTemplate>>}
 */
export const emailTemplates = {
  account: {
    welcome: {
      subject: "Welcome to EduManager - Your Login Credentials",
      html: ({ name, email, username, verificationLink }) => `
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
            .credential-item { margin: 10px 0; padding: 10px; background: #f0f2ff; border-radius: 5px; }
            .credential-label { font-weight: bold; color: #667eea; }
            .credential-value { font-family: monospace; font-size: 16px; background: #fff; padding: 5px; border-radius: 3px; border: 1px solid #ddd; }
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
              <h2>Hello ${name}!</h2>
              
              <p>Welcome to EduManager! Your account has been successfully created. Below are your login credentials:</p>
              
              <div class="credentials">
                <h3>📋 Your Login Credentials</h3>
                
                <div class="credential-item">
                  <div class="credential-label">Username:</div>
                  <div class="credential-value">${username}</div>
                </div>
                
                <div class="credential-item">
                  <div class="credential-label">Email:</div>
                  <div class="credential-value">${email}</div>
                </div>
                
                <div class="credential-item">
                  <div class="credential-label">Password:</div>
                  <div class="credential-value">The password you created during registration</div>
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> You can login using either your <strong>username</strong> or <strong>email address</strong> with your password.
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Click the verification button below to verify your email</li>
                <li>Use your username (<strong>${username}</strong>) and password to login</li>
                <li>Complete your profile setup</li>
                <li>Start using EduManager!</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">
                  ✅ Verify Email Address
                </a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
              
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
      text: ({ name, email, username, verificationLink }) => `
        Welcome to EduManager, ${name}!
        
        Your account has been successfully created.
        
        Login Credentials:
        Username: ${username}
        Email: ${email}
        Password: The password you created during registration
        
        You can login using either your username or email address.
        
        Please verify your email by clicking this link:
        ${verificationLink}
        
        Welcome to EduManager!
      `,
    },
  },

  auth: {
    passwordReset: {
      subject: "Password Reset Request - EduManager",
      html: ({ name, resetLink, expirationTime }) => `
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
              <h2>Hello ${name}!</h2>
              
              <p>You have requested to reset your password for your EduManager account.</p>
              
              <p>Click the button below to set a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">
                  🔄 Reset Password
                </a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #dc3545;">${resetLink}</p>
              
              <div class="warning">
                <strong>⏰ Important:</strong> This link will expire in ${
                  expirationTime || "1 hour"
                } for security reasons.
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
      text: ({ name, resetLink, expirationTime }) => `
        Password Reset Request - EduManager
        
        Hello ${name}!
        
        You have requested to reset your password for your EduManager account.
        
        Click this link to set a new password:
        ${resetLink}
        
        This link will expire in ${
          expirationTime || "1 hour"
        } for security reasons.
        
        If you didn't request this password reset, please ignore this email.
        
        EduManager Security Team
      `,
    },

    verification: {
      subject: "Email Verification - EduManager",
      html: ({ name, verificationLink }) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - EduManager</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✉️ Email Verification</h1>
              <p>EduManager Account Verification</p>
            </div>
            
            <div class="content">
              <h2>Hello ${name}!</h2>
              
              <p>Please verify your email address to complete your account setup.</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">
                  ✅ Verify Email Address
                </a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #28a745;">${verificationLink}</p>
            </div>
            
            <div class="footer">
              <p>© 2025 EduManager. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: ({ name, verificationLink }) => `
        Email Verification - EduManager
        
        Hello ${name}!
        
        Please verify your email address to complete your account setup.
        
        Click this link to verify:
        ${verificationLink}
        
        EduManager Team
      `,
    },
  },

  assignment: {
    notification: {
      subject: "New Assignment Posted - EduManager",
      html: ({ title, dueDate, description, courseName, link }) => `
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
              <p>${courseName}</p>
            </div>
            
            <div class="content">
              <div class="assignment-details">
                <h2>${title}</h2>
                <p><strong>Due Date:</strong> ${dueDate}</p>
                <p><strong>Description:</strong></p>
                <p>${description}</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${link}" class="button">
                  📋 View Assignment Details
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: ({ title, dueDate, description, courseName, link }) => `
        New Assignment Posted - ${courseName}
        
        Assignment: ${title}
        Due Date: ${dueDate}
        
        Description: ${description}
        
        View assignment: ${link}
      `,
    },
  },

  grade: {
    notification: {
      subject: "Grade Update - EduManager",
      html: ({ courseName, assignmentTitle, grade, link }) => `
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
              <p>${courseName}</p>
            </div>
            
            <div class="content">
              <div class="grade-details">
                <h2>${assignmentTitle}</h2>
                <div class="grade-score">${grade}</div>
              </div>
              
              <div style="text-align: center;">
                <a href="${link}" class="button">
                  📈 View Detailed Results
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: ({ courseName, assignmentTitle, grade, link }) => `
        New Grade Posted - ${courseName}
        
        Assignment: ${assignmentTitle}
        Grade: ${grade}
        
        View details: ${link}
      `,
    },
  },
};

// Validate required environment variables
const requiredEnvVars = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_S3_BUCKET",
  "AWS_SES_SOURCE_EMAIL",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    logger.warn(`${varName} is not defined in environment variables`);
  }
});

class AWSService {
  // Define rate limits as instance property
  rateLimits = {
    maxEmailsPerSecond: 14, // AWS SES limit
    maxBulkEmails: 50,
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  };

  /** @type {S3Client | undefined} */
  s3Client;

  /** @type {SESClient | undefined} */
  sesClient;

  /** @type {string | undefined} */
  bucketName;

  /** @type {string | undefined} */
  emailSource;

  /** @type {boolean} */
  isConfigured;

  constructor() {
    // Only initialize if AWS credentials are available
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: defaultProvider(),
      });

      this.sesClient = new SESClient({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: defaultProvider(),
      });

      this.bucketName = process.env.AWS_S3_BUCKET;
      this.emailSource = process.env.AWS_SES_SOURCE_EMAIL;
      this.isConfigured = true;
    } else {
      logger.warn("AWS credentials not found, AWS services will be disabled");
      this.isConfigured = false;
    }
  }

  /**
   * Upload file to S3
   * @param {string} key - File key/path
   * @param {Buffer|Uint8Array|string} body - File content
   * @param {string} contentType - File MIME type
   */
  async uploadFile(key, body, contentType) {
    if (!this.isConfigured || !this.s3Client) {
      throw new ApiError(500, "AWS S3 is not configured");
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      logger.info(`File uploaded successfully: ${key}`);
    } catch (error) {
      logger.error("S3 upload error:", error);
      throw new ApiError(500, "File upload failed");
    }
  }

  /**
   * Delete file from S3
   * @param {string} key - File key/path
   */
  async deleteFile(key) {
    if (!this.isConfigured || !this.s3Client) {
      throw new ApiError(500, "AWS S3 is not configured");
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      logger.error("S3 delete error:", error);
      throw new ApiError(500, "File deletion failed");
    }
  }

  /**
   * Send email using SES
   * @param {string[]|string} toAddresses - Recipients (string or array)
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML content
   * @param {string} textBody - Plain text content
   */
  async sendEmail(toAddresses, subject, htmlBody, textBody) {
    if (!this.isConfigured || !this.sesClient) {
      logger.warn("AWS SES is not configured, email not sent");
      return { success: false, message: "Email service not configured" };
    }

    try {
      // Ensure toAddresses is an array
      const recipients = Array.isArray(toAddresses)
        ? toAddresses
        : [toAddresses];

      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: recipients,
        },
        Message: {
          Body: {
            Html: { Data: htmlBody },
            Text: { Data: textBody },
          },
          Subject: { Data: subject },
        },
        Source: this.emailSource,
      });

      const result = await this.sesClient.send(command);
      logger.info(`Email sent successfully to: ${recipients.join(", ")}`);
      return { success: true, messageId: result.MessageId };
    } catch (error) {
      logger.error("SES send error:", error);
      throw new ApiError(500, "Email sending failed");
    }
  }

  /**
   * Send templated email using SES
   * @param {string[]} toAddresses - Array of recipient email addresses
   * @param {string} templateName - SES template name
   * @param {object} templateData - Template data
   * @throws {ApiError}
   */
  async sendTemplatedEmail(toAddresses, templateName, templateData) {
    if (!this.isConfigured || !this.sesClient) {
      throw new ApiError(500, "AWS SES is not configured");
    }

    try {
      const command = new SendTemplatedEmailCommand({
        Destination: {
          ToAddresses: toAddresses,
        },
        Template: templateName,
        TemplateData: JSON.stringify(templateData),
        Source: this.emailSource,
      });

      const result = await this.sesClient.send(command);
      logger.info(
        `Template email sent successfully to: ${toAddresses.join(", ")}`
      );
      return result;
    } catch (error) {
      logger.error("SES template send error:", error);
      throw new ApiError(500, "Template email sending failed");
    }
  }

  /**
   * Get signed URL for S3 object
   * @param {string} key - File key/path
   * @param {number} expiresIn - Expiration time in seconds
   */
  async getSignedUrl(key, expiresIn = 3600) {
    if (!this.isConfigured || !this.s3Client) {
      throw new ApiError(500, "AWS S3 is not configured");
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      logger.error("Failed to generate signed URL:", error);
      throw new ApiError(500, "Failed to generate signed URL");
    }
  }

  /**
   * Send bulk emails with rate limiting
   * @param {string[]} toAddresses - Array of recipient email addresses
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML email content
   * @param {string} textBody - Plain text email content
   * @throws {ApiError}
   */
  async sendBulkEmail(toAddresses, subject, htmlBody, textBody) {
    if (!this.isConfigured || !this.sesClient) {
      throw new ApiError(500, "AWS SES is not configured");
    }

    try {
      const chunks = this._chunkArray(
        toAddresses,
        this.rateLimits.maxBulkEmails
      );
      const results = [];

      for (const chunk of chunks) {
        const result = await this.sendEmail(chunk, subject, htmlBody, textBody);
        results.push(result);
        // Rate limiting delay
        await new Promise((resolve) =>
          setTimeout(resolve, this.rateLimits.retryDelay)
        );
      }

      logger.info(
        `Bulk email sent successfully to ${toAddresses.length} recipients`
      );
      return results;
    } catch (error) {
      logger.error("Bulk email sending failed:", error);
      throw new ApiError(500, "Bulk email sending failed");
    }
  }

  /**
   * Split array into chunks for batch processing
   * @param {Array<any>} array - Array to split
   * @param {number} size - Chunk size
   * @returns {Array<Array<any>>}
   * @private
   */
  _chunkArray(array, size) {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }

  /**
   * Verify SES configuration and sending capabilities
   * @returns {Promise<void>}
   * @throws {ApiError}
   */
  async verifySESConfiguration() {
    if (!this.isConfigured || !this.sesClient) {
      throw new ApiError(500, "AWS SES is not configured");
    }

    try {
      // Check if email source is configured
      if (!this.emailSource) {
        throw new ApiError(500, "Email source is not configured");
      }

      // Get SES quota
      const quotaCommand = new GetSendQuotaCommand({});
      const quota = await this.sesClient.send(quotaCommand);
      logger.info("SES quota:", quota);

      // Verify email identity
      const verifyCommand = new GetIdentityVerificationAttributesCommand({
        Identities: [this.emailSource],
      });

      const verified = await this.sesClient.send(verifyCommand);

      // Safe check for verification attributes
      const verificationAttrs = verified.VerificationAttributes;
      if (!verificationAttrs || !verificationAttrs[this.emailSource]) {
        throw new ApiError(
          500,
          `Email ${this.emailSource} verification status not found`
        );
      }

      const status = verificationAttrs[this.emailSource].VerificationStatus;
      if (status !== "Success") {
        throw new ApiError(
          500,
          `Email ${this.emailSource} is not verified (status: ${status})`
        );
      }

      logger.info("SES configuration verified successfully");
    } catch (error) {
      logger.error("SES verification failed:", error);
      throw error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to verify email configuration");
    }
  }

  /**
   * Check if AWS services are configured and available
   * @returns {boolean}
   */
  isAWSConfigured() {
    return this.isConfigured;
  }
}

/** @type {AWSService} */
const awsService = new AWSService();
export default awsService;
