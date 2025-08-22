// server/src/services/class.service.js
import { withRequestContext } from "../config/database.js";
import logger from "../utils/logger.js";

const classLogger = logger.child({ module: "class-service" });

export class ClassService {
  constructor(db) {
    this.db = db;
  }

  async createClass({
    name,
    code,
    description,
    departmentId,
    teacherId,
    gradeLevel,
    academicYear,
    maxStudents = 30,
  }) {
    try {
      // Check if class code already exists
      const existingClass = await this.db.query(
        "SELECT id FROM classes WHERE code = $1",
        [code]
      );
      if (existingClass.rows.length > 0) {
        throw new Error("CLASS_CODE_ALREADY_EXISTS");
      }

      // Verify teacher exists and is a teacher
      const teacher = await this.db.query(
        "SELECT id FROM users WHERE id = $1 AND role = $2 AND status = $3",
        [teacherId, "teacher", "active"]
      );
      if (teacher.rows.length === 0) {
        throw new Error("TEACHER_NOT_FOUND");
      }

      // Verify department exists
      if (departmentId) {
        const department = await this.db.query(
          "SELECT id FROM departments WHERE id = $1",
          [departmentId]
        );
        if (department.rows.length === 0) {
          throw new Error("DEPARTMENT_NOT_FOUND");
        }
      }

      const result = await this.db.query(
        `
        INSERT INTO classes (name, code, description, department_id, teacher_id, grade_level, academic_year, max_students, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', CURRENT_TIMESTAMP)
        RETURNING *
      `,
        [
          name,
          code,
          description,
          departmentId,
          teacherId,
          gradeLevel,
          academicYear,
          maxStudents,
        ]
      );

      const newClass = result.rows[0];

      classLogger.info("Class created successfully", {
        classId: newClass.id,
        code: newClass.code,
        teacherId,
      });

      return newClass;
    } catch (error) {
      classLogger.error("Failed to create class", {
        error: error.message,
        code,
        teacherId,
      });
      throw error;
    }
  }

  async getClassById(classId) {
    const result = await this.db.query(
      `
      SELECT c.*, d.name as department_name, u.name as teacher_name, u.email as teacher_email
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      JOIN users u ON c.teacher_id = u.id
      WHERE c.id = $1 AND c.status = 'active'
    `,
      [classId]
    );

    if (result.rows.length === 0) {
      throw new Error("CLASS_NOT_FOUND");
    }

    return result.rows[0];
  }

  async enrollStudent(classId, studentId) {
    try {
      // Check class capacity
      const classInfo = await this.db.query(
        `
        SELECT max_students,
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

      // Verify student exists and is a student
      const student = await this.db.query(
        "SELECT id FROM users WHERE id = $1 AND role = $2 AND status = $3",
        [studentId, "student", "active"]
      );
      if (student.rows.length === 0) {
        throw new Error("STUDENT_NOT_FOUND");
      }

      // Check if already enrolled
      const existingEnrollment = await this.db.query(
        "SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2",
        [studentId, classId]
      );
      if (existingEnrollment.rows.length > 0) {
        throw new Error("STUDENT_ALREADY_ENROLLED");
      }

      const result = await this.db.query(
        `
        INSERT INTO enrollments (student_id, class_id, enrollment_date, status, created_at)
        VALUES ($1, $2, CURRENT_DATE, 'active', CURRENT_TIMESTAMP)
        RETURNING *
      `,
        [studentId, classId]
      );

      classLogger.info("Student enrolled successfully", {
        classId,
        studentId,
        enrollmentId: result.rows[0].id,
      });

      return result.rows[0];
    } catch (error) {
      classLogger.error("Failed to enroll student", {
        error: error.message,
        classId,
        studentId,
      });
      throw error;
    }
  }

  async unenrollStudent(classId, studentId) {
    const result = await this.db.query(
      `
      UPDATE enrollments 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE student_id = $1 AND class_id = $2 AND status = 'active'
      RETURNING *
    `,
      [studentId, classId]
    );

    if (result.rows.length === 0) {
      throw new Error("ENROLLMENT_NOT_FOUND");
    }

    classLogger.info("Student unenrolled successfully", {
      classId,
      studentId,
    });

    return result.rows[0];
  }

  async getClassStudents(classId, teacherId = null) {
    // If teacherId is provided, verify teacher has access
    if (teacherId) {
      await this.validateTeacherAccess(teacherId, classId);
    }

    const result = await this.db.query(
      `
      SELECT u.id, u.email, u.username, u.name, u.first_name, u.last_name,
             e.enrollment_date, e.status as enrollment_status,
             AVG(g.percentage) as average_grade
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN grades g ON u.id = g.student_id AND g.class_id = $1
      WHERE e.class_id = $1 AND e.status = 'active' AND u.status = 'active'
      GROUP BY u.id, u.email, u.username, u.name, u.first_name, u.last_name, e.enrollment_date, e.status
      ORDER BY u.name
    `,
      [classId]
    );

    return result.rows;
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

  async getClassesByTeacher(teacherId) {
    const result = await this.db.query(
      `
      SELECT c.*, d.name as department_name,
             (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id AND status = 'active') as student_count,
             (SELECT COUNT(*) FROM assignments WHERE class_id = c.id AND status = 'active') as assignment_count
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE c.teacher_id = $1 AND c.status = 'active'
      ORDER BY c.name
    `,
      [teacherId]
    );

    return result.rows;
  }

  async getClassesByStudent(studentId) {
    const result = await this.db.query(
      `
      SELECT c.*, d.name as department_name, u.name as teacher_name,
             e.enrollment_date, e.status as enrollment_status,
             AVG(g.percentage) as average_grade
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      JOIN users u ON c.teacher_id = u.id
      JOIN enrollments e ON c.id = e.class_id
      LEFT JOIN grades g ON c.id = g.class_id AND g.student_id = $1
      WHERE e.student_id = $1 AND e.status = 'active' AND c.status = 'active'
      GROUP BY c.id, c.name, c.code, c.description, c.department_id, c.teacher_id, c.grade_level, 
               c.academic_year, c.max_students, c.status, c.created_at, c.updated_at,
               d.name, u.name, e.enrollment_date, e.status
      ORDER BY c.name
    `,
      [studentId]
    );

    return result.rows;
  }

  async getClassAnalytics(classId, teacherId) {
    // Verify teacher has access
    await this.validateTeacherAccess(teacherId, classId);

    const stats = await this.db.query(
      `
      SELECT
        (SELECT COUNT(*) FROM enrollments WHERE class_id = $1 AND status = 'active') as enrolled_students,
        (SELECT COUNT(*) FROM assignments WHERE class_id = $1 AND status = 'active') as total_assignments,
        (SELECT AVG(percentage) FROM grades g
         JOIN assignments a ON g.assignment_id = a.id
         WHERE a.class_id = $1) as average_grade,
        (SELECT COUNT(*) FROM attendance WHERE class_id = $1 AND status = 'present') as total_present,
        (SELECT COUNT(*) FROM attendance WHERE class_id = $1) as total_attendance_records,
        (SELECT COUNT(*) FROM submissions s 
         JOIN assignments a ON s.assignment_id = a.id 
         WHERE a.class_id = $1 AND s.status = 'submitted') as pending_submissions
    `,
      [classId]
    );

    return stats.rows[0];
  }

  async updateClass(classId, teacherId, updates) {
    // Verify teacher has access (only teacher can update their own class)
    await this.validateTeacherAccess(teacherId, classId);

    const allowedFields = [
      "name",
      "description",
      "max_students",
      "grade_level",
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

    // Validate max_students if being updated
    if (updates.max_students !== undefined) {
      const currentCount = await this.db.query(
        "SELECT COUNT(*) as count FROM enrollments WHERE class_id = $1 AND status = $2",
        [classId, "active"]
      );

      if (updates.max_students < currentCount.rows[0].count) {
        throw new Error("MAX_STUDENTS_BELOW_CURRENT_ENROLLMENT");
      }
    }

    paramCount++;
    values.push(classId);

    const result = await this.db.query(
      `
      UPDATE classes SET ${setClause.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    );

    classLogger.info("Class updated successfully", {
      classId,
      teacherId,
      fields: Object.keys(updates),
    });

    return result.rows[0];
  }

  async searchClasses(
    query,
    department = null,
    teacher = null,
    limit = 20,
    offset = 0
  ) {
    let sql = `
      SELECT c.*, d.name as department_name, u.name as teacher_name,
             (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id AND status = 'active') as student_count
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      JOIN users u ON c.teacher_id = u.id
      WHERE c.status = 'active' AND (
        c.name ILIKE $1 OR 
        c.code ILIKE $1 OR 
        c.description ILIKE $1
      )
    `;

    const params = [`%${query}%`];
    let paramCount = 1;

    if (department) {
      paramCount++;
      sql += ` AND c.department_id = $${paramCount}`;
      params.push(department);
    }

    if (teacher) {
      paramCount++;
      sql += ` AND c.teacher_id = $${paramCount}`;
      params.push(teacher);
    }

    paramCount++;
    sql += ` ORDER BY c.name LIMIT $${paramCount}`;
    params.push(limit.toString());

    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset.toString());

    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async getAllClasses(
    department = null,
    academicYear = null,
    limit = 50,
    offset = 0
  ) {
    let sql = `
      SELECT c.*, d.name as department_name, u.name as teacher_name,
             (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id AND status = 'active') as student_count
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      JOIN users u ON c.teacher_id = u.id
      WHERE c.status = 'active'
    `;

    const params = [];
    let paramCount = 0;

    if (department) {
      paramCount++;
      sql += ` AND c.department_id = $${paramCount}`;
      params.push(department);
    }

    if (academicYear) {
      paramCount++;
      sql += ` AND c.academic_year = $${paramCount}`;
      params.push(academicYear);
    }

    paramCount++;
    sql += ` ORDER BY c.name LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async deleteClass(classId, teacherId) {
    // Verify teacher has access
    await this.validateTeacherAccess(teacherId, classId);

    // Check if there are enrollments, assignments, or grades
    const dependencies = await this.db.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM enrollments WHERE class_id = $1) as enrollment_count,
        (SELECT COUNT(*) FROM assignments WHERE class_id = $1) as assignment_count,
        (SELECT COUNT(*) FROM grades WHERE class_id = $1) as grade_count
    `,
      [classId]
    );

    const { enrollment_count, assignment_count, grade_count } =
      dependencies.rows[0];

    if (enrollment_count > 0 || assignment_count > 0 || grade_count > 0) {
      // Soft delete - mark as inactive
      await this.db.query(
        "UPDATE classes SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        ["inactive", classId]
      );
      classLogger.info("Class soft deleted (has dependencies)", {
        classId,
        teacherId,
      });
    } else {
      // Hard delete if no dependencies
      await this.db.query("DELETE FROM classes WHERE id = $1", [classId]);
      classLogger.info("Class hard deleted (no dependencies)", {
        classId,
        teacherId,
      });
    }
  }

  async getClassSchedule(classId) {
    const result = await this.db.query(
      `
      SELECT s.*, c.name as class_name
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      WHERE s.class_id = $1 AND s.status = 'active'
      ORDER BY s.day_of_week, s.start_time
    `,
      [classId]
    );

    return result.rows;
  }

  async bulkEnrollStudents(classId, studentIds, teacherId) {
    // Verify teacher has access
    await this.validateTeacherAccess(teacherId, classId);

    // Check class capacity
    const classInfo = await this.db.query(
      `
      SELECT max_students,
        (SELECT COUNT(*) FROM enrollments WHERE class_id = $1 AND status = 'active') as current_count
      FROM classes WHERE id = $1 AND status = 'active'
    `,
      [classId]
    );

    if (classInfo.rows.length === 0) {
      throw new Error("CLASS_NOT_FOUND");
    }

    const { max_students, current_count } = classInfo.rows[0];
    if (parseInt(current_count) + studentIds.length > max_students) {
      throw new Error("BULK_ENROLLMENT_EXCEEDS_CAPACITY");
    }

    const enrollments = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        const enrollment = await this.enrollStudent(classId, studentId);
        enrollments.push(enrollment);
      } catch (error) {
        errors.push({ studentId, error: error.message });
      }
    }

    classLogger.info("Bulk enrollment completed", {
      classId,
      totalStudents: studentIds.length,
      successful: enrollments.length,
      errors: errors.length,
    });

    return { enrollments, errors };
  }
}

// Factory function for dependency injection
export const createClassService = (req) => {
  const db = withRequestContext(req);
  return new ClassService(db);
};
