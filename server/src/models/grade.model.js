// @ts-nocheck
// server/src/models/grade.model.js - PostgreSQL Grade Model
import { query } from "../config/database";
import withTransaction from "../config/database";

/**
 * PostgreSQL Grade Model
 */
class Grade {
  /**
   * Find grade by ID
   * @param {string} id - Grade ID
   * @returns {Object|null} Grade object or null
   */
  static async findById(id) {
    const result = await query(
      `
      SELECT g.*, a.title as assignment_title, a.total_points as assignment_points,
             c.name as class_name, c.code as class_code,
             s.first_name || ' ' || s.last_name as student_name,
             t.first_name || ' ' || t.last_name as grader_name
      FROM grades g
      LEFT JOIN assignments a ON g.assignment_id = a.id
      LEFT JOIN classes c ON g.class_id = c.id
      LEFT JOIN users s ON g.student_id = s.id
      LEFT JOIN users t ON g.graded_by = t.id
      WHERE g.id = $1
    `,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create new grade
   * @param {Object} gradeData - Grade data
   * @returns {Object} Created grade
   */
  static async create(gradeData) {
    const {
      submissionId,
      studentId,
      assignmentId,
      classId,
      pointsEarned,
      pointsPossible,
      feedback = null,
      gradedBy,
    } = gradeData;

    // Calculate percentage and letter grade
    const percentage =
      pointsPossible > 0 ? (pointsEarned / pointsPossible) * 100 : 0;
    const letterGrade = this.calculateLetterGrade(percentage);

    const result = await query(
      `
      INSERT INTO grades (
        submission_id, student_id, assignment_id, class_id,
        points_earned, points_possible, percentage, letter_grade,
        feedback, graded_by, graded_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
      RETURNING *
    `,
      [
        submissionId,
        studentId,
        assignmentId,
        classId,
        pointsEarned,
        pointsPossible,
        percentage,
        letterGrade,
        feedback,
        gradedBy,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update grade by ID
   * @param {string} id - Grade ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated grade
   */
  static async findByIdAndUpdate(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Handle special fields that need calculation
    if (updateData.pointsEarned || updateData.pointsPossible) {
      // Get current grade to calculate new percentage
      const current = await this.findById(id);
      if (current) {
        const newPointsEarned =
          updateData.pointsEarned || current.points_earned;
        const newPointsPossible =
          updateData.pointsPossible || current.points_possible;
        const newPercentage =
          newPointsPossible > 0
            ? (newPointsEarned / newPointsPossible) * 100
            : 0;
        const newLetterGrade = this.calculateLetterGrade(newPercentage);

        updateData.percentage = newPercentage;
        updateData.letterGrade = newLetterGrade;
      }
    }

    Object.keys(updateData).forEach((key) => {
      const dbField = this.camelToSnake(key);
      fields.push(`${dbField} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `
      UPDATE grades 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete grade by ID
   * @param {string} id - Grade ID
   * @returns {boolean} Success status
   */
  static async findByIdAndDelete(id) {
    const result = await query(
      "DELETE FROM grades WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Find grades by student
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Array} Array of grades
   */
  static async findByStudent(studentId, options = {}) {
    const { classId = null, limit = 50 } = options;

    let whereClause = "WHERE g.student_id = $1";
    const params = [studentId];
    let paramCount = 2;

    if (classId) {
      whereClause += ` AND g.class_id = $${paramCount}`;
      params.push(classId);
      paramCount++;
    }

    params.push(limit);
    const result = await query(
      `
      SELECT g.*, a.title as assignment_title, a.assignment_type,
             c.name as class_name, c.code as class_code
      FROM grades g
      LEFT JOIN assignments a ON g.assignment_id = a.id
      LEFT JOIN classes c ON g.class_id = c.id
      ${whereClause}
      ORDER BY g.graded_at DESC
      LIMIT $${paramCount}
    `,
      params
    );

    return result.rows;
  }

  /**
   * Find grades by class
   * @param {string} classId - Class ID
   * @param {Object} options - Query options
   * @returns {Array} Array of grades
   */
  static async findByClass(classId, options = {}) {
    const { assignmentId = null, limit = 100 } = options;

    let whereClause = "WHERE g.class_id = $1";
    const params = [classId];
    let paramCount = 2;

    if (assignmentId) {
      whereClause += ` AND g.assignment_id = $${paramCount}`;
      params.push(assignmentId);
      paramCount++;
    }

    params.push(limit);
    const result = await query(
      `
      SELECT g.*, a.title as assignment_title, a.assignment_type,
             s.first_name || ' ' || s.last_name as student_name,
             s.username as student_username
      FROM grades g
      LEFT JOIN assignments a ON g.assignment_id = a.id
      LEFT JOIN users s ON g.student_id = s.id
      ${whereClause}
      ORDER BY s.last_name, s.first_name, g.graded_at DESC
      LIMIT $${paramCount}
    `,
      params
    );

    return result.rows;
  }

  /**
   * Find grades by assignment
   * @param {string} assignmentId - Assignment ID
   * @returns {Array} Array of grades
   */
  static async findByAssignment(assignmentId) {
    const result = await query(
      `
      SELECT g.*, s.first_name || ' ' || s.last_name as student_name,
             s.username as student_username,
             sub.submitted_at, sub.late_submission
      FROM grades g
      LEFT JOIN users s ON g.student_id = s.id
      LEFT JOIN submissions sub ON g.submission_id = sub.id
      WHERE g.assignment_id = $1
      ORDER BY s.last_name, s.first_name
    `,
      [assignmentId]
    );

    return result.rows;
  }

  /**
   * Get student's grade summary for a class
   * @param {string} studentId - Student ID
   * @param {string} classId - Class ID
   * @returns {Object} Grade summary
   */
  static async getStudentClassSummary(studentId, classId) {
    const result = await query(
      `
      SELECT 
        COUNT(g.id) as total_grades,
        AVG(g.percentage) as overall_average,
        SUM(g.points_earned) as total_points_earned,
        SUM(g.points_possible) as total_points_possible,
        COUNT(CASE WHEN g.letter_grade = 'A' THEN 1 END) as a_grades,
        COUNT(CASE WHEN g.letter_grade = 'B' THEN 1 END) as b_grades,
        COUNT(CASE WHEN g.letter_grade = 'C' THEN 1 END) as c_grades,
        COUNT(CASE WHEN g.letter_grade = 'D' THEN 1 END) as d_grades,
        COUNT(CASE WHEN g.letter_grade = 'F' THEN 1 END) as f_grades
      FROM grades g
      WHERE g.student_id = $1 AND g.class_id = $2
    `,
      [studentId, classId]
    );

    const summary = result.rows[0];
    if (summary.total_grades === 0) {
      return {
        totalGrades: 0,
        overallAverage: null,
        overallLetterGrade: null,
        totalPointsEarned: 0,
        totalPointsPossible: 0,
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      };
    }

    const overallAverage = parseFloat(summary.overall_average);
    return {
      totalGrades: parseInt(summary.total_grades),
      overallAverage: overallAverage,
      overallLetterGrade: this.calculateLetterGrade(overallAverage),
      totalPointsEarned: parseFloat(summary.total_points_earned),
      totalPointsPossible: parseFloat(summary.total_points_possible),
      gradeDistribution: {
        A: parseInt(summary.a_grades),
        B: parseInt(summary.b_grades),
        C: parseInt(summary.c_grades),
        D: parseInt(summary.d_grades),
        F: parseInt(summary.f_grades),
      },
    };
  }

  /**
   * Get class grade statistics
   * @param {string} classId - Class ID
   * @returns {Object} Class grade statistics
   */
  static async getClassStatistics(classId) {
    const result = await query(
      `
      SELECT 
        COUNT(DISTINCT g.student_id) as total_students_graded,
        COUNT(g.id) as total_grades,
        AVG(g.percentage) as class_average,
        MIN(g.percentage) as lowest_grade,
        MAX(g.percentage) as highest_grade,
        STDDEV(g.percentage) as grade_std_dev,
        COUNT(CASE WHEN g.percentage >= 90 THEN 1 END) as a_count,
        COUNT(CASE WHEN g.percentage >= 80 AND g.percentage < 90 THEN 1 END) as b_count,
        COUNT(CASE WHEN g.percentage >= 70 AND g.percentage < 80 THEN 1 END) as c_count,
        COUNT(CASE WHEN g.percentage >= 60 AND g.percentage < 70 THEN 1 END) as d_count,
        COUNT(CASE WHEN g.percentage < 60 THEN 1 END) as f_count
      FROM grades g
      WHERE g.class_id = $1
    `,
      [classId]
    );

    const stats = result.rows[0];
    return {
      totalStudentsGraded: parseInt(stats.total_students_graded),
      totalGrades: parseInt(stats.total_grades),
      classAverage: stats.class_average
        ? parseFloat(stats.class_average)
        : null,
      lowestGrade: stats.lowest_grade ? parseFloat(stats.lowest_grade) : null,
      highestGrade: stats.highest_grade
        ? parseFloat(stats.highest_grade)
        : null,
      standardDeviation: stats.grade_std_dev
        ? parseFloat(stats.grade_std_dev)
        : null,
      gradeDistribution: {
        A: parseInt(stats.a_count),
        B: parseInt(stats.b_count),
        C: parseInt(stats.c_count),
        D: parseInt(stats.d_count),
        F: parseInt(stats.f_count),
      },
    };
  }

  /**
   * Bulk grade submission
   * @param {Array} grades - Array of grade data
   * @returns {Array} Array of created grades
   */
  static async bulkCreate(grades) {
    return withTransaction(async (client) => {
      const results = [];

      for (const gradeData of grades) {
        const {
          submissionId,
          studentId,
          assignmentId,
          classId,
          pointsEarned,
          pointsPossible,
          feedback,
          gradedBy,
        } = gradeData;

        const percentage =
          pointsPossible > 0 ? (pointsEarned / pointsPossible) * 100 : 0;
        const letterGrade = this.calculateLetterGrade(percentage);

        const result = await client.query(
          `
          INSERT INTO grades (
            submission_id, student_id, assignment_id, class_id,
            points_earned, points_possible, percentage, letter_grade,
            feedback, graded_by, graded_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
          RETURNING *
        `,
          [
            submissionId,
            studentId,
            assignmentId,
            classId,
            pointsEarned,
            pointsPossible,
            percentage,
            letterGrade,
            feedback,
            gradedBy,
          ]
        );

        results.push(result.rows[0]);
      }

      return results;
    });
  }

  /**
   * Calculate letter grade from percentage
   * @param {number} percentage - Grade percentage
   * @returns {string} Letter grade
   */
  static calculateLetterGrade(percentage) {
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
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  }

  /**
   * Get grade trends for student
   * @param {string} studentId - Student ID
   * @param {string} classId - Class ID
   * @param {number} limit - Number of recent grades
   * @returns {Array} Array of grade trends
   */
  static async getGradeTrends(studentId, classId, limit = 10) {
    const result = await query(
      `
      SELECT g.percentage, g.graded_at, a.title as assignment_title
      FROM grades g
      LEFT JOIN assignments a ON g.assignment_id = a.id
      WHERE g.student_id = $1 AND g.class_id = $2
      ORDER BY g.graded_at DESC
      LIMIT $3
    `,
      [studentId, classId, limit]
    );

    return result.rows.reverse(); // Return in chronological order
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
   * Format grade object for API response
   * @param {Object} grade - Raw grade object from database
   * @returns {Object} Formatted grade object
   */
  static formatGrade(grade) {
    if (!grade) return null;

    return {
      id: grade.id,
      submissionId: grade.submission_id,
      studentId: grade.student_id,
      studentName: grade.student_name,
      studentUsername: grade.student_username,
      assignmentId: grade.assignment_id,
      assignmentTitle: grade.assignment_title,
      assignmentType: grade.assignment_type,
      classId: grade.class_id,
      className: grade.class_name,
      classCode: grade.class_code,
      pointsEarned: parseFloat(grade.points_earned),
      pointsPossible: parseFloat(grade.points_possible),
      percentage: parseFloat(grade.percentage),
      letterGrade: grade.letter_grade,
      feedback: grade.feedback,
      gradedBy: grade.graded_by,
      graderName: grade.grader_name,
      gradedAt: grade.graded_at,
      createdAt: grade.created_at,
      updatedAt: grade.updated_at,
    };
  }
}

export default Grade;
