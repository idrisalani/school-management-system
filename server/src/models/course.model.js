// @ts-nocheck
// server/src/models/course.model.js - PostgreSQL Course Model
import { query } from "../config/database";

/**
 * PostgreSQL Course/Class Model
 */
class Course {
  /**
   * Find course by ID
   * @param {string} id - Course ID
   * @returns {Object|null} Course object or null
   */
  static async findById(id) {
    const result = await query(
      `
      SELECT c.*, d.name as department_name, 
             u.first_name || ' ' || u.last_name as teacher_name
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = $1
    `,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find course by code
   * @param {string} code - Course code
   * @returns {Object|null} Course object or null
   */
  static async findByCode(code) {
    const result = await query("SELECT * FROM classes WHERE code = $1", [
      code.toUpperCase(),
    ]);
    return result.rows[0] || null;
  }

  /**
   * Create new course
   * @param {Object} courseData - Course data
   * @returns {Object} Created course
   */
  static async create(courseData) {
    const {
      name,
      code,
      description,
      departmentId,
      teacherId,
      gradeLevel,
      subject,
      room,
      capacity = 30,
      academicYear = "2024-2025",
      semester = "Fall",
      status = "active",
    } = courseData;

    const result = await query(
      `
      INSERT INTO classes (
        name, code, description, department_id, teacher_id, grade_level,
        subject, room, capacity, academic_year, semester, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `,
      [
        name,
        code.toUpperCase(),
        description,
        departmentId,
        teacherId,
        gradeLevel,
        subject,
        room,
        capacity,
        academicYear,
        semester,
        status,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update course by ID
   * @param {string} id - Course ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated course
   */
  static async findByIdAndUpdate(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach((key) => {
      const dbField = this.camelToSnake(key);
      if (key === "code") {
        fields.push(`${dbField} = $${paramCount}`);
        values.push(updateData[key].toUpperCase());
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
      UPDATE classes 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete course by ID
   * @param {string} id - Course ID
   * @returns {boolean} Success status
   */
  static async findByIdAndDelete(id) {
    const result = await query(
      "DELETE FROM classes WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Find courses by teacher
   * @param {string} teacherId - Teacher ID
   * @returns {Array} Array of courses
   */
  static async findByTeacher(teacherId) {
    const result = await query(
      `
      SELECT c.*, d.name as department_name,
             COUNT(e.student_id) as enrolled_count
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
      WHERE c.teacher_id = $1
      GROUP BY c.id, d.name
      ORDER BY c.academic_year DESC, c.semester, c.name
    `,
      [teacherId]
    );
    return result.rows;
  }

  /**
   * Find courses by department
   * @param {string} departmentId - Department ID
   * @returns {Array} Array of courses
   */
  static async findByDepartment(departmentId) {
    const result = await query(
      `
      SELECT c.*, u.first_name || ' ' || u.last_name as teacher_name,
             COUNT(e.student_id) as enrolled_count
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
      WHERE c.department_id = $1
      GROUP BY c.id, u.first_name, u.last_name
      ORDER BY c.name
    `,
      [departmentId]
    );
    return result.rows;
  }

  /**
   * Find all courses with pagination
   * @param {Object} options - Query options
   * @returns {Object} Courses with pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status = null,
      academicYear = null,
      semester = null,
      search = null,
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (academicYear) {
      whereClause += ` AND c.academic_year = $${paramCount}`;
      params.push(academicYear);
      paramCount++;
    }

    if (semester) {
      whereClause += ` AND c.semester = $${paramCount}`;
      params.push(semester);
      paramCount++;
    }

    if (search) {
      whereClause += ` AND (
        c.name ILIKE $${paramCount} OR 
        c.code ILIKE $${paramCount} OR 
        c.subject ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countResult = await query(
      `
      SELECT COUNT(*) as total
      FROM classes c
      ${whereClause}
    `,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    // Get courses
    params.push(limit, offset);
    const result = await query(
      `
      SELECT c.*, d.name as department_name,
             u.first_name || ' ' || u.last_name as teacher_name,
             COUNT(e.student_id) as enrolled_count
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
      ${whereClause}
      GROUP BY c.id, d.name, u.first_name, u.last_name
      ORDER BY c.academic_year DESC, c.semester, c.name
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `,
      params
    );

    return {
      courses: result.rows,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: result.rowCount,
        totalRecords: total,
      },
    };
  }

  /**
   * Get students enrolled in course
   * @param {string} courseId - Course ID
   * @returns {Array} Array of enrolled students
   */
  static async getEnrolledStudents(courseId) {
    const result = await query(
      `
      SELECT u.*, e.enrollment_date, e.status as enrollment_status
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.class_id = $1 AND u.role = 'student'
      ORDER BY u.last_name, u.first_name
    `,
      [courseId]
    );
    return result.rows;
  }

  /**
   * Enroll student in course
   * @param {string} courseId - Course ID
   * @param {string} studentId - Student ID
   * @returns {Object} Enrollment record
   */
  static async enrollStudent(courseId, studentId) {
    // Check if already enrolled
    const existing = await query(
      `
      SELECT id FROM enrollments 
      WHERE class_id = $1 AND student_id = $2
    `,
      [courseId, studentId]
    );

    if (existing.rows.length > 0) {
      throw new Error("Student is already enrolled in this course");
    }

    const result = await query(
      `
      INSERT INTO enrollments (class_id, student_id, enrollment_date, status)
      VALUES ($1, $2, CURRENT_DATE, 'active')
      RETURNING *
    `,
      [courseId, studentId]
    );

    return result.rows[0];
  }

  /**
   * Remove student from course
   * @param {string} courseId - Course ID
   * @param {string} studentId - Student ID
   * @returns {boolean} Success status
   */
  static async removeStudent(courseId, studentId) {
    const result = await query(
      `
      UPDATE enrollments 
      SET status = 'dropped', updated_at = NOW()
      WHERE class_id = $1 AND student_id = $2
      RETURNING id
    `,
      [courseId, studentId]
    );

    return result.rowCount > 0;
  }

  /**
   * Get course statistics
   * @param {string} courseId - Course ID
   * @returns {Object} Course statistics
   */
  static async getStatistics(courseId) {
    const result = await query(
      `
      SELECT 
        COUNT(DISTINCT e.student_id) as total_enrolled,
        COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.id END) as total_assignments,
        AVG(CASE WHEN g.percentage IS NOT NULL THEN g.percentage END) as average_grade,
        COUNT(DISTINCT CASE WHEN att.status = 'present' THEN att.id END)::float / 
        NULLIF(COUNT(DISTINCT att.id), 0) * 100 as attendance_rate
      FROM classes c
      LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
      LEFT JOIN assignments a ON c.id = a.class_id
      LEFT JOIN grades g ON a.id = g.assignment_id
      LEFT JOIN attendance att ON c.id = att.class_id
      WHERE c.id = $1
      GROUP BY c.id
    `,
      [courseId]
    );

    return (
      result.rows[0] || {
        total_enrolled: 0,
        total_assignments: 0,
        average_grade: null,
        attendance_rate: null,
      }
    );
  }

  /**
   * Search courses
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of courses
   */
  static async search(searchTerm, filters = {}) {
    const { departmentId, teacherId, gradeLevel, status = "active" } = filters;

    let whereClause = "WHERE c.status = $1";
    const params = [status];
    let paramCount = 2;

    if (searchTerm) {
      whereClause += ` AND (
        c.name ILIKE $${paramCount} OR 
        c.code ILIKE $${paramCount} OR 
        c.subject ILIKE $${paramCount} OR
        c.description ILIKE $${paramCount}
      )`;
      params.push(`%${searchTerm}%`);
      paramCount++;
    }

    if (departmentId) {
      whereClause += ` AND c.department_id = $${paramCount}`;
      params.push(departmentId);
      paramCount++;
    }

    if (teacherId) {
      whereClause += ` AND c.teacher_id = $${paramCount}`;
      params.push(teacherId);
      paramCount++;
    }

    if (gradeLevel) {
      whereClause += ` AND c.grade_level = $${paramCount}`;
      params.push(gradeLevel);
      paramCount++;
    }

    const result = await query(
      `
      SELECT c.*, d.name as department_name,
             u.first_name || ' ' || u.last_name as teacher_name
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.teacher_id = u.id
      ${whereClause}
      ORDER BY c.name
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
   * Format course object for API response
   * @param {Object} course - Raw course object from database
   * @returns {Object} Formatted course object
   */
  static formatCourse(course) {
    if (!course) return null;

    return {
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      departmentId: course.department_id,
      departmentName: course.department_name,
      teacherId: course.teacher_id,
      teacherName: course.teacher_name,
      gradeLevel: course.grade_level,
      subject: course.subject,
      room: course.room,
      capacity: course.capacity,
      enrolledCount: course.enrolled_count || 0,
      academicYear: course.academic_year,
      semester: course.semester,
      status: course.status,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
    };
  }
}

export default Course;
