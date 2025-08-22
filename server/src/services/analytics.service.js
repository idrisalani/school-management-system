// server/src/services/analytics.service.js
import { withRequestContext } from "../config/database.js";
import logger from "../utils/logger.js";

const analyticsLogger = logger.child({ module: "analytics-service" });

export class AnalyticsService {
  constructor(db) {
    this.db = db;
  }

  async getDashboardOverview(userId, userRole) {
    try {
      if (userRole === "admin") {
        return await this.getAdminDashboard();
      } else if (userRole === "teacher") {
        return await this.getTeacherDashboard(userId);
      } else if (userRole === "student") {
        return await this.getStudentDashboard(userId);
      } else {
        throw new Error("INVALID_USER_ROLE");
      }
    } catch (error) {
      analyticsLogger.error("Failed to get dashboard overview", {
        error: error.message,
        userId,
        userRole,
      });
      throw error;
    }
  }

  async getAdminDashboard() {
    try {
      const overview = await this.db.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'student' AND status = 'active') as total_students,
          (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status = 'active') as total_teachers,
          (SELECT COUNT(*) FROM classes WHERE status = 'active') as total_classes,
          (SELECT COUNT(*) FROM assignments WHERE status = 'active') as total_assignments,
          (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as total_enrollments,
          (SELECT AVG(percentage) FROM grades WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_avg_grade
      `);

      const recentActivity = await this.db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(CASE WHEN table_name = 'users' THEN 1 END) as new_users,
          COUNT(CASE WHEN table_name = 'enrollments' THEN 1 END) as new_enrollments,
          COUNT(CASE WHEN table_name = 'assignments' THEN 1 END) as new_assignments
        FROM (
          SELECT created_at, 'users' as table_name FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          UNION ALL
          SELECT created_at, 'enrollments' as table_name FROM enrollments WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          UNION ALL
          SELECT created_at, 'assignments' as table_name FROM assignments WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        ) combined
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `);

      const gradeDistribution = await this.db.query(`
        SELECT 
          grade_letter,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
        FROM grades 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY grade_letter
        ORDER BY grade_letter
      `);

      return {
        overview: overview.rows[0],
        recentActivity: recentActivity.rows,
        gradeDistribution: gradeDistribution.rows,
      };
    } catch (error) {
      analyticsLogger.error("Failed to get admin dashboard", {
        error: error.message,
      });
      throw error;
    }
  }

  async getTeacherDashboard(teacherId) {
    try {
      const overview = await this.db.query(
        `
        SELECT 
          (SELECT COUNT(*) FROM classes WHERE teacher_id = $1 AND status = 'active') as classes_teaching,
          (SELECT COUNT(*) FROM assignments a 
           JOIN classes c ON a.class_id = c.id 
           WHERE c.teacher_id = $1 AND a.status = 'active') as total_assignments,
          (SELECT COUNT(*) FROM enrollments e 
           JOIN classes c ON e.class_id = c.id 
           WHERE c.teacher_id = $1 AND e.status = 'active') as total_students,
          (SELECT COUNT(*) FROM submissions s 
           JOIN assignments a ON s.assignment_id = a.id 
           JOIN classes c ON a.class_id = c.id 
           WHERE c.teacher_id = $1 AND s.status = 'submitted') as pending_grading
      `,
        [teacherId]
      );

      const recentGrades = await this.db.query(
        `
        SELECT g.*, a.title as assignment_title, u.name as student_name, c.name as class_name
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        JOIN users u ON g.student_id = u.id
        JOIN classes c ON a.class_id = c.id
        WHERE c.teacher_id = $1
        ORDER BY g.created_at DESC
        LIMIT 10
      `,
        [teacherId]
      );

      const classPerformance = await this.db.query(
        `
        SELECT 
          c.name as class_name,
          c.id as class_id,
          COUNT(DISTINCT e.student_id) as student_count,
          AVG(g.percentage) as average_grade,
          COUNT(g.id) as total_grades
        FROM classes c
        LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
        LEFT JOIN grades g ON c.id = g.class_id
        WHERE c.teacher_id = $1 AND c.status = 'active'
        GROUP BY c.id, c.name
        ORDER BY c.name
      `,
        [teacherId]
      );

      return {
        overview: overview.rows[0],
        recentGrades: recentGrades.rows,
        classPerformance: classPerformance.rows,
      };
    } catch (error) {
      analyticsLogger.error("Failed to get teacher dashboard", {
        error: error.message,
        teacherId,
      });
      throw error;
    }
  }

  async getStudentDashboard(studentId) {
    try {
      const overview = await this.db.query(
        `
        SELECT 
          (SELECT COUNT(*) FROM enrollments WHERE student_id = $1 AND status = 'active') as enrolled_classes,
          (SELECT COUNT(*) FROM assignments a 
           JOIN enrollments e ON a.class_id = e.class_id 
           WHERE e.student_id = $1 AND e.status = 'active' AND a.status = 'active') as total_assignments,
          (SELECT COUNT(*) FROM submissions WHERE student_id = $1) as submitted_assignments,
          (SELECT AVG(percentage) FROM grades WHERE student_id = $1) as overall_gpa,
          (SELECT COUNT(*) FROM attendance WHERE student_id = $1 AND status = 'present') as days_present,
          (SELECT COUNT(*) FROM attendance WHERE student_id = $1) as total_attendance_records
      `,
        [studentId]
      );

      const recentGrades = await this.db.query(
        `
        SELECT g.*, a.title as assignment_title, c.name as class_name
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
        WHERE g.student_id = $1
        ORDER BY g.created_at DESC
        LIMIT 10
      `,
        [studentId]
      );

      const upcomingAssignments = await this.db.query(
        `
        SELECT a.*, c.name as class_name, s.status as submission_status
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        JOIN enrollments e ON c.id = e.class_id
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
        WHERE e.student_id = $1 AND e.status = 'active' 
          AND a.status = 'active' AND a.due_date > CURRENT_DATE
          AND (s.id IS NULL OR s.status != 'submitted')
        ORDER BY a.due_date ASC
        LIMIT 5
      `,
        [studentId]
      );

      const attendanceRate =
        overview.rows[0].total_attendance_records > 0
          ? (
              (overview.rows[0].days_present /
                overview.rows[0].total_attendance_records) *
              100
            ).toFixed(2)
          : "0.00";

      return {
        overview: {
          ...overview.rows[0],
          attendance_rate: attendanceRate,
        },
        recentGrades: recentGrades.rows,
        upcomingAssignments: upcomingAssignments.rows,
      };
    } catch (error) {
      analyticsLogger.error("Failed to get student dashboard", {
        error: error.message,
        studentId,
      });
      throw error;
    }
  }

  async getClassAnalytics(classId, teacherId) {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      const overview = await this.db.query(
        `
        SELECT 
          c.name,
          c.code,
          (SELECT COUNT(*) FROM enrollments WHERE class_id = $1 AND status = 'active') as enrolled_students,
          (SELECT COUNT(*) FROM assignments WHERE class_id = $1 AND status = 'active') as total_assignments,
          (SELECT AVG(percentage) FROM grades g 
           JOIN assignments a ON g.assignment_id = a.id 
           WHERE a.class_id = $1) as class_average
        FROM classes c
        WHERE c.id = $1
      `,
        [classId]
      );

      const gradeDistribution = await this.db.query(
        `
        SELECT 
          grade_letter,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        WHERE a.class_id = $1
        GROUP BY grade_letter
        ORDER BY grade_letter
      `,
        [classId]
      );

      const attendanceStats = await this.db.query(
        `
        SELECT 
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
          COUNT(*) as total_records,
          ROUND((COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2) as attendance_rate
        FROM attendance
        WHERE class_id = $1
      `,
        [classId]
      );

      const topPerformers = await this.db.query(
        `
        SELECT 
          u.name as student_name,
          AVG(g.percentage) as average_grade,
          COUNT(g.id) as grade_count
        FROM users u
        JOIN grades g ON u.id = g.student_id
        JOIN assignments a ON g.assignment_id = a.id
        WHERE a.class_id = $1
        GROUP BY u.id, u.name
        HAVING COUNT(g.id) >= 3
        ORDER BY AVG(g.percentage) DESC
        LIMIT 5
      `,
        [classId]
      );

      return {
        overview: overview.rows[0],
        gradeDistribution: gradeDistribution.rows,
        attendanceStats: attendanceStats.rows[0] || {},
        topPerformers: topPerformers.rows,
      };
    } catch (error) {
      analyticsLogger.error("Failed to get class analytics", {
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

  async getPerformanceTrends(classId, teacherId, period = "30 days") {
    try {
      await this.validateTeacherAccess(teacherId, classId);

      const trends = await this.db.query(
        `
        SELECT 
          DATE(g.created_at) as date,
          AVG(g.percentage) as average_percentage,
          COUNT(g.id) as grades_count
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        WHERE a.class_id = $1 
          AND g.created_at >= CURRENT_DATE - INTERVAL '${period}'
        GROUP BY DATE(g.created_at)
        ORDER BY date ASC
      `,
        [classId]
      );

      return trends.rows;
    } catch (error) {
      analyticsLogger.error("Failed to get performance trends", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }

  async getAssignmentAnalytics(assignmentId, teacherId) {
    try {
      // Verify teacher access through assignment
      const assignment = await this.db.query(
        `
        SELECT a.*, c.teacher_id, c.name as class_name
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = $1
      `,
        [assignmentId]
      );

      if (
        assignment.rows.length === 0 ||
        assignment.rows[0].teacher_id !== teacherId
      ) {
        throw new Error("UNAUTHORIZED_ASSIGNMENT_ACCESS");
      }

      const stats = await this.db.query(
        `
        SELECT 
          COUNT(e.student_id) as total_students,
          COUNT(s.id) as submissions_count,
          COUNT(g.id) as graded_count,
          AVG(g.score) as average_score,
          AVG(g.percentage) as average_percentage,
          MIN(g.score) as min_score,
          MAX(g.score) as max_score
        FROM enrollments e
        LEFT JOIN submissions s ON e.student_id = s.student_id AND s.assignment_id = $1
        LEFT JOIN grades g ON s.id = g.submission_id
        WHERE e.class_id = $2 AND e.status = 'active'
      `,
        [assignmentId, assignment.rows[0].class_id]
      );

      const gradeDistribution = await this.db.query(
        `
        SELECT 
          grade_letter,
          COUNT(*) as count
        FROM grades g
        JOIN submissions s ON g.submission_id = s.id
        WHERE s.assignment_id = $1
        GROUP BY grade_letter
        ORDER BY grade_letter
      `,
        [assignmentId]
      );

      const submissionTimeline = await this.db.query(
        `
        SELECT 
          DATE(submitted_at) as submission_date,
          COUNT(*) as submissions_count
        FROM submissions
        WHERE assignment_id = $1 AND status IN ('submitted', 'graded')
        GROUP BY DATE(submitted_at)
        ORDER BY submission_date ASC
      `,
        [assignmentId]
      );

      return {
        assignment: assignment.rows[0],
        stats: stats.rows[0],
        gradeDistribution: gradeDistribution.rows,
        submissionTimeline: submissionTimeline.rows,
      };
    } catch (error) {
      analyticsLogger.error("Failed to get assignment analytics", {
        error: error.message,
        assignmentId,
        teacherId,
      });
      throw error;
    }
  }

  async getStudentProgressReport(
    studentId,
    classId = null,
    academicYear = null
  ) {
    try {
      let sql = `
        SELECT 
          c.name as class_name,
          c.code as class_code,
          AVG(g.percentage) as class_average,
          COUNT(g.id) as total_grades,
          MIN(g.percentage) as lowest_grade,
          MAX(g.percentage) as highest_grade,
          COUNT(CASE WHEN g.grade_letter IN ('A+', 'A', 'A-') THEN 1 END) as a_grades,
          COUNT(CASE WHEN g.grade_letter IN ('B+', 'B', 'B-') THEN 1 END) as b_grades,
          COUNT(CASE WHEN g.grade_letter IN ('C+', 'C', 'C-') THEN 1 END) as c_grades,
          COUNT(CASE WHEN g.grade_letter IN ('D+', 'D') THEN 1 END) as d_grades,
          COUNT(CASE WHEN g.grade_letter = 'F' THEN 1 END) as f_grades
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
        WHERE g.student_id = $1
      `;

      const params = [studentId];
      let paramCount = 1;

      if (classId) {
        paramCount++;
        sql += ` AND c.id = $${paramCount}`;
        params.push(classId);
      }

      if (academicYear) {
        paramCount++;
        sql += ` AND c.academic_year = $${paramCount}`;
        params.push(academicYear);
      }

      sql += " GROUP BY c.id, c.name, c.code ORDER BY c.name";

      const classProgress = await this.db.query(sql, params);

      const attendanceData = await this.db.query(
        `
        SELECT 
          c.name as class_name,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
          COUNT(*) as total_attendance_records
        FROM attendance a
        JOIN classes c ON a.class_id = c.id
        WHERE a.student_id = $1
        ${classId ? "AND c.id = $2" : ""}
        GROUP BY c.id, c.name
        ORDER BY c.name
      `,
        classId ? [studentId, classId] : [studentId]
      );

      return {
        classProgress: classProgress.rows,
        attendanceData: attendanceData.rows,
      };
    } catch (error) {
      analyticsLogger.error("Failed to get student progress report", {
        error: error.message,
        studentId,
      });
      throw error;
    }
  }

  async getSystemWideStatistics(startDate = null, endDate = null) {
    try {
      let dateFilter = "";
      const params = [];
      let paramCount = 0;

      if (startDate || endDate) {
        if (startDate) {
          paramCount++;
          dateFilter += ` AND created_at >= $${paramCount}`;
          params.push(startDate);
        }
        if (endDate) {
          paramCount++;
          dateFilter += ` AND created_at <= $${paramCount}`;
          params.push(endDate);
        }
      }

      const userStats = await this.db.query(
        `
        SELECT 
          role,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
        FROM users
        WHERE 1=1 ${dateFilter}
        GROUP BY role
      `,
        params
      );

      const enrollmentStats = await this.db.query(
        `
        SELECT 
          COUNT(*) as total_enrollments,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_enrollments,
          COUNT(DISTINCT student_id) as unique_students,
          COUNT(DISTINCT class_id) as unique_classes
        FROM enrollments
        WHERE 1=1 ${dateFilter}
      `,
        params
      );

      const gradeStats = await this.db.query(
        `
        SELECT 
          COUNT(*) as total_grades,
          AVG(percentage) as overall_average,
          COUNT(CASE WHEN grade_letter IN ('A+', 'A', 'A-') THEN 1 END) as a_grades,
          COUNT(CASE WHEN grade_letter IN ('B+', 'B', 'B-') THEN 1 END) as b_grades,
          COUNT(CASE WHEN grade_letter IN ('C+', 'C', 'C-') THEN 1 END) as c_grades,
          COUNT(CASE WHEN grade_letter IN ('D+', 'D', 'F') THEN 1 END) as failing_grades
        FROM grades
        WHERE 1=1 ${dateFilter}
      `,
        params
      );

      const attendanceStats = await this.db.query(
        `
        SELECT 
          COUNT(*) as total_attendance_records,
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
          ROUND((COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2) as overall_attendance_rate
        FROM attendance
        WHERE 1=1 ${dateFilter}
      `,
        params
      );

      return {
        userStats: userStats.rows,
        enrollmentStats: enrollmentStats.rows[0],
        gradeStats: gradeStats.rows[0],
        attendanceStats: attendanceStats.rows[0],
      };
    } catch (error) {
      analyticsLogger.error("Failed to get system-wide statistics", {
        error: error.message,
      });
      throw error;
    }
  }

  async exportAnalyticsData(type, filters = {}) {
    try {
      let data = {};

      switch (type) {
        case "class_performance":
          if (!filters.classId || !filters.teacherId) {
            throw new Error("CLASS_ID_AND_TEACHER_ID_REQUIRED");
          }
          data = await this.getClassAnalytics(
            filters.classId,
            filters.teacherId
          );
          break;

        case "student_progress":
          if (!filters.studentId) {
            throw new Error("STUDENT_ID_REQUIRED");
          }
          data = await this.getStudentProgressReport(
            filters.studentId,
            filters.classId,
            filters.academicYear
          );
          break;

        case "system_overview":
          data = await this.getSystemWideStatistics(
            filters.startDate,
            filters.endDate
          );
          break;

        default:
          throw new Error("INVALID_EXPORT_TYPE");
      }

      return {
        type,
        filters,
        data,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      analyticsLogger.error("Failed to export analytics data", {
        error: error.message,
        type,
        filters,
      });
      throw error;
    }
  }
}

// Factory function for dependency injection
export const createAnalyticsService = (req) => {
  const db = withRequestContext(req);
  return new AnalyticsService(db);
};
