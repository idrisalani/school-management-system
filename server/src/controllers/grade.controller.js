// server/src/controllers/grade.controller.js
import { query } from "../config/database.js";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";

class GradeController {
  /**
   * Get all grades with optional filtering
   */
  async getGrades(req, res, next) {
    try {
      const { student_id, class_id, assignment_id, term, academic_year } =
        req.query;

      let whereClause = "WHERE 1=1";
      const queryParams = [];
      let paramCount = 0;

      // Build WHERE clause
      if (student_id) {
        paramCount++;
        whereClause += ` AND g.student_id = $${paramCount}`;
        queryParams.push(student_id);
      }

      if (class_id) {
        paramCount++;
        whereClause += ` AND g.class_id = $${paramCount}`;
        queryParams.push(class_id);
      }

      if (assignment_id) {
        paramCount++;
        whereClause += ` AND g.assignment_id = $${paramCount}`;
        queryParams.push(assignment_id);
      }

      if (term) {
        paramCount++;
        whereClause += ` AND g.term = $${paramCount}`;
        queryParams.push(term);
      }

      if (academic_year) {
        paramCount++;
        whereClause += ` AND g.academic_year = $${paramCount}`;
        queryParams.push(academic_year);
      }

      const gradesQuery = `
        SELECT g.*, 
               u.name as student_name, u.email as student_email,
               c.name as class_name, c.code as class_code,
               a.title as assignment_title, a.type as assignment_type
        FROM grades g
        LEFT JOIN users u ON g.student_id = u.id
        LEFT JOIN classes c ON g.class_id = c.id
        LEFT JOIN assignments a ON g.assignment_id = a.id
        ${whereClause}
        ORDER BY g.created_at DESC
      `;

      const result = await query(gradesQuery, queryParams);
      res.json(result.rows);
    } catch (error) {
      logger.error("Error fetching grades:", error);
      next(ApiError.internal("Failed to fetch grades"));
    }
  }

  /**
   * Get grade by ID
   */
  async getGradeById(req, res, next) {
    try {
      const { id } = req.params;

      const gradeQuery = `
        SELECT g.*, 
               u.name as student_name, u.email as student_email,
               c.name as class_name, c.code as class_code,
               a.title as assignment_title, a.type as assignment_type
        FROM grades g
        LEFT JOIN users u ON g.student_id = u.id
        LEFT JOIN classes c ON g.class_id = c.id
        LEFT JOIN assignments a ON g.assignment_id = a.id
        WHERE g.id = $1
      `;

      const result = await query(gradeQuery, [id]);

      if (result.rows.length === 0) {
        throw ApiError.notFound("Grade not found");
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error("Error fetching grade:", error);
      next(
        error.statusCode ? error : ApiError.internal("Failed to fetch grade")
      );
    }
  }

  /**
   * Create new grade
   */
  async createGrade(req, res, next) {
    try {
      const {
        student_id,
        class_id,
        assignment_id,
        score,
        max_score,
        grade_letter,
        comments,
        term,
        academic_year,
      } = req.body;

      const insertQuery = `
        INSERT INTO grades (
          student_id, class_id, assignment_id, score, max_score, 
          grade_letter, comments, term, academic_year, created_by, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await query(insertQuery, [
        student_id,
        class_id,
        assignment_id,
        score,
        max_score,
        grade_letter,
        comments,
        term,
        academic_year,
        req.user?.id,
        req.user?.id,
      ]);

      // Get the created grade with relationships
      const gradeWithDetails = await this.getGradeById(
        { params: { id: result.rows[0].id } },
        { json: (data) => data },
        () => {}
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      logger.error("Error creating grade:", error);
      next(ApiError.internal("Failed to create grade"));
    }
  }

  /**
   * Update existing grade
   */
  async updateGrade(req, res, next) {
    try {
      const { id } = req.params;
      const { score, max_score, grade_letter, comments, term, academic_year } =
        req.body;

      const updateQuery = `
        UPDATE grades 
        SET score = COALESCE($2, score),
            max_score = COALESCE($3, max_score),
            grade_letter = COALESCE($4, grade_letter),
            comments = COALESCE($5, comments),
            term = COALESCE($6, term),
            academic_year = COALESCE($7, academic_year),
            updated_by = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await query(updateQuery, [
        id,
        score,
        max_score,
        grade_letter,
        comments,
        term,
        academic_year,
        req.user?.id,
      ]);

      if (result.rows.length === 0) {
        throw ApiError.notFound("Grade not found");
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error("Error updating grade:", error);
      next(
        error.statusCode ? error : ApiError.internal("Failed to update grade")
      );
    }
  }

  /**
   * Delete grade
   */
  async deleteGrade(req, res, next) {
    try {
      const { id } = req.params;

      const deleteQuery = "DELETE FROM grades WHERE id = $1 RETURNING id";
      const result = await query(deleteQuery, [id]);

      if (result.rows.length === 0) {
        throw ApiError.notFound("Grade not found");
      }

      res.status(204).end();
    } catch (error) {
      logger.error("Error deleting grade:", error);
      next(
        error.statusCode ? error : ApiError.internal("Failed to delete grade")
      );
    }
  }

  /**
   * Get grades by student ID
   */
  async getGradesByStudent(req, res, next) {
    try {
      const { studentId } = req.params;

      const gradesQuery = `
        SELECT g.*, 
               c.name as class_name, c.code as class_code,
               a.title as assignment_title, a.type as assignment_type
        FROM grades g
        LEFT JOIN classes c ON g.class_id = c.id
        LEFT JOIN assignments a ON g.assignment_id = a.id
        WHERE g.student_id = $1
        ORDER BY g.created_at DESC
      `;

      const result = await query(gradesQuery, [studentId]);
      res.json(result.rows);
    } catch (error) {
      logger.error("Error fetching student grades:", error);
      next(ApiError.internal("Failed to fetch student grades"));
    }
  }

  /**
   * Get grades by class ID
   */
  async getGradesByClass(req, res, next) {
    try {
      const { classId } = req.params;

      const gradesQuery = `
        SELECT g.*, 
               u.name as student_name, u.email as student_email,
               a.title as assignment_title, a.type as assignment_type
        FROM grades g
        LEFT JOIN users u ON g.student_id = u.id
        LEFT JOIN assignments a ON g.assignment_id = a.id
        WHERE g.class_id = $1
        ORDER BY u.name, g.created_at DESC
      `;

      const result = await query(gradesQuery, [classId]);
      res.json(result.rows);
    } catch (error) {
      logger.error("Error fetching class grades:", error);
      next(ApiError.internal("Failed to fetch class grades"));
    }
  }

  /**
   * Bulk update grades
   */
  async bulkUpdateGrades(req, res, next) {
    try {
      const { grades } = req.body;

      if (!Array.isArray(grades)) {
        throw ApiError.badRequest("Invalid grades data");
      }

      const updatedGrades = [];

      // Use transaction for bulk update
      await query("BEGIN");

      try {
        for (const gradeData of grades) {
          const updateQuery = `
            UPDATE grades 
            SET score = COALESCE($2, score),
                max_score = COALESCE($3, max_score),
                grade_letter = COALESCE($4, grade_letter),
                comments = COALESCE($5, comments),
                updated_by = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
          `;

          const result = await query(updateQuery, [
            gradeData.id,
            gradeData.score,
            gradeData.max_score,
            gradeData.grade_letter,
            gradeData.comments,
            req.user?.id,
          ]);

          if (result.rows.length > 0) {
            updatedGrades.push(result.rows[0]);
          }
        }

        await query("COMMIT");
        res.json(updatedGrades);
      } catch (error) {
        await query("ROLLBACK");
        throw error;
      }
    } catch (error) {
      logger.error("Error bulk updating grades:", error);
      next(
        error.statusCode
          ? error
          : ApiError.internal("Failed to bulk update grades")
      );
    }
  }

  /**
   * Get grade statistics
   */
  async getGradeStatistics(req, res, next) {
    try {
      const { class_id, student_id, academic_year, term } = req.query;

      let whereClause = "WHERE score IS NOT NULL";
      const queryParams = [];
      let paramCount = 0;

      // Build WHERE clause
      if (class_id) {
        paramCount++;
        whereClause += ` AND class_id = $${paramCount}`;
        queryParams.push(class_id);
      }

      if (student_id) {
        paramCount++;
        whereClause += ` AND student_id = $${paramCount}`;
        queryParams.push(student_id);
      }

      if (academic_year) {
        paramCount++;
        whereClause += ` AND academic_year = $${paramCount}`;
        queryParams.push(academic_year);
      }

      if (term) {
        paramCount++;
        whereClause += ` AND term = $${paramCount}`;
        queryParams.push(term);
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_grades,
          AVG(score::float / max_score::float * 100) as average_percentage,
          MAX(score::float / max_score::float * 100) as highest_percentage,
          MIN(score::float / max_score::float * 100) as lowest_percentage,
          COUNT(CASE WHEN score::float / max_score::float >= 0.6 THEN 1 END) as passing_grades,
          COUNT(DISTINCT student_id) as total_students,
          COUNT(DISTINCT class_id) as total_classes
        FROM grades 
        ${whereClause}
      `;

      const result = await query(statsQuery, queryParams);

      if (result.rows.length === 0) {
        throw ApiError.notFound("No grades found with the given criteria");
      }

      const stats = result.rows[0];
      const passingRate =
        stats.total_grades > 0
          ? (stats.passing_grades / stats.total_grades) * 100
          : 0;

      const statistics = {
        overview: {
          count: parseInt(stats.total_grades),
          average: parseFloat(stats.average_percentage) || 0,
          highest: parseFloat(stats.highest_percentage) || 0,
          lowest: parseFloat(stats.lowest_percentage) || 0,
          passingRate: parseFloat(passingRate.toFixed(2)),
        },
        metadata: {
          totalStudents: parseInt(stats.total_students),
          totalClasses: parseInt(stats.total_classes),
        },
      };

      res.json({
        status: "success",
        data: statistics,
      });
    } catch (error) {
      logger.error("Error calculating grade statistics:", error);
      next(
        error.statusCode
          ? error
          : ApiError.internal("Failed to calculate grade statistics")
      );
    }
  }
}

export default new GradeController();
