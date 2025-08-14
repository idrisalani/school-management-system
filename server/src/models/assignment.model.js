//@ts-nocheck
// server/src/models/assignment.model.js - PostgreSQL Assignment Model
import { query } from "../config/database";
import withTransaction from "../config/database";

/**
 * PostgreSQL Assignment Model
 */
class Assignment {
  /**
   * Find assignment by ID
   * @param {string} id - Assignment ID
   * @returns {Object|null} Assignment object or null
   */
  static async findById(id) {
    const result = await query(
      `
      SELECT a.*, c.name as class_name, c.code as class_code,
             u.first_name || ' ' || u.last_name as teacher_name,
             COUNT(s.id) as submission_count,
             COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submitted_count
      FROM assignments a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE a.id = $1
      GROUP BY a.id, c.name, c.code, u.first_name, u.last_name
    `,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create new assignment
   * @param {Object} assignmentData - Assignment data
   * @returns {Object} Created assignment
   */
  static async create(assignmentData) {
    const {
      title,
      description,
      classId,
      teacherId,
      assignmentType = "homework",
      totalPoints = 100,
      dueDate,
      instructions,
      attachments = [],
      status = "draft",
    } = assignmentData;

    const result = await query(
      `
      INSERT INTO assignments (
        title, description, class_id, teacher_id, assignment_type,
        total_points, due_date, instructions, attachments, status,
        assigned_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
      RETURNING *
    `,
      [
        title,
        description,
        classId,
        teacherId,
        assignmentType,
        totalPoints,
        dueDate,
        instructions,
        JSON.stringify(attachments),
        status,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update assignment by ID
   * @param {string} id - Assignment ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated assignment
   */
  static async findByIdAndUpdate(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach((key) => {
      const dbField = this.camelToSnake(key);
      if (key === "attachments") {
        fields.push(`${dbField} = $${paramCount}`);
        values.push(JSON.stringify(updateData[key]));
      } else {
        fields.push(`${dbField} = $${paramCount}`);
        values.push(updateData[key]);
      }
      paramCount++;
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `
      UPDATE assignments 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete assignment by ID
   * @param {string} id - Assignment ID
   * @returns {boolean} Success status
   */
  static async findByIdAndDelete(id) {
    return withTransaction(async (client) => {
      // Delete related grades first
      await client.query("DELETE FROM grades WHERE assignment_id = $1", [id]);

      // Delete related submissions
      await client.query("DELETE FROM submissions WHERE assignment_id = $1", [
        id,
      ]);

      // Delete assignment
      const result = await client.query(
        "DELETE FROM assignments WHERE id = $1 RETURNING id",
        [id]
      );

      return result.rowCount > 0;
    });
  }

  /**
   * Find assignments by class
   * @param {string} classId - Class ID
   * @param {Object} options - Query options
   * @returns {Array} Array of assignments
   */
  static async findByClass(classId, options = {}) {
    const { status = null, assignmentType = null, limit = 50 } = options;

    let whereClause = "WHERE a.class_id = $1";
    const params = [classId];
    let paramCount = 2;

    if (status) {
      whereClause += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (assignmentType) {
      whereClause += ` AND a.assignment_type = $${paramCount}`;
      params.push(assignmentType);
      paramCount++;
    }

    params.push(limit);
    const result = await query(
      `
      SELECT a.*, 
             COUNT(s.id) as submission_count,
             COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submitted_count,
             AVG(g.percentage) as average_grade
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id
      LEFT JOIN grades g ON s.id = g.submission_id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.due_date ASC, a.created_at DESC
      LIMIT $${paramCount}
    `,
      params
    );

    return result.rows;
  }

  /**
   * Find assignments by teacher
   * @param {string} teacherId - Teacher ID
   * @param {Object} options - Query options
   * @returns {Array} Array of assignments
   */
  static async findByTeacher(teacherId, options = {}) {
    const { classId = null, status = null, limit = 50 } = options;

    let whereClause = "WHERE a.teacher_id = $1";
    const params = [teacherId];
    let paramCount = 2;

    if (classId) {
      whereClause += ` AND a.class_id = $${paramCount}`;
      params.push(classId);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    params.push(limit);
    const result = await query(
      `
      SELECT a.*, c.name as class_name, c.code as class_code,
             COUNT(s.id) as submission_count,
             COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submitted_count
      FROM assignments a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      ${whereClause}
      GROUP BY a.id, c.name, c.code
      ORDER BY a.due_date ASC, a.created_at DESC
      LIMIT $${paramCount}
    `,
      params
    );

    return result.rows;
  }

  /**
   * Find assignments for student
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Array} Array of assignments with submission status
   */
  static async findForStudent(studentId, options = {}) {
    const { classId = null, status = null, limit = 50 } = options;

    let whereClause = `WHERE e.student_id = $1 AND e.status = 'active'`;
    const params = [studentId];
    let paramCount = 2;

    if (classId) {
      whereClause += ` AND a.class_id = $${paramCount}`;
      params.push(classId);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    params.push(limit);
    const result = await query(
      `
      SELECT a.*, c.name as class_name, c.code as class_code,
             s.id as submission_id, s.submitted_at, s.status as submission_status,
             g.points_earned, g.percentage, g.letter_grade, g.feedback
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN enrollments e ON c.id = e.class_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      LEFT JOIN grades g ON s.id = g.submission_id
      ${whereClause}
      ORDER BY a.due_date ASC, a.created_at DESC
      LIMIT $${paramCount}
    `,
      params
    );

    return result.rows;
  }

  /**
   * Get assignment submissions
   * @param {string} assignmentId - Assignment ID
   * @returns {Array} Array of submissions
   */
  static async getSubmissions(assignmentId) {
    const result = await query(
      `
      SELECT s.*, u.first_name || ' ' || u.last_name as student_name,
             u.username as student_username,
             g.points_earned, g.percentage, g.letter_grade, g.feedback,
             g.graded_at, g.graded_by
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      LEFT JOIN grades g ON s.id = g.submission_id
      WHERE s.assignment_id = $1
      ORDER BY u.last_name, u.first_name
    `,
      [assignmentId]
    );

    return result.rows;
  }

  /**
   * Submit assignment
   * @param {Object} submissionData - Submission data
   * @returns {Object} Created submission
   */
  static async submitAssignment(submissionData) {
    const {
      assignmentId,
      studentId,
      content,
      attachments = [],
    } = submissionData;

    // Check if assignment is still open
    const assignment = await query(
      "SELECT due_date, status FROM assignments WHERE id = $1",
      [assignmentId]
    );

    if (!assignment.rows[0]) {
      throw new Error("Assignment not found");
    }

    const isLate = new Date() > new Date(assignment.rows[0].due_date);

    // Check if already submitted
    const existing = await query(
      "SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2",
      [assignmentId, studentId]
    );

    if (existing.rows.length > 0) {
      // Update existing submission
      const result = await query(
        `
        UPDATE submissions 
        SET content = $1, attachments = $2, submitted_at = NOW(), 
            late_submission = $3, status = 'submitted', updated_at = NOW()
        WHERE assignment_id = $4 AND student_id = $5
        RETURNING *
      `,
        [content, JSON.stringify(attachments), isLate, assignmentId, studentId]
      );

      return result.rows[0];
    } else {
      // Create new submission
      const result = await query(
        `
        INSERT INTO submissions (
          assignment_id, student_id, content, attachments, 
          late_submission, status, submitted_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'submitted', NOW(), NOW(), NOW())
        RETURNING *
      `,
        [assignmentId, studentId, content, JSON.stringify(attachments), isLate]
      );

      return result.rows[0];
    }
  }

  /**
   * Get assignment statistics
   * @param {string} assignmentId - Assignment ID
   * @returns {Object} Assignment statistics
   */
  static async getStatistics(assignmentId) {
    const result = await query(
      `
      SELECT 
        COUNT(e.student_id) as total_students,
        COUNT(s.id) as total_submissions,
        COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN s.late_submission = true THEN 1 END) as late_submissions,
        COUNT(g.id) as graded_count,
        AVG(g.percentage) as average_grade,
        MIN(g.percentage) as min_grade,
        MAX(g.percentage) as max_grade
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = e.student_id
      LEFT JOIN grades g ON s.id = g.submission_id
      WHERE a.id = $1
      GROUP BY a.id
    `,
      [assignmentId]
    );

    return (
      result.rows[0] || {
        total_students: 0,
        total_submissions: 0,
        submitted_count: 0,
        late_submissions: 0,
        graded_count: 0,
        average_grade: null,
        min_grade: null,
        max_grade: null,
      }
    );
  }

  /**
   * Search assignments
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of assignments
   */
  static async search(searchTerm, filters = {}) {
    const { classId, teacherId, assignmentType, status } = filters;

    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (searchTerm) {
      whereClause += ` AND (
        a.title ILIKE $${paramCount} OR 
        a.description ILIKE $${paramCount}
      )`;
      params.push(`%${searchTerm}%`);
      paramCount++;
    }

    if (classId) {
      whereClause += ` AND a.class_id = $${paramCount}`;
      params.push(classId);
      paramCount++;
    }

    if (teacherId) {
      whereClause += ` AND a.teacher_id = $${paramCount}`;
      params.push(teacherId);
      paramCount++;
    }

    if (assignmentType) {
      whereClause += ` AND a.assignment_type = $${paramCount}`;
      params.push(assignmentType);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    const result = await query(
      `
      SELECT a.*, c.name as class_name, c.code as class_code,
             u.first_name || ' ' || u.last_name as teacher_name
      FROM assignments a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN users u ON a.teacher_id = u.id
      ${whereClause}
      ORDER BY a.due_date ASC, a.created_at DESC
      LIMIT 50
    `,
      params
    );

    return result.rows;
  }

  /**
   * Convert camelCase to snake_case
   * @param {string} str - String to convert
   * @returns {string} Converted string
   */
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Format assignment object for API response
   * @param {Object} assignment - Raw assignment object from database
   * @returns {Object} Formatted assignment object
   */
  static formatAssignment(assignment) {
    if (!assignment) return null;

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      classId: assignment.class_id,
      className: assignment.class_name,
      classCode: assignment.class_code,
      teacherId: assignment.teacher_id,
      teacherName: assignment.teacher_name,
      assignmentType: assignment.assignment_type,
      totalPoints: parseFloat(assignment.total_points),
      dueDate: assignment.due_date,
      assignedDate: assignment.assigned_date,
      instructions: assignment.instructions,
      attachments: assignment.attachments,
      status: assignment.status,
      submissionCount: assignment.submission_count || 0,
      submittedCount: assignment.submitted_count || 0,
      averageGrade: assignment.average_grade
        ? parseFloat(assignment.average_grade)
        : null,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
    };
  }
}

export default Assignment;
