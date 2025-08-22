// server/src/services/notification.service.js
import { withRequestContext } from "../config/database.js";
import emailService from "./email.service.js";
import logger from "../utils/logger.js";

const notificationLogger = logger.child({ module: "notification-service" });

export class NotificationService {
  constructor(db) {
    this.db = db;
  }

  async createNotification({
    recipientId,
    title,
    message,
    type = "info",
    priority = "normal",
    actionUrl = null,
    actionText = null,
    sendEmail = false,
    createdBy = null,
  }) {
    try {
      const result = await this.db.query(
        `
        INSERT INTO notifications (recipient_id, title, message, type, priority, action_url, action_text, status, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'unread', $8, CURRENT_TIMESTAMP)
        RETURNING *
      `,
        [
          recipientId,
          title,
          message,
          type,
          priority,
          actionUrl,
          actionText,
          createdBy,
        ]
      );

      const notification = result.rows[0];

      // Send email if requested
      if (sendEmail) {
        await this.sendEmailNotification(notification);
      }

      notificationLogger.info("Notification created", {
        notificationId: notification.id,
        recipientId,
        type,
        sendEmail,
      });

      return notification;
    } catch (error) {
      notificationLogger.error("Failed to create notification", {
        error: error.message,
        recipientId,
        type,
      });
      throw error;
    }
  }

  async sendEmailNotification(notification) {
    try {
      // Get recipient details
      const recipient = await this.db.query(
        "SELECT email, name FROM users WHERE id = $1",
        [notification.recipient_id]
      );

      if (recipient.rows.length === 0) {
        throw new Error("RECIPIENT_NOT_FOUND");
      }

      const { email, name } = recipient.rows[0];

      // Create email content using your existing email service format
      const emailContent = this.generateNotificationEmailContent(
        notification,
        name
      );

      const result = await emailService.sendEmail({
        to: email,
        subject: notification.title,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (result.success) {
        // Update notification to mark email as sent
        await this.db.query(
          "UPDATE notifications SET email_sent = true, email_sent_at = CURRENT_TIMESTAMP WHERE id = $1",
          [notification.id]
        );

        notificationLogger.info("Email notification sent", {
          notificationId: notification.id,
          email,
          messageId: result.messageId,
        });
      } else {
        notificationLogger.warn("Email notification failed", {
          notificationId: notification.id,
          email,
          error: result.error,
        });
      }
    } catch (error) {
      notificationLogger.error("Failed to send email notification", {
        error: error.message,
        notificationId: notification.id,
      });
      // Don't throw here - notification was created successfully
    }
  }

  generateNotificationEmailContent(notification, recipientName) {
    const actionButton = notification.action_url
      ? `<a href="${
          notification.action_url
        }" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: transform 0.2s ease;">${
          notification.action_text || "View Details"
        }</a>`
      : "";

    const typeIcon = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      assignment: "📝",
      grade: "📊",
      attendance: "📅",
      enrollment: "🎓",
      reminder: "⏰",
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
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
          .content { 
            padding: 40px 30px; 
          }
          .notification-type { 
            display: inline-block; 
            background-color: #f7fafc; 
            color: #4a5568; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: 600; 
            margin-bottom: 20px;
          }
          .message-content { 
            background-color: #f7fafc; 
            border-left: 4px solid #667eea; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
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
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>${typeIcon[notification.type] || "ℹ️"} ${
      notification.title
    }</h1>
            <p>School Management System</p>
          </div>
          
          <div class="content">
            <p>Hello <strong>${recipientName}</strong>,</p>
            
            <div class="notification-type">
              ${
                notification.type.charAt(0).toUpperCase() +
                notification.type.slice(1)
              } • ${
      notification.priority.charAt(0).toUpperCase() +
      notification.priority.slice(1)
    } Priority
            </div>
            
            <div class="message-content">
              ${notification.message}
            </div>
            
            ${
              actionButton
                ? `<div style="text-align: center;">${actionButton}</div>`
                : ""
            }
            
            <p style="margin-top: 30px; color: #718096; font-size: 14px;">
              This notification was sent at ${new Date(
                notification.created_at
              ).toLocaleString()}
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-text">
              © ${new Date().getFullYear()} School Management System. All rights reserved.<br>
              This is an automated notification, please do not reply to this email.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${typeIcon[notification.type] || "ℹ️"} ${notification.title}

Hello ${recipientName},

${notification.message}

${notification.action_url ? `\nView details: ${notification.action_url}` : ""}

Type: ${notification.type} • Priority: ${notification.priority}
Sent: ${new Date(notification.created_at).toLocaleString()}

---
This is an automated notification from the School Management System.
    `.trim();

    return { html, text };
  }

  async broadcastNotification({
    userIds = [],
    roles = [],
    classIds = [],
    title,
    message,
    type = "info",
    priority = "normal",
    actionUrl = null,
    actionText = null,
    sendEmail = false,
    createdBy = null,
  }) {
    try {
      let recipients = [];

      // Get users by IDs
      if (userIds.length > 0) {
        const userRecipients = await this.db.query(
          "SELECT id FROM users WHERE id = ANY($1) AND status = $2",
          [userIds, "active"]
        );
        recipients.push(...userRecipients.rows.map((row) => row.id));
      }

      // Get users by roles
      if (roles.length > 0) {
        const roleRecipients = await this.db.query(
          "SELECT id FROM users WHERE role = ANY($1) AND status = $2",
          [roles, "active"]
        );
        recipients.push(...roleRecipients.rows.map((row) => row.id));
      }

      // Get users by class enrollment
      if (classIds.length > 0) {
        const classRecipients = await this.db.query(
          `
          SELECT DISTINCT u.id 
          FROM users u
          JOIN enrollments e ON u.id = e.student_id
          WHERE e.class_id = ANY($1) AND e.status = 'active' AND u.status = 'active'
        `,
          [classIds]
        );
        recipients.push(...classRecipients.rows.map((row) => row.id));

        // Also include teachers of these classes
        const teacherRecipients = await this.db.query(
          `
          SELECT DISTINCT teacher_id as id
          FROM classes
          WHERE id = ANY($1) AND status = 'active'
        `,
          [classIds]
        );
        recipients.push(...teacherRecipients.rows.map((row) => row.id));
      }

      // Remove duplicates
      recipients = [...new Set(recipients)];

      const createdNotifications = [];
      const failedNotifications = [];

      // Create notification for each recipient
      for (const recipientId of recipients) {
        try {
          const notification = await this.createNotification({
            recipientId,
            title,
            message,
            type,
            priority,
            actionUrl,
            actionText,
            sendEmail,
            createdBy,
          });
          createdNotifications.push(notification);
        } catch (error) {
          failedNotifications.push({
            recipientId,
            error: error.message,
          });
        }
      }

      notificationLogger.info("Broadcast notification completed", {
        totalRecipients: recipients.length,
        successful: createdNotifications.length,
        failed: failedNotifications.length,
        title,
      });

      return {
        successful: createdNotifications,
        failed: failedNotifications,
        summary: {
          total: recipients.length,
          successCount: createdNotifications.length,
          failedCount: failedNotifications.length,
        },
      };
    } catch (error) {
      notificationLogger.error("Failed to broadcast notification", {
        error: error.message,
        title,
      });
      throw error;
    }
  }

  async getUserNotifications(userId, status = null, limit = 50, offset = 0) {
    try {
      let sql = `
        SELECT n.*, u.name as created_by_name
        FROM notifications n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE n.recipient_id = $1
      `;

      const params = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        sql += ` AND n.status = $${paramCount}`;
        params.push(status);
      }

      sql += ` ORDER BY n.created_at DESC LIMIT $${paramCount + 1} OFFSET $${
        paramCount + 2
      }`;
      params.push(limit, offset);

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      notificationLogger.error("Failed to get user notifications", {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const result = await this.db.query(
        `
        UPDATE notifications 
        SET status = 'read', read_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND recipient_id = $2 AND status = 'unread'
        RETURNING *
      `,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("NOTIFICATION_NOT_FOUND_OR_ALREADY_READ");
      }

      notificationLogger.info("Notification marked as read", {
        notificationId,
        userId,
      });

      return result.rows[0];
    } catch (error) {
      notificationLogger.error("Failed to mark notification as read", {
        error: error.message,
        notificationId,
        userId,
      });
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      const result = await this.db.query(
        `
        UPDATE notifications 
        SET status = 'read', read_at = CURRENT_TIMESTAMP
        WHERE recipient_id = $1 AND status = 'unread'
        RETURNING count(*) as updated_count
      `,
        [userId]
      );

      const updatedCount = result.rowCount;

      notificationLogger.info("All notifications marked as read", {
        userId,
        updatedCount,
      });

      return { updatedCount };
    } catch (error) {
      notificationLogger.error("Failed to mark all notifications as read", {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const result = await this.db.query(
        `
        DELETE FROM notifications 
        WHERE id = $1 AND recipient_id = $2
        RETURNING *
      `,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("NOTIFICATION_NOT_FOUND");
      }

      notificationLogger.info("Notification deleted", {
        notificationId,
        userId,
      });

      return result.rows[0];
    } catch (error) {
      notificationLogger.error("Failed to delete notification", {
        error: error.message,
        notificationId,
        userId,
      });
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const result = await this.db.query(
        "SELECT COUNT(*) as count FROM notifications WHERE recipient_id = $1 AND status = $2",
        [userId, "unread"]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      notificationLogger.error("Failed to get unread count", {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  // Predefined notification templates using your existing email service
  async notifyAssignmentCreated(assignment, enrolledStudents) {
    const notifications = [];

    for (const student of enrolledStudents) {
      try {
        const notification = await this.createNotification({
          recipientId: student.id,
          title: "New Assignment Posted",
          message: `A new assignment "${
            assignment.title
          }" has been posted for ${assignment.class_name}. Due: ${new Date(
            assignment.due_date
          ).toLocaleDateString()}`,
          type: "assignment",
          priority: "normal",
          actionUrl: `/assignments/${assignment.id}`,
          actionText: "View Assignment",
          sendEmail: false, // We'll send custom email
          createdBy: assignment.teacher_id,
        });

        // Send custom email using your email service
        await emailService.sendEmail({
          to: student.email,
          subject: `📝 New Assignment: ${assignment.title}`,
          html: this.generateAssignmentEmailHTML(assignment, student),
          text: this.generateAssignmentEmailText(assignment, student),
        });

        notifications.push(notification);
      } catch (error) {
        notificationLogger.error("Failed to notify student of new assignment", {
          error: error.message,
          studentId: student.id,
          assignmentId: assignment.id,
        });
      }
    }

    return notifications;
  }

  async notifyGradePosted(grade, student, assignment) {
    try {
      const notification = await this.createNotification({
        recipientId: student.id,
        title: "Grade Posted",
        message: `Your grade for "${assignment.title}" has been posted: ${grade.grade_letter} (${grade.percentage}%)`,
        type: "grade",
        priority: "normal",
        actionUrl: `/grades/${grade.id}`,
        actionText: "View Grade",
        sendEmail: false, // We'll send custom email
        createdBy: assignment.teacher_id,
      });

      // Send custom email using your email service
      await emailService.sendEmail({
        to: student.email,
        subject: `📊 Grade Posted: ${assignment.title}`,
        html: this.generateGradeEmailHTML(grade, student, assignment),
        text: this.generateGradeEmailText(grade, student, assignment),
      });

      return notification;
    } catch (error) {
      notificationLogger.error("Failed to notify student of grade", {
        error: error.message,
        studentId: student.id,
        gradeId: grade.id,
      });
      throw error;
    }
  }

  async notifyEnrollmentConfirmed(enrollment, student, classInfo) {
    try {
      const notification = await this.createNotification({
        recipientId: student.id,
        title: "Enrollment Confirmed",
        message: `You have been successfully enrolled in ${classInfo.name} (${classInfo.code})`,
        type: "enrollment",
        priority: "normal",
        actionUrl: `/classes/${classInfo.id}`,
        actionText: "View Class",
        sendEmail: false, // We'll send custom email
        createdBy: enrollment.enrolled_by,
      });

      // Send custom email using your email service
      await emailService.sendEmail({
        to: student.email,
        subject: `🎓 Enrollment Confirmed: ${classInfo.name}`,
        html: this.generateEnrollmentEmailHTML(enrollment, student, classInfo),
        text: this.generateEnrollmentEmailText(enrollment, student, classInfo),
      });

      return notification;
    } catch (error) {
      notificationLogger.error("Failed to notify student of enrollment", {
        error: error.message,
        studentId: student.id,
        classId: classInfo.id,
      });
      throw error;
    }
  }

  // Email template generators for custom notifications
  generateAssignmentEmailHTML(assignment, student) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .assignment-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin: 20px 0; }
          .assignment-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .assignment-meta { opacity: 0.9; margin-bottom: 20px; }
          .due-date { background-color: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 8px; display: inline-block; font-weight: 600; }
          .cta-button { display: inline-block; background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>📝 New Assignment Posted</h2>
          <p>Hello ${student.name},</p>
          
          <div class="assignment-card">
            <div class="assignment-title">${assignment.title}</div>
            <div class="assignment-meta">
              <strong>Class:</strong> ${assignment.class_name}<br>
              <strong>Teacher:</strong> ${assignment.teacher_name}
            </div>
            <div class="due-date">
              📅 Due: ${new Date(assignment.due_date).toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </div>
          </div>
          
          <p><strong>Description:</strong></p>
          <p>${
            assignment.description ||
            "See assignment details for more information."
          }</p>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/assignments/${
      assignment.id
    }" class="cta-button">View Assignment Details</a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Don't forget to submit your work before the deadline!
          </p>
        </div>
      </body>
      </html>
    `;
  }

  generateAssignmentEmailText(assignment, student) {
    return `
📝 New Assignment Posted

Hello ${student.name},

A new assignment has been posted for your class:

Assignment: ${assignment.title}
Class: ${assignment.class_name}
Teacher: ${assignment.teacher_name}
Due Date: ${new Date(assignment.due_date).toLocaleDateString()}

Description: ${
      assignment.description || "See assignment details for more information."
    }

View Assignment: ${process.env.CLIENT_URL}/assignments/${assignment.id}

Don't forget to submit your work before the deadline!
    `.trim();
  }

  generateGradeEmailHTML(grade, student, assignment) {
    const gradeColor =
      grade.percentage >= 90
        ? "#28a745"
        : grade.percentage >= 80
        ? "#ffc107"
        : grade.percentage >= 70
        ? "#fd7e14"
        : "#dc3545";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .grade-card { background-color: #f8f9fa; border-left: 6px solid ${gradeColor}; padding: 25px; border-radius: 8px; margin: 20px 0; }
          .grade-display { font-size: 36px; font-weight: bold; color: ${gradeColor}; text-align: center; margin: 20px 0; }
          .assignment-info { background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .feedback-section { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>📊 Grade Posted</h2>
          <p>Hello ${student.name},</p>
          
          <div class="grade-card">
            <div class="assignment-info">
              <strong>Assignment:</strong> ${assignment.title}<br>
              <strong>Class:</strong> ${assignment.class_name}
            </div>
            
            <div class="grade-display">${grade.grade_letter}</div>
            <div style="text-align: center; color: ${gradeColor}; font-size: 18px; font-weight: 600;">
              ${grade.score}/${assignment.max_points} points (${
      grade.percentage
    }%)
            </div>
            
            ${
              grade.comments
                ? `
              <div class="feedback-section">
                <strong>Teacher Feedback:</strong><br>
                ${grade.comments}
              </div>
            `
                : ""
            }
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/grades/${
      grade.id
    }" style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px;">View Detailed Grade Report</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateGradeEmailText(grade, student, assignment) {
    return `
📊 Grade Posted

Hello ${student.name},

Your grade has been posted for:

Assignment: ${assignment.title}
Class: ${assignment.class_name}
Grade: ${grade.grade_letter} (${grade.percentage}%)
Score: ${grade.score}/${assignment.max_points} points

${grade.comments ? `Teacher Feedback: ${grade.comments}` : ""}

View Detailed Grade Report: ${process.env.CLIENT_URL}/grades/${grade.id}
    `.trim();
  }

  generateEnrollmentEmailHTML(enrollment, student, classInfo) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .enrollment-card { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 12px; margin: 20px 0; }
          .class-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .class-info { background-color: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🎓 Enrollment Confirmed</h2>
          <p>Hello ${student.name},</p>
          
          <div class="enrollment-card">
            <div class="class-title">${classInfo.name}</div>
            <div class="class-info">
              <strong>Course Code:</strong> ${classInfo.code}<br>
              <strong>Teacher:</strong> ${classInfo.teacher_name}<br>
              <strong>Department:</strong> ${
                classInfo.department_name || "General"
              }<br>
              <strong>Enrolled:</strong> ${new Date(
                enrollment.enrollment_date
              ).toLocaleDateString()}
            </div>
            <p style="margin-top: 20px; opacity: 0.9;">
              Welcome to the class! You can now access assignments, view grades, and participate in class activities.
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/classes/${
      classInfo.id
    }" style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px;">Go to Class</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateEnrollmentEmailText(enrollment, student, classInfo) {
    return `
🎓 Enrollment Confirmed

Hello ${student.name},

You have been successfully enrolled in:

Class: ${classInfo.name}
Course Code: ${classInfo.code}
Teacher: ${classInfo.teacher_name}
Department: ${classInfo.department_name || "General"}
Enrolled: ${new Date(enrollment.enrollment_date).toLocaleDateString()}

Welcome to the class! You can now access assignments, view grades, and participate in class activities.

Go to Class: ${process.env.CLIENT_URL}/classes/${classInfo.id}

Welcome aboard!
    `.trim();
  }

  async notifyAssignmentDueSoon(assignment, enrolledStudents, daysUntilDue) {
    const notifications = [];

    for (const student of enrolledStudents) {
      try {
        const notification = await this.createNotification({
          recipientId: student.id,
          title: "Assignment Due Soon",
          message: `Assignment "${assignment.title}" is due in ${daysUntilDue} day(s). Don't forget to submit!`,
          type: "reminder",
          priority: "high",
          actionUrl: `/assignments/${assignment.id}`,
          actionText: "Submit Assignment",
          sendEmail: false, // We'll send custom email
        });

        // Send custom reminder email
        await emailService.sendEmail({
          to: student.email,
          subject: `⏰ Reminder: ${assignment.title} Due Soon`,
          html: this.generateReminderEmailHTML(
            assignment,
            student,
            daysUntilDue
          ),
          text: this.generateReminderEmailText(
            assignment,
            student,
            daysUntilDue
          ),
        });

        notifications.push(notification);
      } catch (error) {
        notificationLogger.error("Failed to notify student of due assignment", {
          error: error.message,
          studentId: student.id,
          assignmentId: assignment.id,
        });
      }
    }

    return notifications;
  }

  async notifyAttendanceMarked(attendance, student, classInfo) {
    try {
      if (attendance.status === "absent") {
        return await this.createNotification({
          recipientId: student.id,
          title: "Absence Recorded",
          message: `You were marked absent for ${classInfo.name} on ${new Date(
            attendance.date
          ).toLocaleDateString()}`,
          type: "attendance",
          priority: "normal",
          actionUrl: `/attendance`,
          actionText: "View Attendance",
          sendEmail: false, // Usually don't email for absences
          createdBy: attendance.marked_by,
        });
      }
    } catch (error) {
      notificationLogger.error("Failed to notify student of attendance", {
        error: error.message,
        studentId: student.id,
        attendanceId: attendance.id,
      });
      throw error;
    }
  }

  generateReminderEmailHTML(assignment, student, daysUntilDue) {
    const urgencyColor =
      daysUntilDue <= 1 ? "#dc3545" : daysUntilDue <= 3 ? "#fd7e14" : "#ffc107";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .reminder-card { background-color: #fff3cd; border: 2px solid ${urgencyColor}; padding: 25px; border-radius: 12px; margin: 20px 0; }
          .urgency-banner { background-color: ${urgencyColor}; color: white; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; margin-bottom: 20px; }
          .countdown { font-size: 32px; font-weight: bold; color: ${urgencyColor}; text-align: center; margin: 20px 0; }
          .submit-button { display: inline-block; background-color: ${urgencyColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>⏰ Assignment Due Soon</h2>
          <p>Hello ${student.name},</p>
          
          <div class="urgency-banner">
            ${
              daysUntilDue <= 1 ? "🚨 URGENT REMINDER" : "⚠️ IMPORTANT REMINDER"
            }
          </div>
          
          <div class="reminder-card">
            <h3>${assignment.title}</h3>
            <p><strong>Class:</strong> ${assignment.class_name}</p>
            
            <div class="countdown">
              ${
                daysUntilDue === 0
                  ? "DUE TODAY!"
                  : daysUntilDue === 1
                  ? "DUE TOMORROW!"
                  : `${daysUntilDue} DAYS LEFT`
              }
            </div>
            
            <p><strong>Due Date:</strong> ${new Date(
              assignment.due_date
            ).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/assignments/${
      assignment.id
    }" class="submit-button">
              ${daysUntilDue <= 1 ? "SUBMIT NOW" : "VIEW ASSIGNMENT"}
            </a>
          </div>
          
          <p style="margin-top: 30px; padding: 15px; background-color: #d1ecf1; border-left: 4px solid #bee5eb; border-radius: 4px;">
            <strong>💡 Tip:</strong> Submit early to avoid last-minute technical issues!
          </p>
        </div>
      </body>
      </html>
    `;
  }

  generateReminderEmailText(assignment, student, daysUntilDue) {
    return `
⏰ Assignment Due Soon

Hello ${student.name},

${daysUntilDue <= 1 ? "🚨 URGENT REMINDER" : "⚠️ IMPORTANT REMINDER"}

Assignment: ${assignment.title}
Class: ${assignment.class_name}
Due Date: ${new Date(assignment.due_date).toLocaleDateString()}

${
  daysUntilDue === 0
    ? "DUE TODAY!"
    : daysUntilDue === 1
    ? "DUE TOMORROW!"
    : `${daysUntilDue} DAYS LEFT`
}

${daysUntilDue <= 1 ? "SUBMIT NOW:" : "View Assignment:"} ${
      process.env.CLIENT_URL
    }/assignments/${assignment.id}

💡 Tip: Submit early to avoid last-minute technical issues!
    `.trim();
  }

  async getNotificationStatistics(
    userId = null,
    startDate = null,
    endDate = null
  ) {
    try {
      let sql = `
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread_count,
          COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count,
          COUNT(CASE WHEN type = 'assignment' THEN 1 END) as assignment_notifications,
          COUNT(CASE WHEN type = 'grade' THEN 1 END) as grade_notifications,
          COUNT(CASE WHEN type = 'attendance' THEN 1 END) as attendance_notifications,
          COUNT(CASE WHEN email_sent = true THEN 1 END) as emails_sent
        FROM notifications
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (userId) {
        paramCount++;
        sql += ` AND recipient_id = $${paramCount}`;
        params.push(userId);
      }

      if (startDate) {
        paramCount++;
        sql += ` AND created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        sql += ` AND created_at <= $${paramCount}`;
        params.push(endDate);
      }

      const result = await this.db.query(sql, params);
      return result.rows[0];
    } catch (error) {
      notificationLogger.error("Failed to get notification statistics", {
        error: error.message,
      });
      throw error;
    }
  }

  async cleanupOldNotifications(daysOld = 90) {
    try {
      const result = await this.db.query(`
        DELETE FROM notifications 
        WHERE created_at < CURRENT_DATE - INTERVAL '${daysOld} days'
        AND status = 'read'
      `);

      notificationLogger.info("Old notifications cleaned up", {
        deletedCount: result.rowCount,
        daysOld,
      });

      return { deletedCount: result.rowCount };
    } catch (error) {
      notificationLogger.error("Failed to cleanup old notifications", {
        error: error.message,
      });
      throw error;
    }
  }
}

// Factory function for dependency injection
export const createNotificationService = (req) => {
  const db = withRequestContext(req);
  return new NotificationService(db);
};
