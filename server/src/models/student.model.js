// @ts-nocheck
// server/src/models/student.model.js - PostgreSQL Student Model
import { query, withTransaction } from "../config/database";

/**
 * PostgreSQL Student Model
 * Extended functionality specifically for student operations
 */
class Student {
  /**
   * Find student by ID
   * @param {string} id - Student ID
   * @returns {Object|null} Student object or null
   */
  static async findById(id) {
    const result = await query(
      `
      SELECT u.*, 
             COUNT(DISTINCT e.class_id) as enrolled_classes_count,
             AVG(g.percentage) as overall_gpa
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.student_id AND e.status = 'active'
      LEFT JOIN grades g ON u.id = g.student_id
      WHERE u.id = $1 AND u.role = 'student'
      GROUP BY u.id
    `,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get student's enrolled classes
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Array} Array of enrolled classes
   */
  static async getEnrolledClasses(studentId, options = {}) {
    const { academicYear = null, semester = null, status = "active" } = options;

    let whereClause = "WHERE e.student_id = $1 AND e.status = $2";
    const params = [studentId, status];
    let paramCount = 3;

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

    const result = await query(
      `
      SELECT c.*, e.enrollment_date, e.status as enrollment_status,
             t.first_name || ' ' || t.last_name as teacher_name,
             d.name as department_name,
             COUNT(DISTINCT a.id) as total_assignments,
             COUNT(DISTINCT g.id) as completed_assignments,
             AVG(g.percentage) as class_average
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      LEFT JOIN users t ON c.teacher_id = t.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN assignments a ON c.id = a.class_id AND a.status = 'active'
      LEFT JOIN grades g ON a.id = g.assignment_id AND g.student_id = e.student_id
      ${whereClause}
      GROUP BY c.id, e.enrollment_date, e.status, t.first_name, t.last_name, d.name
      ORDER BY c.name
    `,
      params
    );

    return result.rows;
  }

  /**
   * Get student's assignments
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Array} Array of assignments
   */
  static async getAssignments(studentId, options = {}) {
    const {
      classId = null,
      status = null,
      dueDate = null,
      limit = 50,
    } = options;

    let whereClause = "WHERE e.student_id = $1 AND e.status = 'active'";
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

    if (dueDate === "upcoming") {
      whereClause += ` AND a.due_date > NOW()`;
    } else if (dueDate === "overdue") {
      whereClause += ` AND a.due_date < NOW() AND (s.status IS NULL OR s.status != 'submitted')`;
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
   * Get student's grades
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Array} Array of grades
   */
  static async getGrades(studentId, options = {}) {
    const {
      classId = null,
      academicYear = null,
      semester = null,
      limit = 50,
    } = options;

    let whereClause = "WHERE g.student_id = $1";
    const params = [studentId];
    let paramCount = 2;

    if (classId) {
      whereClause += ` AND g.class_id = $${paramCount}`;
      params.push(classId);
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
   * Get student's attendance
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Array} Array of attendance records
   */
  static async getAttendance(studentId, options = {}) {
    const {
      classId = null,
      startDate = null,
      endDate = null,
      status = null,
      limit = 100,
    } = options;

    let whereClause = "WHERE a.student_id = $1";
    const params = [studentId];
    let paramCount = 2;

    if (classId) {
      whereClause += ` AND a.class_id = $${paramCount}`;
      params.push(classId);
      paramCount++;
    }

    if (startDate) {
      whereClause += ` AND a.date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereClause += ` AND a.date <= $${paramCount}`;
      params.push(endDate);
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
      SELECT a.*, c.name as class_name, c.code as class_code
      FROM attendance a
      LEFT JOIN classes c ON a.class_id = c.id
      ${whereClause}
      ORDER BY a.date DESC
      LIMIT $${paramCount}
    `,
      params
    );

    return result.rows;
  }

  /**
   * Get student's academic performance summary
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Object} Performance summary
   */
  static async getPerformanceSummary(studentId, options = {}) {
    const { academicYear = null, semester = null } = options;

    let whereClause = "WHERE g.student_id = $1";
    const params = [studentId];
    let paramCount = 2;

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

    const result = await query(
      `
      SELECT 
        COUNT(DISTINCT g.class_id) as enrolled_classes,
        COUNT(g.id) as total_grades,
        AVG(g.percentage) as overall_gpa,
        COUNT(CASE WHEN g.percentage >= 90 THEN 1 END) as a_grades,
        COUNT(CASE WHEN g.percentage >= 80 AND g.percentage < 90 THEN 1 END) as b_grades,
        COUNT(CASE WHEN g.percentage >= 70 AND g.percentage < 80 THEN 1 END) as c_grades,
        COUNT(CASE WHEN g.percentage >= 60 AND g.percentage < 70 THEN 1 END) as d_grades,
        COUNT(CASE WHEN g.percentage < 60 THEN 1 END) as f_grades
      FROM grades g
      LEFT JOIN classes c ON g.class_id = c.id
      ${whereClause}
    `,
      params
    );

    const summary = result.rows[0];

    // Get attendance summary
    const attendanceResult = await query(
      `
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days
      FROM attendance a
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.student_id = $1
      ${academicYear ? "AND c.academic_year = $" + paramCount : ""}
      ${
        semester
          ? "AND c.semester = $" + (paramCount + (academicYear ? 1 : 0))
          : ""
      }
    `,
      academicYear && semester
        ? [studentId, academicYear, semester]
        : academicYear
        ? [studentId, academicYear]
        : semester
        ? [studentId, semester]
        : [studentId]
    );

    const attendance = attendanceResult.rows[0];

    return {
      academic: {
        enrolledClasses: parseInt(summary.enrolled_classes),
        totalGrades: parseInt(summary.total_grades),
        overallGpa: summary.overall_gpa
          ? parseFloat(summary.overall_gpa)
          : null,
        gradeDistribution: {
          A: parseInt(summary.a_grades),
          B: parseInt(summary.b_grades),
          C: parseInt(summary.c_grades),
          D: parseInt(summary.d_grades),
          F: parseInt(summary.f_grades),
        },
      },
      attendance: {
        totalDays: parseInt(attendance.total_days),
        presentDays: parseInt(attendance.present_days),
        absentDays: parseInt(attendance.absent_days),
        lateDays: parseInt(attendance.late_days),
        attendanceRate:
          attendance.total_days > 0
            ? (
                (parseInt(attendance.present_days) /
                  parseInt(attendance.total_days)) *
                100
              ).toFixed(2)
            : 0,
      },
    };
  }

  /**
   * Get student's payment summary
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Object} Payment summary
   */
  static async getPaymentSummary(studentId, options = {}) {
    const { academicYear = null } = options;

    let whereClause = "WHERE student_id = $1";
    const params = [studentId];

    if (academicYear) {
      whereClause += " AND academic_year = $2";
      params.push(academicYear);
    }

    const result = await query(
      `
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as outstanding_amount,
        COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END) as overdue_count
      FROM payments
      ${whereClause}
    `,
      params
    );

    const summary = result.rows[0];
    return {
      totalPayments: parseInt(summary.total_payments),
      totalAmount: parseFloat(summary.total_amount || 0),
      paidAmount: parseFloat(summary.paid_amount || 0),
      outstandingAmount: parseFloat(summary.outstanding_amount || 0),
      overdueCount: parseInt(summary.overdue_count),
      paymentStatus:
        parseFloat(summary.outstanding_amount || 0) === 0
          ? "current"
          : parseInt(summary.overdue_count) > 0
          ? "overdue"
          : "pending",
    };
  }

  /**
   * Get student's schedule
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Array} Array of scheduled classes
   */
  static async getSchedule(studentId, options = {}) {
    const { academicYear = null, semester = null } = options;

    let whereClause = "WHERE e.student_id = $1 AND e.status = 'active'";
    const params = [studentId];
    let paramCount = 2;

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

    const result = await query(
      `
      SELECT s.*, c.name as class_name, c.code as class_code,
             c.room, c.subject,
             t.first_name || ' ' || t.last_name as teacher_name
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      JOIN enrollments e ON c.id = e.class_id
      LEFT JOIN users t ON c.teacher_id = t.id
      ${whereClause}
      ORDER BY s.day_of_week, s.start_time
    `,
      params
    );

    return result.rows;
  }

  /**
   * Enroll student in class
   * @param {string} studentId - Student ID
   * @param {string} classId - Class ID
   * @returns {Object} Enrollment record
   */
  static async enrollInClass(studentId, classId) {
    // Check if already enrolled
    const existing = await query(
      `
      SELECT id FROM enrollments 
      WHERE student_id = $1 AND class_id = $2
    `,
      [studentId, classId]
    );

    if (existing.rows.length > 0) {
      throw new Error("Student is already enrolled in this class");
    }

    // Check class capacity
    const classInfo = await query(
      `
      SELECT capacity, 
             (SELECT COUNT(*) FROM enrollments WHERE class_id = $1 AND status = 'active') as current_enrolled
      FROM classes WHERE id = $1
    `,
      [classId]
    );

    if (classInfo.rows.length === 0) {
      throw new Error("Class not found");
    }

    const { capacity, current_enrolled } = classInfo.rows[0];
    if (current_enrolled >= capacity) {
      throw new Error("Class is at full capacity");
    }

    const result = await query(
      `
      INSERT INTO enrollments (student_id, class_id, enrollment_date, status)
      VALUES ($1, $2, CURRENT_DATE, 'active')
      RETURNING *
    `,
      [studentId, classId]
    );

    return result.rows[0];
  }

  /**
   * Drop student from class
   * @param {string} studentId - Student ID
   * @param {string} classId - Class ID
   * @returns {boolean} Success status
   */
  static async dropFromClass(studentId, classId) {
    const result = await query(
      `
      UPDATE enrollments 
      SET status = 'dropped', updated_at = NOW()
      WHERE student_id = $1 AND class_id = $2
      RETURNING id
    `,
      [studentId, classId]
    );

    return result.rowCount > 0;
  }

  /**
   * Get student dashboard data
   * @param {string} studentId - Student ID
   * @returns {Object} Dashboard data
   */
  static async getDashboardData(studentId) {
    const [
      student,
      upcomingAssignments,
      recentGrades,
      todaySchedule,
      performanceSummary,
    ] = await Promise.all([
      this.findById(studentId),
      this.getAssignments(studentId, { dueDate: "upcoming", limit: 5 }),
      this.getGrades(studentId, { limit: 5 }),
      this.getSchedule(studentId),
      this.getPerformanceSummary(studentId),
    ]);

    return {
      student,
      upcomingAssignments,
      recentGrades,
      todaySchedule: todaySchedule.filter(
        (s) => s.day_of_week === new Date().getDay()
      ),
      performanceSummary,
    };
  }

  /**
   * Format student object for API response
   * @param {Object} student - Raw student object from database
   * @returns {Object} Formatted student object
   */
  static formatStudent(student) {
    if (!student) return null;

    return {
      id: student.id,
      username: student.username,
      firstName: student.first_name,
      lastName: student.last_name,
      name: `${student.first_name} ${student.last_name}`.trim(),
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.date_of_birth,
      address: student.address,
      emergencyContact: student.emergency_contact,
      enrolledClassesCount: student.enrolled_classes_count || 0,
      overallGpa: student.overall_gpa ? parseFloat(student.overall_gpa) : null,
      status: student.status,
      isVerified: student.is_verified,
      lastLoginAt: student.last_login_at,
      createdAt: student.created_at,
      updatedAt: student.updated_at,
    };
  }
}

export default Student;
