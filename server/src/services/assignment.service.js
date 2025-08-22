// server/src/services/assignment.service.js - Complete with new methods
import { withRequestContext } from "../config/database.js";
import logger from "../utils/logger.js";

const assignmentLogger = logger.child({ module: "assignment-service" });

export class AssignmentService {
  constructor(db) {
    this.db = db;
  }

  async createAssignment({
    title,
    description,
    classId,
    teacherId,
    dueDate,
    maxPoints,
    type = "homework",
  }) {
    try {
      // Validate teacher has access to class
      await this.validateTeacherAccess(teacherId, classId);

      // Check due date is in future
      if (new Date(dueDate) <= new Date()) {
        throw new Error("DUE_DATE_MUST_BE_FUTURE");
      }

      const result = await this.db.query(
        `
        INSERT INTO assignments (title, description, class_id, teacher_id, due_date, max_points, type, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', CURRENT_TIMESTAMP)
        RETURNING *
      `,
        [title, description, classId, teacherId, dueDate, maxPoints, type]
      );

      const assignment = result.rows[0];

      // Notify enrolled students
      await this.notifyStudentsOfNewAssignment(assignment);

      assignmentLogger.info("Assignment created successfully", {
        assignmentId: assignment.id,
        classId,
        teacherId,
      });

      return assignment;
    } catch (error) {
      assignmentLogger.error("Failed to create assignment", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }

  async validateTeacherAccess(teacherId, classId) {
    const result = await this.db.query(
      "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );

    if (result.rows.length === 0) {
      throw new Error("UNAUTHORIZED_CLASS_ACCESS");
    }
  }

  /**
   * NEW METHOD: Validate teacher access to assignment specifically
   * @param {string} teacherId - Teacher ID
   * @param {string} assignmentId - Assignment ID
   * @throws {Error} If teacher doesn't have access
   */
  async validateTeacherAccessToAssignment(teacherId, assignmentId) {
    const result = await this.db.query(
      `
      SELECT a.id 
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE a.id = $1 AND c.teacher_id = $2
    `,
      [assignmentId, teacherId]
    );

    if (result.rows.length === 0) {
      throw new Error("UNAUTHORIZED_CLASS_ACCESS");
    }
  }

  async notifyStudentsOfNewAssignment(assignment) {
    // Get all enrolled students
    const students = await this.db.query(
      `
      SELECT u.id, u.email, u.name 
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.class_id = $1 AND e.status = 'active' AND u.status = 'active'
    `,
      [assignment.class_id]
    );

    // Here you would integrate with notification service
    assignmentLogger.info("Notifying students of new assignment", {
      assignmentId: assignment.id,
      studentCount: students.rows.length,
    });

    // TODO: Implement notification logic
    // await notificationService.sendAssignmentNotification(students.rows, assignment);
  }

  async submitAssignment(assignmentId, studentId, submissionData) {
    try {
      // Check assignment exists and is still open
      const assignment = await this.getAssignmentById(assignmentId);

      if (new Date(assignment.due_date) < new Date()) {
        throw new Error("ASSIGNMENT_DEADLINE_PASSED");
      }

      // Check student is enrolled in class
      await this.validateStudentEnrollment(studentId, assignment.class_id);

      // Create or update submission
      const result = await this.db.query(
        `
        INSERT INTO submissions (assignment_id, student_id, submission_text, attachments, submitted_at, status)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'submitted')
        ON CONFLICT (assignment_id, student_id)
        DO UPDATE SET 
          submission_text = $3, 
          attachments = $4, 
          submitted_at = CURRENT_TIMESTAMP, 
          status = 'submitted'
        RETURNING *
      `,
        [
          assignmentId,
          studentId,
          submissionData.text || "",
          JSON.stringify(submissionData.attachments || []),
        ]
      );

      assignmentLogger.info("Assignment submitted successfully", {
        assignmentId,
        studentId,
        submissionId: result.rows[0].id,
      });

      return result.rows[0];
    } catch (error) {
      assignmentLogger.error("Failed to submit assignment", {
        error: error.message,
        assignmentId,
        studentId,
      });
      throw error;
    }
  }

  async validateStudentEnrollment(studentId, classId) {
    const result = await this.db.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2 AND status = $3",
      [studentId, classId, "active"]
    );

    if (result.rows.length === 0) {
      throw new Error("STUDENT_NOT_ENROLLED");
    }
  }

  async gradeSubmission(submissionId, teacherId, score, feedback) {
    try {
      // Get submission and assignment details
      const submission = await this.getSubmissionById(submissionId);
      const assignment = await this.getAssignmentById(submission.assignment_id);

      // Validate teacher can grade this assignment
      if (assignment.teacher_id !== teacherId) {
        throw new Error("UNAUTHORIZED_TO_GRADE");
      }

      // Validate score
      if (score > assignment.max_points || score < 0) {
        throw new Error("INVALID_SCORE_RANGE");
      }

      // Calculate percentage and letter grade
      const percentage = Math.round((score / assignment.max_points) * 100);
      const letterGrade = this.calculateLetterGrade(percentage);

      // Update submission and create grade record in transaction
      await this.db.query("BEGIN");

      try {
        // Update submission
        await this.db.query(
          `
          UPDATE submissions
          SET status = 'graded', feedback = $1, graded_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `,
          [feedback, submissionId]
        );

        // Create/update grade record
        await this.db.query(
          `
          INSERT INTO grades (student_id, class_id, assignment_id, submission_id, score, max_score, percentage, grade_letter, comments, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
          ON CONFLICT (assignment_id, student_id)
          DO UPDATE SET 
            score = $5, 
            percentage = $7, 
            grade_letter = $8, 
            comments = $9,
            updated_at = CURRENT_TIMESTAMP
        `,
          [
            submission.student_id,
            assignment.class_id,
            assignment.id,
            submissionId,
            score,
            assignment.max_points,
            percentage,
            letterGrade,
            feedback,
          ]
        );

        await this.db.query("COMMIT");

        // Notify student of grade
        await this.notifyStudentOfGrade(
          submission.student_id,
          assignment.title,
          letterGrade
        );

        assignmentLogger.info("Submission graded successfully", {
          submissionId,
          teacherId,
          score,
          letterGrade,
        });

        return { score, percentage, letterGrade, feedback };
      } catch (error) {
        await this.db.query("ROLLBACK");
        throw error;
      }
    } catch (error) {
      assignmentLogger.error("Failed to grade submission", {
        error: error.message,
        submissionId,
        teacherId,
      });
      throw error;
    }
  }

  calculateLetterGrade(percentage) {
    if (percentage >= 97) return "A+";
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 65) return "D";
    return "F";
  }

  async notifyStudentOfGrade(studentId, assignmentTitle, letterGrade) {
    // TODO: Implement notification logic
    assignmentLogger.info("Notifying student of grade", {
      studentId,
      assignmentTitle,
      letterGrade,
    });
  }

  async getAssignmentById(assignmentId) {
    const result = await this.db.query(
      `
      SELECT a.*, c.name as class_name, u.name as teacher_name
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN users u ON a.teacher_id = u.id
      WHERE a.id = $1
    `,
      [assignmentId]
    );

    if (result.rows.length === 0) {
      throw new Error("ASSIGNMENT_NOT_FOUND");
    }

    return result.rows[0];
  }

  async getSubmissionById(submissionId) {
    const result = await this.db.query(
      `
      SELECT s.*, a.title as assignment_title, a.max_points
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.id = $1
    `,
      [submissionId]
    );

    if (result.rows.length === 0) {
      throw new Error("SUBMISSION_NOT_FOUND");
    }

    return result.rows[0];
  }

  async getAssignmentsByClass(classId, teacherId = null) {
    let sql = `
      SELECT a.*, 
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id AND status = 'submitted') as ungraded_count
      FROM assignments a
      WHERE a.class_id = $1 AND a.status = 'active'
    `;

    const params = [classId];

    if (teacherId) {
      sql += " AND a.teacher_id = $2";
      params.push(teacherId);
    }

    sql += " ORDER BY a.due_date ASC";

    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async getStudentAssignments(studentId, classId = null) {
    let sql = `
      SELECT a.*, c.name as class_name, u.name as teacher_name,
        s.id as submission_id, s.status as submission_status, s.submitted_at,
        g.score, g.percentage, g.grade_letter
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN users u ON a.teacher_id = u.id
      JOIN enrollments e ON c.id = e.class_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      LEFT JOIN grades g ON a.id = g.assignment_id AND g.student_id = $1
      WHERE e.student_id = $1 AND e.status = 'active' AND a.status = 'active'
    `;

    const params = [studentId];

    if (classId) {
      sql += " AND a.class_id = $2";
      params.push(classId);
    }

    sql += " ORDER BY a.due_date ASC";

    const result = await this.db.query(sql, params);
    return result.rows;
  }

  /**
   * NEW METHOD: Get all submissions for an assignment with comprehensive data
   * @param {string} assignmentId - Assignment ID
   * @param {string} teacherId - Teacher ID for authorization
   * @param {string} status - Optional status filter ('submitted', 'graded', 'late')
   * @returns {Promise<Object>} Assignment and submissions data
   */
  async getAssignmentSubmissions(assignmentId, teacherId, status = null) {
    try {
      // First verify teacher has access to this assignment
      await this.validateTeacherAccessToAssignment(teacherId, assignmentId);

      // Get assignment details
      const assignmentResult = await this.db.query(
        `
        SELECT a.*, c.name as class_name, c.code as class_code
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = $1
      `,
        [assignmentId]
      );

      if (assignmentResult.rows.length === 0) {
        throw new Error("ASSIGNMENT_NOT_FOUND");
      }

      const assignment = assignmentResult.rows[0];

      // Build submissions query with optional status filter
      let submissionsQuery = `
        SELECT 
          s.id as submission_id,
          s.assignment_id,
          s.student_id,
          s.submission_text,
          s.attachments,
          s.submitted_at,
          s.status as submission_status,
          s.late_submission,
          s.created_at as submission_created_at,
          s.updated_at as submission_updated_at,
          u.username,
          u.name as student_name,
          u.first_name,
          u.last_name,
          u.email as student_email,
          g.id as grade_id,
          g.score,
          g.percentage,
          g.grade_letter,
          g.comments as grade_comments,
          g.graded_at,
          g.graded_by,
          grader.name as grader_name,
          CASE 
            WHEN s.submitted_at > a.due_date THEN true 
            ELSE false 
          END as is_late,
          EXTRACT(EPOCH FROM (s.submitted_at - a.due_date)) / 3600 as hours_late
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        JOIN assignments a ON s.assignment_id = a.id
        LEFT JOIN grades g ON s.id = g.submission_id
        LEFT JOIN users grader ON g.graded_by = grader.id
        WHERE s.assignment_id = $1
      `;

      const queryParams = [assignmentId];
      let paramCount = 1;

      // Add status filter if provided
      if (status) {
        paramCount++;
        submissionsQuery += ` AND s.status = $${paramCount}`;
        queryParams.push(status);
      }

      submissionsQuery += `
        ORDER BY 
          CASE WHEN s.status = 'graded' THEN 1 ELSE 0 END,
          s.submitted_at DESC
      `;

      const submissionsResult = await this.db.query(
        submissionsQuery,
        queryParams
      );

      // Get all enrolled students to identify missing submissions
      const enrolledStudentsResult = await this.db.query(
        `
        SELECT 
          u.id as student_id,
          u.username,
          u.name as student_name,
          u.first_name,
          u.last_name,
          u.email as student_email,
          e.enrollment_date
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.class_id = $1 AND e.status = 'active' AND u.status = 'active'
        ORDER BY u.name
      `,
        [assignment.class_id]
      );

      const enrolledStudents = enrolledStudentsResult.rows;
      const submissions = submissionsResult.rows;

      // Find students who haven't submitted
      const submittedStudentIds = new Set(submissions.map((s) => s.student_id));
      const missingSubmissions = enrolledStudents
        .filter((student) => !submittedStudentIds.has(student.student_id))
        .map((student) => ({
          student_id: student.student_id,
          username: student.username,
          student_name: student.student_name,
          first_name: student.first_name,
          last_name: student.last_name,
          student_email: student.student_email,
          enrollment_date: student.enrollment_date,
          submission_status: "not_submitted",
          submitted_at: null,
          is_late: new Date() > new Date(assignment.due_date),
          hours_past_due: (() => {
            const now = new Date();
            const dueDate = new Date(assignment.due_date);
            return now > dueDate
              ? (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60)
              : null;
          })(),
        }));

      // Calculate statistics
      const stats = {
        total_enrolled: enrolledStudents.length,
        total_submitted: submissions.length,
        total_missing: missingSubmissions.length,
        total_graded: submissions.filter((s) => s.grade_id).length,
        pending_grading: submissions.filter((s) => !s.grade_id).length,
        late_submissions: submissions.filter((s) => s.is_late).length,
        on_time_submissions: submissions.filter((s) => !s.is_late).length,
        submission_rate:
          enrolledStudents.length > 0
            ? Math.round((submissions.length / enrolledStudents.length) * 100)
            : 0,
        grading_rate:
          submissions.length > 0
            ? Math.round(
                (submissions.filter((s) => s.grade_id).length /
                  submissions.length) *
                  100
              )
            : 0,
      };

      // Grade statistics (only for graded submissions)
      const gradedSubmissions = submissions.filter((s) => s.grade_id);
      let gradeStats = null;

      if (gradedSubmissions.length > 0) {
        const scores = gradedSubmissions.map((s) => parseFloat(s.percentage));
        gradeStats = {
          average_score: (
            scores.reduce((a, b) => a + b, 0) / scores.length
          ).toFixed(2),
          highest_score: Math.max(...scores).toFixed(2),
          lowest_score: Math.min(...scores).toFixed(2),
          grade_distribution:
            this.calculateGradeDistribution(gradedSubmissions),
        };
      }

      assignmentLogger.info("Assignment submissions retrieved", {
        assignmentId,
        teacherId,
        totalSubmissions: submissions.length,
        missingSubmissions: missingSubmissions.length,
        statusFilter: status,
      });

      return {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          max_points: assignment.max_points,
          type: assignment.type,
          class_name: assignment.class_name,
          class_code: assignment.class_code,
          status: assignment.status,
        },
        submissions: submissions.map((s) => ({
          ...s,
          attachments: s.attachments ? JSON.parse(s.attachments) : [],
          hours_late: s.is_late
            ? parseFloat(s.hours_late || 0).toFixed(2)
            : null,
        })),
        missing_submissions: missingSubmissions,
        statistics: stats,
        grade_statistics: gradeStats,
      };
    } catch (error) {
      assignmentLogger.error("Failed to get assignment submissions", {
        error: error.message,
        assignmentId,
        teacherId,
      });
      throw error;
    }
  }

  /**
   * NEW METHOD: Helper method to calculate grade distribution
   * @param {Array} gradedSubmissions - Array of graded submissions
   * @returns {Object} Grade distribution
   */
  calculateGradeDistribution(gradedSubmissions) {
    const distribution = {
      "A+": 0,
      A: 0,
      "A-": 0,
      "B+": 0,
      B: 0,
      "B-": 0,
      "C+": 0,
      C: 0,
      "C-": 0,
      "D+": 0,
      D: 0,
      F: 0,
    };

    gradedSubmissions.forEach((submission) => {
      if (
        submission.grade_letter &&
        distribution.hasOwnProperty(submission.grade_letter)
      ) {
        distribution[submission.grade_letter]++;
      }
    });

    // Convert to percentages
    const total = gradedSubmissions.length;
    Object.keys(distribution).forEach((grade) => {
      distribution[grade] =
        total > 0 ? Math.round((distribution[grade] / total) * 100) : 0;
    });

    return distribution;
  }

  async updateAssignment(assignmentId, teacherId, updates) {
    // Validate teacher access
    const assignment = await this.getAssignmentById(assignmentId);
    if (assignment.teacher_id !== teacherId) {
      throw new Error("UNAUTHORIZED_TO_UPDATE");
    }

    const allowedFields = [
      "title",
      "description",
      "due_date",
      "max_points",
      "type",
    ];
    const setClause = [];
    const values = [];
    let paramCount = 0;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field) && value !== undefined) {
        paramCount++;
        setClause.push(`${field} = $${paramCount}`);
        values.push(value);
      }
    }

    if (setClause.length === 0) {
      throw new Error("NO_VALID_FIELDS_TO_UPDATE");
    }

    // Validate due date if being updated
    if (updates.due_date && new Date(updates.due_date) <= new Date()) {
      throw new Error("DUE_DATE_MUST_BE_FUTURE");
    }

    paramCount++;
    values.push(assignmentId);

    const result = await this.db.query(
      `
      UPDATE assignments SET ${setClause.join(
        ", "
      )}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    );

    assignmentLogger.info("Assignment updated successfully", {
      assignmentId,
      teacherId,
      fields: Object.keys(updates),
    });

    return result.rows[0];
  }

  async deleteAssignment(assignmentId, teacherId) {
    // Validate teacher access
    const assignment = await this.getAssignmentById(assignmentId);
    if (assignment.teacher_id !== teacherId) {
      throw new Error("UNAUTHORIZED_TO_DELETE");
    }

    // Check if there are submissions
    const submissions = await this.db.query(
      "SELECT COUNT(*) as count FROM submissions WHERE assignment_id = $1",
      [assignmentId]
    );

    if (submissions.rows[0].count > 0) {
      // Soft delete - mark as inactive
      await this.db.query(
        "UPDATE assignments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        ["inactive", assignmentId]
      );
    } else {
      // Hard delete if no submissions
      await this.db.query("DELETE FROM assignments WHERE id = $1", [
        assignmentId,
      ]);
    }

    assignmentLogger.info("Assignment deleted successfully", {
      assignmentId,
      teacherId,
    });
  }

  async getAssignmentAnalytics(assignmentId, teacherId) {
    // Validate teacher access
    const assignment = await this.getAssignmentById(assignmentId);
    if (assignment.teacher_id !== teacherId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    const analytics = await this.db.query(
      `
      SELECT 
        COUNT(e.student_id) as total_students,
        COUNT(s.id) as total_submissions,
        COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as pending_grading,
        COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_submissions,
        AVG(g.score) as average_score,
        AVG(g.percentage) as average_percentage,
        MIN(g.score) as min_score,
        MAX(g.score) as max_score
      FROM enrollments e
      LEFT JOIN submissions s ON e.student_id = s.student_id AND s.assignment_id = $1
      LEFT JOIN grades g ON s.id = g.submission_id
      WHERE e.class_id = $2 AND e.status = 'active'
    `,
      [assignmentId, assignment.class_id]
    );

    return analytics.rows[0];
  }
}

// Factory function for dependency injection
export const createAssignmentService = (req) => {
  const db = withRequestContext(req);
  return new AssignmentService(db);
};
