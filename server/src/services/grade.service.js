// server/src/services/grade.service.js
import { withRequestContext } from "../config/database.js";
import logger from "../utils/logger.js";

const gradeLogger = logger.child({ module: "grade-service" });

export class GradeService {
  constructor(db) {
    this.db = db;
  }

  async getStudentGrades(studentId, classId = null, academicYear = null) {
    try {
      let sql = `
        SELECT g.*, a.title as assignment_title, a.type as assignment_type, a.max_points as assignment_max_points,
               c.name as class_name, c.code as class_code, u.name as teacher_name
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        JOIN classes c ON g.class_id = c.id
        JOIN users u ON c.teacher_id = u.id
        WHERE g.student_id = $1
      `;

      const params = [studentId];
      let paramCount = 1;

      if (classId) {
        paramCount++;
        sql += ` AND g.class_id = $${paramCount}`;
        params.push(classId);
      }

      if (academicYear) {
        paramCount++;
        sql += ` AND c.academic_year = $${paramCount}`;
        params.push(academicYear);
      }

      sql += " ORDER BY g.created_at DESC";

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      gradeLogger.error("Failed to get student grades", {
        error: error.message,
        studentId,
      });
      throw error;
    }
  }

  async getClassGrades(classId, teacherId) {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      const result = await this.db.query(
        `
        SELECT g.*, a.title as assignment_title, a.type as assignment_type,
               u.name as student_name, u.email as student_email
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        JOIN users u ON g.student_id = u.id
        WHERE g.class_id = $1
        ORDER BY u.name, a.title
      `,
        [classId]
      );

      return result.rows;
    } catch (error) {
      gradeLogger.error("Failed to get class grades", {
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

  async calculateStudentGPA(studentId, classId = null, academicYear = null) {
    try {
      let sql = `
        SELECT AVG(g.percentage) as gpa, COUNT(g.id) as total_grades
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        JOIN classes c ON g.class_id = c.id
        WHERE g.student_id = $1
      `;

      const params = [studentId];
      let paramCount = 1;

      if (classId) {
        paramCount++;
        sql += ` AND g.class_id = $${paramCount}`;
        params.push(classId);
      }

      if (academicYear) {
        paramCount++;
        sql += ` AND c.academic_year = $${paramCount}`;
        params.push(academicYear);
      }

      const result = await this.db.query(sql, params);
      const { gpa, total_grades } = result.rows[0];

      return {
        gpa: gpa ? parseFloat(gpa).toFixed(2) : null,
        letterGrade: gpa ? this.calculateLetterGrade(gpa) : null,
        totalGrades: parseInt(total_grades),
      };
    } catch (error) {
      gradeLogger.error("Failed to calculate student GPA", {
        error: error.message,
        studentId,
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

  async getClassGradeStatistics(classId, teacherId) {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      const stats = await this.db.query(
        `
        SELECT 
          COUNT(g.id) as total_grades,
          AVG(g.percentage) as average_percentage,
          MIN(g.percentage) as min_percentage,
          MAX(g.percentage) as max_percentage,
          STDDEV(g.percentage) as std_deviation,
          COUNT(CASE WHEN g.grade_letter = 'A+' THEN 1 END) as a_plus_count,
          COUNT(CASE WHEN g.grade_letter = 'A' THEN 1 END) as a_count,
          COUNT(CASE WHEN g.grade_letter = 'A-' THEN 1 END) as a_minus_count,
          COUNT(CASE WHEN g.grade_letter = 'B+' THEN 1 END) as b_plus_count,
          COUNT(CASE WHEN g.grade_letter = 'B' THEN 1 END) as b_count,
          COUNT(CASE WHEN g.grade_letter = 'B-' THEN 1 END) as b_minus_count,
          COUNT(CASE WHEN g.grade_letter = 'C+' THEN 1 END) as c_plus_count,
          COUNT(CASE WHEN g.grade_letter = 'C' THEN 1 END) as c_count,
          COUNT(CASE WHEN g.grade_letter = 'C-' THEN 1 END) as c_minus_count,
          COUNT(CASE WHEN g.grade_letter = 'D+' THEN 1 END) as d_plus_count,
          COUNT(CASE WHEN g.grade_letter = 'D' THEN 1 END) as d_count,
          COUNT(CASE WHEN g.grade_letter = 'F' THEN 1 END) as f_count
        FROM grades g
        WHERE g.class_id = $1
      `,
        [classId]
      );

      const result = stats.rows[0];

      // Calculate grade distribution percentages
      const totalGrades = parseInt(result.total_grades);
      if (totalGrades === 0) {
        return { ...result, distribution: {} };
      }

      const distribution = {
        "A+": Math.round((result.a_plus_count / totalGrades) * 100),
        A: Math.round((result.a_count / totalGrades) * 100),
        "A-": Math.round((result.a_minus_count / totalGrades) * 100),
        "B+": Math.round((result.b_plus_count / totalGrades) * 100),
        B: Math.round((result.b_count / totalGrades) * 100),
        "B-": Math.round((result.b_minus_count / totalGrades) * 100),
        "C+": Math.round((result.c_plus_count / totalGrades) * 100),
        C: Math.round((result.c_count / totalGrades) * 100),
        "C-": Math.round((result.c_minus_count / totalGrades) * 100),
        "D+": Math.round((result.d_plus_count / totalGrades) * 100),
        D: Math.round((result.d_count / totalGrades) * 100),
        F: Math.round((result.f_count / totalGrades) * 100),
      };

      return {
        ...result,
        distribution,
        average_percentage: result.average_percentage
          ? parseFloat(result.average_percentage).toFixed(2)
          : null,
        min_percentage: result.min_percentage
          ? parseFloat(result.min_percentage).toFixed(2)
          : null,
        max_percentage: result.max_percentage
          ? parseFloat(result.max_percentage).toFixed(2)
          : null,
        std_deviation: result.std_deviation
          ? parseFloat(result.std_deviation).toFixed(2)
          : null,
      };
    } catch (error) {
      gradeLogger.error("Failed to get class grade statistics", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }

  async getStudentProgress(studentId, classId) {
    try {
      const progress = await this.db.query(
        `
        SELECT 
          g.created_at,
          g.percentage,
          g.grade_letter,
          a.title as assignment_title,
          a.type as assignment_type
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        WHERE g.student_id = $1 AND g.class_id = $2
        ORDER BY g.created_at ASC
      `,
        [studentId, classId]
      );

      // Calculate rolling average
      const progressWithAverage = [];
      let runningTotal = 0;

      progress.rows.forEach((grade, index) => {
        runningTotal += parseFloat(grade.percentage);
        const rollingAverage = runningTotal / (index + 1);

        progressWithAverage.push({
          ...grade,
          rolling_average: Number(rollingAverage).toFixed(2),
        });
      });

      return progressWithAverage;
    } catch (error) {
      gradeLogger.error("Failed to get student progress", {
        error: error.message,
        studentId,
        classId,
      });
      throw error;
    }
  }

  async generateTranscript(studentId, academicYear = null) {
    try {
      let sql = `
        SELECT 
          c.name as class_name,
          c.code as class_code,
          c.academic_year,
          d.name as department_name,
          u.name as teacher_name,
          AVG(g.percentage) as class_average,
          COUNT(g.id) as total_assignments,
          MAX(g.created_at) as last_graded
        FROM grades g
        JOIN classes c ON g.class_id = c.id
        LEFT JOIN departments d ON c.department_id = d.id
        JOIN users u ON c.teacher_id = u.id
        WHERE g.student_id = $1
      `;

      const params = [studentId];

      if (academicYear) {
        sql += " AND c.academic_year = $2";
        params.push(academicYear);
      }

      sql += `
        GROUP BY c.id, c.name, c.code, c.academic_year, d.name, u.name
        ORDER BY c.academic_year DESC, c.name
      `;

      const classGrades = await this.db.query(sql, params);

      // Calculate overall GPA
      const overallGPA = await this.calculateStudentGPA(
        studentId,
        null,
        academicYear
      );

      return {
        student_id: studentId,
        academic_year: academicYear,
        overall_gpa: overallGPA,
        classes: classGrades.rows.map((row) => ({
          ...row,
          class_average: parseFloat(row.class_average).toFixed(2),
          class_letter_grade: this.calculateLetterGrade(row.class_average),
        })),
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      gradeLogger.error("Failed to generate transcript", {
        error: error.message,
        studentId,
      });
      throw error;
    }
  }

  async getGradeTrends(classId, teacherId, period = "30 days") {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      const trends = await this.db.query(
        `
        SELECT 
          DATE(g.created_at) as grade_date,
          AVG(g.percentage) as average_percentage,
          COUNT(g.id) as grades_given
        FROM grades g
        WHERE g.class_id = $1 
          AND g.created_at >= CURRENT_DATE - INTERVAL '${period}'
        GROUP BY DATE(g.created_at)
        ORDER BY grade_date ASC
      `,
        [classId]
      );

      return trends.rows;
    } catch (error) {
      gradeLogger.error("Failed to get grade trends", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }

  async updateGrade(gradeId, teacherId, updates) {
    try {
      // Get grade and verify teacher access
      const gradeCheck = await this.db.query(
        `
        SELECT g.*, c.teacher_id
        FROM grades g
        JOIN classes c ON g.class_id = c.id
        WHERE g.id = $1
      `,
        [gradeId]
      );

      if (gradeCheck.rows.length === 0) {
        throw new Error("GRADE_NOT_FOUND");
      }

      if (gradeCheck.rows[0].teacher_id !== teacherId) {
        throw new Error("UNAUTHORIZED_TO_UPDATE_GRADE");
      }

      const allowedFields = ["score", "comments"];
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

      // If score is being updated, recalculate percentage and letter grade
      if (updates.score !== undefined) {
        const assignment = await this.db.query(
          "SELECT max_points FROM assignments WHERE id = $1",
          [gradeCheck.rows[0].assignment_id]
        );
        const maxPoints = assignment.rows[0].max_points;
        const percentage = Math.round((updates.score / maxPoints) * 100);
        const letterGrade = this.calculateLetterGrade(percentage);

        paramCount++;
        setClause.push(`percentage = $${paramCount}`);
        values.push(percentage);

        paramCount++;
        setClause.push(`grade_letter = $${paramCount}`);
        values.push(letterGrade);
      }

      paramCount++;
      values.push(gradeId);

      const result = await this.db.query(
        `
        UPDATE grades SET ${setClause.join(
          ", "
        )}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `,
        values
      );

      gradeLogger.info("Grade updated successfully", {
        gradeId,
        teacherId,
        fields: Object.keys(updates),
      });

      return result.rows[0];
    } catch (error) {
      gradeLogger.error("Failed to update grade", {
        error: error.message,
        gradeId,
        teacherId,
      });
      throw error;
    }
  }

  async deleteGrade(gradeId, teacherId) {
    try {
      // Get grade and verify teacher access
      const gradeCheck = await this.db.query(
        `
        SELECT g.*, c.teacher_id
        FROM grades g
        JOIN classes c ON g.class_id = c.id
        WHERE g.id = $1
      `,
        [gradeId]
      );

      if (gradeCheck.rows.length === 0) {
        throw new Error("GRADE_NOT_FOUND");
      }

      if (gradeCheck.rows[0].teacher_id !== teacherId) {
        throw new Error("UNAUTHORIZED_TO_DELETE_GRADE");
      }

      await this.db.query("DELETE FROM grades WHERE id = $1", [gradeId]);

      gradeLogger.info("Grade deleted successfully", {
        gradeId,
        teacherId,
      });
    } catch (error) {
      gradeLogger.error("Failed to delete grade", {
        error: error.message,
        gradeId,
        teacherId,
      });
      throw error;
    }
  }

  async getFailingStudents(classId, teacherId, threshold = 65) {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      const result = await this.db.query(
        `
        SELECT 
          u.id,
          u.name,
          u.email,
          AVG(g.percentage) as average_percentage,
          COUNT(g.id) as total_grades
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        LEFT JOIN grades g ON u.id = g.student_id AND g.class_id = $1
        WHERE e.class_id = $1 AND e.status = 'active'
        GROUP BY u.id, u.name, u.email
        HAVING AVG(g.percentage) < $2 OR AVG(g.percentage) IS NULL
        ORDER BY AVG(g.percentage) ASC NULLS LAST
      `,
        [classId, threshold]
      );

      return result.rows.map((row) => ({
        ...row,
        average_percentage: row.average_percentage
          ? parseFloat(row.average_percentage).toFixed(2)
          : null,
        status: row.average_percentage ? "failing" : "no_grades",
      }));
    } catch (error) {
      gradeLogger.error("Failed to get failing students", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }

  async getTopPerformers(classId, teacherId, limit = 10) {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      const result = await this.db.query(
        `
        SELECT 
          u.id,
          u.name,
          u.email,
          AVG(g.percentage) as average_percentage,
          COUNT(g.id) as total_grades
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        JOIN grades g ON u.id = g.student_id AND g.class_id = $1
        WHERE e.class_id = $1 AND e.status = 'active'
        GROUP BY u.id, u.name, u.email
        ORDER BY AVG(g.percentage) DESC
        LIMIT $2
      `,
        [classId, limit]
      );

      return result.rows.map((row) => ({
        ...row,
        average_percentage: parseFloat(row.average_percentage).toFixed(2),
        letter_grade: this.calculateLetterGrade(row.average_percentage),
      }));
    } catch (error) {
      gradeLogger.error("Failed to get top performers", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }
}

// Factory function for dependency injection
export const createGradeService = (req) => {
  const db = withRequestContext(req);
  return new GradeService(db);
};
