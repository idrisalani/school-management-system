// server/src/controllers/dashboard.controller.js - TypeScript Errors Fixed
import { query } from "../config/database.js";
import logger from "../utils/logger.js";

// ========================= STUDENT DASHBOARD CONTROLLERS =========================

export const getStudentOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student's academic overview
    const overviewQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        COALESCE(AVG(g.score), 0) as current_gpa,
        COUNT(DISTINCT CASE WHEN a.attendance_status = 'present' THEN a.id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT a.id), 0) as attendance_rate,
        COUNT(DISTINCT CASE WHEN s.status = 'submitted' THEN s.id END) as completed_assignments,
        COUNT(DISTINCT CASE WHEN s.status = 'pending' OR s.status IS NULL THEN as.id END) as pending_assignments,
        COALESCE(e.total_credits, 0) as total_credits
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN grades g ON u.id = g.student_id AND g.created_at >= NOW() - INTERVAL '3 months'
      LEFT JOIN attendance a ON u.id = a.student_id AND a.date >= NOW() - INTERVAL '1 month'
      LEFT JOIN assignments as ON e.class_id = as.class_id
      LEFT JOIN submissions s ON as.id = s.assignment_id AND s.student_id = u.id
      WHERE u.id = $1 AND u.role = 'student'
      GROUP BY u.id, u.first_name, u.last_name, e.total_credits
    `;

    const result = await query(overviewQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Student not found",
      });
    }

    const overview = result.rows[0];

    res.json({
      status: "success",
      data: {
        currentGPA: parseFloat(overview.current_gpa || 0).toFixed(2),
        attendanceRate: parseFloat(overview.attendance_rate || 0).toFixed(1),
        completedAssignments: parseInt(overview.completed_assignments || 0),
        pendingAssignments: parseInt(overview.pending_assignments || 0),
        totalCredits: parseInt(overview.total_credits || 0),
        currentSemester: "Fall 2024",
      },
    });
  } catch (error) {
    logger.error("Student overview error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch student overview",
    });
  }
};

export const getUpcomingAssignments = async (req, res) => {
  try {
    const userId = req.user.id;

    const assignmentsQuery = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.assignment_type as type,
        c.name as subject,
        CASE 
          WHEN s.id IS NOT NULL THEN 'submitted'
          WHEN a.due_date < NOW() THEN 'overdue'
          ELSE 'pending'
        END as status,
        CASE 
          WHEN a.due_date <= NOW() + INTERVAL '2 days' THEN 'high'
          WHEN a.due_date <= NOW() + INTERVAL '1 week' THEN 'medium'
          ELSE 'low'
        END as priority
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN enrollments e ON c.id = e.class_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      WHERE e.student_id = $1 
        AND a.due_date >= NOW() - INTERVAL '1 day'
        AND (s.id IS NULL OR s.status != 'submitted')
      ORDER BY a.due_date ASC
      LIMIT 10
    `;

    const result = await query(assignmentsQuery, [userId]);

    res.json({
      status: "success",
      data: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        subject: row.subject,
        dueDate: row.due_date,
        type: row.type,
        status: row.status,
        priority: row.priority,
      })),
    });
  } catch (error) {
    logger.error("Upcoming assignments error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch upcoming assignments",
    });
  }
};

export const getRecentGrades = async (req, res) => {
  try {
    const userId = req.user.id;

    const gradesQuery = `
      SELECT 
        g.score,
        g.letter_grade as grade,
        g.created_at as date,
        c.name as subject,
        a.title as assignment_title
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      JOIN classes c ON a.class_id = c.id
      WHERE g.student_id = $1
      ORDER BY g.created_at DESC
      LIMIT 10
    `;

    const result = await query(gradesQuery, [userId]);

    res.json({
      status: "success",
      data: result.rows.map((row) => ({
        subject: row.subject,
        grade: row.grade,
        score: row.score,
        date: row.date,
        assignment: row.assignment_title,
      })),
    });
  } catch (error) {
    logger.error("Recent grades error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch recent grades",
    });
  }
};

export const getAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const attendanceQuery = `
      SELECT 
        COUNT(CASE WHEN attendance_status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN attendance_status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN attendance_status = 'late' THEN 1 END) as late,
        COUNT(*) as total
      FROM attendance
      WHERE student_id = $1 AND date >= NOW() - INTERVAL '30 days'
    `;

    const result = await query(attendanceQuery, [userId]);
    const attendance = result.rows[0];

    const totalCount = parseInt(attendance.total || 0);
    const presentCount = parseInt(attendance.present || 0);
    const percentage = totalCount > 0 ? ((presentCount * 100) / totalCount).toFixed(1) : "0.0";

    const percentageNum = parseFloat(percentage);

    res.json({
      status: "success",
      data: {
        present: presentCount,
        absent: parseInt(attendance.absent || 0),
        late: parseInt(attendance.late || 0),
        percentage: percentageNum,
        trend:
          percentageNum >= 95 ? "excellent" : percentageNum >= 85 ? "good" : "needs_improvement",
      },
    });
  } catch (error) {
    logger.error("Attendance summary error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch attendance summary",
    });
  }
};

export const getTodaySchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayString = today.toString(); // Convert to string for query parameter

    const scheduleQuery = `
      SELECT 
        cs.start_time as time,
        c.name as subject,
        cs.room,
        CONCAT(u.first_name, ' ', u.last_name) as teacher
      FROM class_schedule cs
      JOIN classes c ON cs.class_id = c.id
      JOIN enrollments e ON c.id = e.class_id
      JOIN users u ON cs.teacher_id = u.id
      WHERE e.student_id = $1 AND cs.day_of_week = $2
      ORDER BY cs.start_time
    `;

    const result = await query(scheduleQuery, [userId, todayString]);

    res.json({
      status: "success",
      data: result.rows.map((row) => ({
        time: row.time,
        subject: row.subject,
        room: row.room,
        teacher: row.teacher,
      })),
    });
  } catch (error) {
    logger.error("Today schedule error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch today's schedule",
    });
  }
};

// ========================= TEACHER DASHBOARD CONTROLLERS =========================

export const getTeacherOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    const overviewQuery = `
      SELECT 
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT c.id) as total_classes,
        COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) as pending_grading,
        COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.id END) as completed_assignments,
        COALESCE(AVG(g.score), 0) as average_class_performance,
        COUNT(DISTINCT CASE WHEN a.attendance_status = 'present' THEN a.id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT a.id), 0) as attendance_rate
      FROM classes c
      LEFT JOIN enrollments e ON c.id = e.class_id
      LEFT JOIN assignments assgn ON c.id = assgn.class_id
      LEFT JOIN submissions s ON assgn.id = s.assignment_id
      LEFT JOIN grades g ON assgn.id = g.assignment_id
      LEFT JOIN attendance a ON e.student_id = a.student_id AND a.date >= NOW() - INTERVAL '30 days'
      WHERE c.teacher_id = $1
    `;

    const result = await query(overviewQuery, [userId]);
    const overview = result.rows[0];

    res.json({
      status: "success",
      data: {
        totalStudents: parseInt(overview.total_students || 0),
        totalClasses: parseInt(overview.total_classes || 0),
        pendingGrading: parseInt(overview.pending_grading || 0),
        completedAssignments: parseInt(overview.completed_assignments || 0),
        averageClassPerformance: parseFloat(overview.average_class_performance || 0).toFixed(1),
        attendanceRate: parseFloat(overview.attendance_rate || 0).toFixed(1),
      },
    });
  } catch (error) {
    logger.error("Teacher overview error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch teacher overview",
    });
  }
};

export const getTeacherClasses = async (req, res) => {
  try {
    const userId = req.user.id;

    const classesQuery = `
      SELECT 
        c.id,
        c.name,
        c.subject,
        COUNT(DISTINCT e.student_id) as students,
        cs.start_time,
        cs.end_time,
        cs.day_of_week,
        cs.room,
        COALESCE(AVG(g.score), 0) as average_grade,
        COUNT(DISTINCT CASE WHEN a.attendance_status = 'present' THEN a.id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT a.id), 0) as attendance_rate
      FROM classes c
      LEFT JOIN enrollments e ON c.id = e.class_id
      LEFT JOIN class_schedule cs ON c.id = cs.class_id
      LEFT JOIN assignments assgn ON c.id = assgn.class_id
      LEFT JOIN grades g ON assgn.id = g.assignment_id AND g.created_at >= NOW() - INTERVAL '30 days'
      LEFT JOIN attendance a ON e.student_id = a.student_id AND a.date >= NOW() - INTERVAL '30 days'
      WHERE c.teacher_id = $1
      GROUP BY c.id, c.name, c.subject, cs.start_time, cs.end_time, cs.day_of_week, cs.room
      ORDER BY cs.day_of_week, cs.start_time
    `;

    const result = await query(classesQuery, [userId]);

    // Format schedule string
    const formatSchedule = (dayOfWeek, startTime, endTime) => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayIndex = parseInt(dayOfWeek || 0);
      const day = days[dayIndex] || "N/A";
      return `${day} - ${startTime || "N/A"}`;
    };

    res.json({
      status: "success",
      data: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        subject: row.subject,
        students: parseInt(row.students || 0),
        schedule: formatSchedule(row.day_of_week, row.start_time, row.end_time),
        room: row.room || "TBA",
        averageGrade: parseFloat(row.average_grade || 0).toFixed(1),
        attendanceRate: parseFloat(row.attendance_rate || 0).toFixed(0),
      })),
    });
  } catch (error) {
    logger.error("Teacher classes error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch teacher classes",
    });
  }
};

export const getTeacherAssignments = async (req, res) => {
  try {
    const userId = req.user.id;

    const assignmentsQuery = `
      SELECT 
        a.id,
        a.title,
        a.due_date,
        c.name as class_name,
        COUNT(DISTINCT s.id) as submissions,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.id END) as graded,
        CASE 
          WHEN a.due_date < NOW() THEN 'grading'
          ELSE 'active'
        END as status
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN enrollments e ON c.id = e.class_id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE c.teacher_id = $1 AND a.due_date >= NOW() - INTERVAL '30 days'
      GROUP BY a.id, a.title, a.due_date, c.name
      ORDER BY a.due_date ASC
    `;

    const result = await query(assignmentsQuery, [userId]);

    res.json({
      status: "success",
      data: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        class: row.class_name,
        dueDate: row.due_date,
        submissions: parseInt(row.submissions || 0),
        totalStudents: parseInt(row.total_students || 0),
        graded: parseInt(row.graded || 0),
        status: row.status,
      })),
    });
  } catch (error) {
    logger.error("Teacher assignments error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch teacher assignments",
    });
  }
};

// ========================= PARENT DASHBOARD CONTROLLERS =========================

export const getParentChildren = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const childrenQuery = `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.grade_level as grade,
        u.student_id,
        COALESCE(AVG(g.score), 0) as current_gpa,
        COUNT(DISTINCT CASE WHEN a.attendance_status = 'present' THEN a.id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT a.id), 0) as attendance_rate,
        CONCAT(t.first_name, ' ', t.last_name) as teacher
      FROM users u
      LEFT JOIN grades g ON u.id = g.student_id AND g.created_at >= NOW() - INTERVAL '3 months'
      LEFT JOIN attendance a ON u.id = a.student_id AND a.date >= NOW() - INTERVAL '30 days'
      LEFT JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN users t ON c.teacher_id = t.id
      WHERE u.parent_email = $1 AND u.role = 'student'
      GROUP BY u.id, u.first_name, u.last_name, u.grade_level, u.student_id, t.first_name, t.last_name
    `;

    const result = await query(childrenQuery, [userEmail]);

    res.json({
      status: "success",
      data: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        grade: row.grade || "N/A",
        class: "A", // You might want to add class section to database
        studentId: row.student_id,
        currentGPA: parseFloat(row.current_gpa || 0).toFixed(1),
        attendanceRate: parseFloat(row.attendance_rate || 0).toFixed(0),
        teacher: row.teacher || "Not Assigned",
      })),
    });
  } catch (error) {
    logger.error("Parent children error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch children information",
    });
  }
};

export const getParentOverview = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const overviewQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_children,
        COALESCE(AVG(g.score), 0) as average_gpa,
        COUNT(DISTINCT CASE WHEN a.attendance_status = 'present' THEN a.id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT a.id), 0) as total_attendance_rate,
        COUNT(DISTINCT CASE WHEN s.status IS NULL OR s.status = 'pending' THEN assgn.id END) as pending_assignments,
        COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as outstanding_fees
      FROM users u
      LEFT JOIN grades g ON u.id = g.student_id AND g.created_at >= NOW() - INTERVAL '3 months'
      LEFT JOIN attendance a ON u.id = a.student_id AND a.date >= NOW() - INTERVAL '30 days'
      LEFT JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN assignments assgn ON e.class_id = assgn.class_id
      LEFT JOIN submissions s ON assgn.id = s.assignment_id AND s.student_id = u.id
      LEFT JOIN payments p ON u.id = p.student_id
      WHERE u.parent_email = $1 AND u.role = 'student'
    `;

    const result = await query(overviewQuery, [userEmail]);
    const overview = result.rows[0];

    res.json({
      status: "success",
      data: {
        totalChildren: parseInt(overview.total_children || 0),
        averageGPA: parseFloat(overview.average_gpa || 0).toFixed(1),
        totalAttendanceRate: parseFloat(overview.total_attendance_rate || 0).toFixed(1),
        pendingAssignments: parseInt(overview.pending_assignments || 0),
        upcomingEvents: 3, // This would come from events table
        unreadMessages: 2, // This would come from messages table
        outstandingFees: parseInt(overview.outstanding_fees || 0),
      },
    });
  } catch (error) {
    logger.error("Parent overview error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch parent overview",
    });
  }
};

// ========================= ADMIN DASHBOARD CONTROLLERS =========================

export const getSystemHealth = async (req, res) => {
  try {
    // Get current system metrics
    const healthQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '1 hour') as active_users,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as total_active_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours') as new_users_today
    `;

    const result = await query(healthQuery);
    const metrics = result.rows[0];

    // Simulate system metrics (in production, these would come from monitoring tools)
    const systemHealth = {
      status: "healthy",
      uptime: "99.9%",
      responseTime: "245ms",
      activeUsers: parseInt(metrics.active_users || 0),
      serverLoad: Math.floor(Math.random() * 30) + 40, // 40-70%
      memoryUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
      diskUsage: Math.floor(Math.random() * 15) + 20, // 20-35%
      databaseStatus: "connected",
      emailService: "operational",
      backupStatus: "completed",
      lastBackup: new Date().toISOString(),
    };

    res.json({
      status: "success",
      data: systemHealth,
    });
  } catch (error) {
    logger.error("System health error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch system health",
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userStatsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login >= NOW() - INTERVAL '24 hours' THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_registrations,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as students_count,
        COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teachers_count,
        COUNT(CASE WHEN role = 'parent' THEN 1 END) as parents_count,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins_count,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN is_verified = false THEN 1 END) as pending_verification,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users
      FROM users
      WHERE status != 'deleted'
    `;

    const result = await query(userStatsQuery);
    const stats = result.rows[0];

    res.json({
      status: "success",
      data: {
        totalUsers: parseInt(stats.total_users || 0),
        activeUsers: parseInt(stats.active_users || 0),
        newRegistrations: parseInt(stats.new_registrations || 0),
        studentsCount: parseInt(stats.students_count || 0),
        teachersCount: parseInt(stats.teachers_count || 0),
        parentsCount: parseInt(stats.parents_count || 0),
        adminsCount: parseInt(stats.admins_count || 0),
        verifiedUsers: parseInt(stats.verified_users || 0),
        pendingVerification: parseInt(stats.pending_verification || 0),
        suspendedUsers: parseInt(stats.suspended_users || 0),
      },
    });
  } catch (error) {
    logger.error("User stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user statistics",
    });
  }
};

export const getFinancialStats = async (req, res) => {
  try {
    const financialQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= DATE_TRUNC('month', NOW()) THEN amount END), 0) as monthly_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) as pending_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as completion_rate,
        COALESCE(SUM(CASE WHEN status = 'pending' OR status = 'overdue' THEN amount END), 0) as outstanding_fees
      FROM payments
      WHERE created_at >= NOW() - INTERVAL '1 year'
    `;

    const result = await query(financialQuery);
    const stats = result.rows[0];

    const monthlyRevenue = parseFloat(stats.monthly_revenue || 0);
    const expenses = 8970000; // This would come from expenses table

    res.json({
      status: "success",
      data: {
        totalRevenue: parseFloat(stats.total_revenue || 0),
        monthlyRevenue: monthlyRevenue,
        pendingPayments: parseFloat(stats.pending_payments || 0),
        completedPayments: parseFloat(stats.completion_rate || 0).toFixed(1),
        outstandingFees: parseFloat(stats.outstanding_fees || 0),
        scholarships: 12350000, // This would come from scholarships table
        expenses: expenses,
        profit: monthlyRevenue - expenses,
      },
    });
  } catch (error) {
    logger.error("Financial stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch financial statistics",
    });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const activitiesQuery = `
      SELECT 
        ua.id,
        ua.activity_type as type,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        ua.description as action,
        ua.created_at as timestamp,
        'success' as status,
        ua.metadata
      FROM user_activities ua
      JOIN users u ON ua.user_id = u.id
      ORDER BY ua.created_at DESC
      LIMIT 20
    `;

    const result = await query(activitiesQuery);

    res.json({
      status: "success",
      data: result.rows.map((row) => ({
        id: row.id,
        type: row.type,
        user: row.user_name,
        action: row.action,
        timestamp: row.timestamp,
        status: row.status,
        amount: row.metadata?.amount || null,
      })),
    });
  } catch (error) {
    logger.error("Recent activities error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch recent activities",
    });
  }
};

export const getSystemAlerts = async (req, res) => {
  try {
    const alertsQuery = `
      SELECT 
        id,
        alert_type as type,
        title,
        message,
        acknowledged,
        created_at as timestamp
      FROM system_alerts
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const result = await query(alertsQuery);

    res.json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    logger.error("System alerts error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch system alerts",
    });
  }
};

// ========================= SHARED UTILITIES =========================

export const getRecentAnnouncements = async (req, res) => {
  try {
    const userRole = req.user.role;

    const announcementsQuery = `
      SELECT 
        id,
        title,
        content,
        priority,
        created_at as date
      FROM announcements
      WHERE (target_role = $1 OR target_role = 'all')
        AND created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const result = await query(announcementsQuery, [userRole]);

    res.json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    logger.error("Recent announcements error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch announcements",
    });
  }
};
