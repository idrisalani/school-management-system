// server/src/services/enrollment.service.js
import { withRequestContext } from "../config/database.js";
import logger from "../utils/logger.js";

const enrollmentLogger = logger.child({ module: "enrollment-service" });

export class EnrollmentService {
  constructor(db) {
    this.db = db;
  }

  async enrollStudent(studentId, classId, enrolledBy = null) {
    try {
      // Validate student exists and is active
      const student = await this.db.query(
        "SELECT id, role FROM users WHERE id = $1 AND role = $2 AND status = $3",
        [studentId, "student", "active"]
      );

      if (student.rows.length === 0) {
        throw new Error("STUDENT_NOT_FOUND");
      }

      // Validate class exists and is active
      const classInfo = await this.db.query(
        `
        SELECT id, name, max_students, 
          (SELECT COUNT(*) FROM enrollments WHERE class_id = $1 AND status = 'active') as current_count
        FROM classes WHERE id = $1 AND status = 'active'
      `,
        [classId]
      );

      if (classInfo.rows.length === 0) {
        throw new Error("CLASS_NOT_FOUND");
      }

      const { max_students, current_count } = classInfo.rows[0];
      if (parseInt(current_count) >= max_students) {
        throw new Error("CLASS_AT_CAPACITY");
      }

      // Check if already enrolled
      const existingEnrollment = await this.db.query(
        "SELECT id, status FROM enrollments WHERE student_id = $1 AND class_id = $2",
        [studentId, classId]
      );

      if (existingEnrollment.rows.length > 0) {
        const existing = existingEnrollment.rows[0];
        if (existing.status === "active") {
          throw new Error("STUDENT_ALREADY_ENROLLED");
        } else {
          // Reactivate previous enrollment
          const result = await this.db.query(
            `
            UPDATE enrollments 
            SET status = 'active', enrollment_date = CURRENT_DATE, enrolled_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          `,
            [enrolledBy, existing.id]
          );

          enrollmentLogger.info("Student enrollment reactivated", {
            studentId,
            classId,
            enrollmentId: result.rows[0].id,
          });

          return result.rows[0];
        }
      }

      // Create new enrollment
      const result = await this.db.query(
        `
        INSERT INTO enrollments (student_id, class_id, enrollment_date, status, enrolled_by, created_at)
        VALUES ($1, $2, CURRENT_DATE, 'active', $3, CURRENT_TIMESTAMP)
        RETURNING *
      `,
        [studentId, classId, enrolledBy]
      );

      enrollmentLogger.info("Student enrolled successfully", {
        studentId,
        classId,
        enrollmentId: result.rows[0].id,
        enrolledBy,
      });

      return result.rows[0];
    } catch (error) {
      enrollmentLogger.error("Failed to enroll student", {
        error: error.message,
        studentId,
        classId,
      });
      throw error;
    }
  }

  async unenrollStudent(
    studentId,
    classId,
    unenrolledBy = null,
    reason = null
  ) {
    try {
      const result = await this.db.query(
        `
        UPDATE enrollments 
        SET status = 'inactive', unenrolled_date = CURRENT_DATE, unenrolled_by = $3, unenroll_reason = $4, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = $1 AND class_id = $2 AND status = 'active'
        RETURNING *
      `,
        [studentId, classId, unenrolledBy, reason]
      );

      if (result.rows.length === 0) {
        throw new Error("ACTIVE_ENROLLMENT_NOT_FOUND");
      }

      enrollmentLogger.info("Student unenrolled successfully", {
        studentId,
        classId,
        unenrolledBy,
        reason,
      });

      return result.rows[0];
    } catch (error) {
      enrollmentLogger.error("Failed to unenroll student", {
        error: error.message,
        studentId,
        classId,
      });
      throw error;
    }
  }

  async getStudentEnrollments(
    studentId,
    status = "active",
    academicYear = null
  ) {
    try {
      let sql = `
        SELECT e.*, c.name as class_name, c.code as class_code, c.academic_year,
               d.name as department_name, u.name as teacher_name, u.email as teacher_email
        FROM enrollments e
        JOIN classes c ON e.class_id = c.id
        LEFT JOIN departments d ON c.department_id = d.id
        JOIN users u ON c.teacher_id = u.id
        WHERE e.student_id = $1
      `;

      const params = [studentId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        sql += ` AND e.status = $${paramCount}`;
        params.push(status);
      }

      if (academicYear) {
        paramCount++;
        sql += ` AND c.academic_year = $${paramCount}`;
        params.push(academicYear);
      }

      sql += " ORDER BY c.name";

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      enrollmentLogger.error("Failed to get student enrollments", {
        error: error.message,
        studentId,
      });
      throw error;
    }
  }

  async getClassEnrollments(classId, status = "active") {
    try {
      const result = await this.db.query(
        `
        SELECT e.*, u.id as student_id, u.name as student_name, u.email as student_email,
               u.first_name, u.last_name, u.username
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.class_id = $1 AND e.status = $2 AND u.status = 'active'
        ORDER BY u.name
      `,
        [classId, status]
      );

      return result.rows;
    } catch (error) {
      enrollmentLogger.error("Failed to get class enrollments", {
        error: error.message,
        classId,
      });
      throw error;
    }
  }

  async validateEnrollment(studentId, classId) {
    const result = await this.db.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2 AND status = $3",
      [studentId, classId, "active"]
    );

    return result.rows.length > 0;
  }

  async bulkEnrollStudents(classId, studentIds, enrolledBy = null) {
    try {
      // Validate class exists and get capacity info
      const classInfo = await this.db.query(
        `
        SELECT id, name, max_students, 
          (SELECT COUNT(*) FROM enrollments WHERE class_id = $1 AND status = 'active') as current_count
        FROM classes WHERE id = $1 AND status = 'active'
      `,
        [classId]
      );

      if (classInfo.rows.length === 0) {
        throw new Error("CLASS_NOT_FOUND");
      }

      const { max_students, current_count } = classInfo.rows[0];
      const totalAfterEnrollment = parseInt(current_count) + studentIds.length;

      if (totalAfterEnrollment > max_students) {
        throw new Error("BULK_ENROLLMENT_EXCEEDS_CAPACITY");
      }

      const successfulEnrollments = [];
      const failedEnrollments = [];

      // Process each student enrollment
      for (const studentId of studentIds) {
        try {
          const enrollment = await this.enrollStudent(
            studentId,
            classId,
            enrolledBy
          );
          successfulEnrollments.push({
            studentId,
            enrollmentId: enrollment.id,
            status: "success",
          });
        } catch (error) {
          failedEnrollments.push({
            studentId,
            error: error.message,
            status: "failed",
          });
        }
      }

      enrollmentLogger.info("Bulk enrollment completed", {
        classId,
        totalRequested: studentIds.length,
        successful: successfulEnrollments.length,
        failed: failedEnrollments.length,
      });

      return {
        successful: successfulEnrollments,
        failed: failedEnrollments,
        summary: {
          total: studentIds.length,
          successCount: successfulEnrollments.length,
          failedCount: failedEnrollments.length,
        },
      };
    } catch (error) {
      enrollmentLogger.error("Failed bulk enrollment", {
        error: error.message,
        classId,
      });
      throw error;
    }
  }

  async transferStudent(
    studentId,
    fromClassId,
    toClassId,
    transferredBy = null,
    reason = null
  ) {
    try {
      // Start transaction
      await this.db.query("BEGIN");

      try {
        // Unenroll from current class
        await this.unenrollStudent(
          studentId,
          fromClassId,
          transferredBy,
          `Transfer: ${reason}`
        );

        // Enroll in new class
        const newEnrollment = await this.enrollStudent(
          studentId,
          toClassId,
          transferredBy
        );

        await this.db.query("COMMIT");

        enrollmentLogger.info("Student transferred successfully", {
          studentId,
          fromClassId,
          toClassId,
          transferredBy,
          reason,
        });

        return newEnrollment;
      } catch (error) {
        await this.db.query("ROLLBACK");
        throw error;
      }
    } catch (error) {
      enrollmentLogger.error("Failed to transfer student", {
        error: error.message,
        studentId,
        fromClassId,
        toClassId,
      });
      throw error;
    }
  }

  async getEnrollmentHistory(studentId, limit = 50, offset = 0) {
    try {
      const result = await this.db.query(
        `
        SELECT e.*, c.name as class_name, c.code as class_code, c.academic_year,
               d.name as department_name, 
               teacher.name as teacher_name,
               enroller.name as enrolled_by_name,
               unenroller.name as unenrolled_by_name
        FROM enrollments e
        JOIN classes c ON e.class_id = c.id
        LEFT JOIN departments d ON c.department_id = d.id
        JOIN users teacher ON c.teacher_id = teacher.id
        LEFT JOIN users enroller ON e.enrolled_by = enroller.id
        LEFT JOIN users unenroller ON e.unenrolled_by = unenroller.id
        WHERE e.student_id = $1
        ORDER BY e.created_at DESC
        LIMIT $2 OFFSET $3
      `,
        [studentId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      enrollmentLogger.error("Failed to get enrollment history", {
        error: error.message,
        studentId,
      });
      throw error;
    }
  }

  async getEnrollmentStatistics(classId = null, academicYear = null) {
    try {
      let sql = `
        SELECT 
          COUNT(e.id) as total_enrollments,
          COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_enrollments,
          COUNT(CASE WHEN e.status = 'inactive' THEN 1 END) as inactive_enrollments,
          COUNT(DISTINCT e.student_id) as unique_students,
          COUNT(DISTINCT e.class_id) as unique_classes
        FROM enrollments e
        JOIN classes c ON e.class_id = c.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (classId) {
        paramCount++;
        sql += ` AND e.class_id = $${paramCount}`;
        params.push(classId);
      }

      if (academicYear) {
        paramCount++;
        sql += ` AND c.academic_year = $${paramCount}`;
        params.push(academicYear);
      }

      const result = await this.db.query(sql, params);
      return result.rows[0];
    } catch (error) {
      enrollmentLogger.error("Failed to get enrollment statistics", {
        error: error.message,
      });
      throw error;
    }
  }

  async getWaitingList(classId) {
    try {
      // For now, return empty array since we haven't implemented waiting lists
      // In future, this could track students who tried to enroll when class was full
      return [];
    } catch (error) {
      enrollmentLogger.error("Failed to get waiting list", {
        error: error.message,
        classId,
      });
      throw error;
    }
  }

  async checkEnrollmentEligibility(studentId, classId) {
    try {
      const checks = {
        studentExists: false,
        studentActive: false,
        classExists: false,
        classActive: false,
        hasCapacity: false,
        notAlreadyEnrolled: false,
        eligible: false,
      };

      // Check student
      const student = await this.db.query(
        "SELECT id, status, role FROM users WHERE id = $1",
        [studentId]
      );

      if (student.rows.length > 0) {
        checks.studentExists = true;
        checks.studentActive =
          student.rows[0].status === "active" &&
          student.rows[0].role === "student";
      }

      // Check class
      const classInfo = await this.db.query(
        `
        SELECT id, status, max_students,
          (SELECT COUNT(*) FROM enrollments WHERE class_id = $1 AND status = 'active') as current_count
        FROM classes WHERE id = $1
      `,
        [classId]
      );

      if (classInfo.rows.length > 0) {
        checks.classExists = true;
        checks.classActive = classInfo.rows[0].status === "active";
        checks.hasCapacity =
          parseInt(classInfo.rows[0].current_count) <
          classInfo.rows[0].max_students;
      }

      // Check existing enrollment
      const existing = await this.db.query(
        "SELECT status FROM enrollments WHERE student_id = $1 AND class_id = $2",
        [studentId, classId]
      );

      checks.notAlreadyEnrolled =
        existing.rows.length === 0 || existing.rows[0].status !== "active";

      // Overall eligibility
      checks.eligible =
        checks.studentExists &&
        checks.studentActive &&
        checks.classExists &&
        checks.classActive &&
        checks.hasCapacity &&
        checks.notAlreadyEnrolled;

      return checks;
    } catch (error) {
      enrollmentLogger.error("Failed to check enrollment eligibility", {
        error: error.message,
        studentId,
        classId,
      });
      throw error;
    }
  }

  async getEnrollmentsByDateRange(startDate, endDate, status = null) {
    try {
      let sql = `
        SELECT e.*, u.name as student_name, u.email as student_email,
               c.name as class_name, c.code as class_code
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        JOIN classes c ON e.class_id = c.id
        WHERE e.enrollment_date BETWEEN $1 AND $2
      `;

      const params = [startDate, endDate];

      if (status) {
        sql += " AND e.status = $3";
        params.push(status);
      }

      sql += " ORDER BY e.enrollment_date DESC";

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      enrollmentLogger.error("Failed to get enrollments by date range", {
        error: error.message,
        startDate,
        endDate,
      });
      throw error;
    }
  }

  async updateEnrollmentNotes(enrollmentId, notes, updatedBy = null) {
    try {
      const result = await this.db.query(
        `
        UPDATE enrollments 
        SET notes = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `,
        [notes, updatedBy, enrollmentId]
      );

      if (result.rows.length === 0) {
        throw new Error("ENROLLMENT_NOT_FOUND");
      }

      enrollmentLogger.info("Enrollment notes updated", {
        enrollmentId,
        updatedBy,
      });

      return result.rows[0];
    } catch (error) {
      enrollmentLogger.error("Failed to update enrollment notes", {
        error: error.message,
        enrollmentId,
      });
      throw error;
    }
  }
}

// Factory function for dependency injection
export const createEnrollmentService = (req) => {
  const db = withRequestContext(req);
  return new EnrollmentService(db);
};
