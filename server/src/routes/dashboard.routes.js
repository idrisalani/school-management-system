// @ts-nocheck

// server/src/routes/dashboard.routes.js
import express from "express";
import pkg from "pg";
import { authenticate } from "../middleware/auth.middleware.js";

const { Pool } = pkg;
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Create middleware instance
const authMiddleware = authenticate();

// Admin Dashboard Data
router.get("/admin", authMiddleware(), async (req, res) => {
  try {
    // Get total active students count
    const studentCountResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'student' AND status = 'active'"
    );
    const studentCount = studentCountResult.rows[0].count;

    // Get total active teachers count
    const teacherCountResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status = 'active'"
    );
    const teacherCount = teacherCountResult.rows[0].count;

    // Get average attendance (last 30 days)
    const attendanceResult = await pool.query(`
      SELECT status FROM attendance 
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    const presentCount = attendanceResult.rows.filter((a) => a.status === "present").length;
    const totalAttendance = attendanceResult.rows.length || 1;
    const averageAttendance = ((presentCount / totalAttendance) * 100).toFixed(1);

    // Get total revenue from paid payments
    const revenueResult = await pool.query(
      "SELECT SUM(amount) as total FROM payments WHERE status = 'paid'"
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total || 0);

    res.json({
      studentCount: studentCount.toString(),
      teacherCount: teacherCount.toString(),
      averageAttendance: `${averageAttendance}%`,
      revenue: `$${totalRevenue.toLocaleString()}`,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Error fetching admin dashboard data" });
  }
});

// Teacher Dashboard Data
router.get("/teacher/:teacherId", authMiddleware(), async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Get classes taught by this teacher
    const classesResult = await pool.query(
      "SELECT id FROM classes WHERE teacher_id = $1 AND status = 'active'",
      [teacherId]
    );
    const classIds = classesResult.rows.map((c) => c.id);

    if (classIds.length === 0) {
      return res.json({
        studentCount: 0,
        averageGrade: "N/A",
        attendanceRate: "0%",
        pendingAssignments: 0,
      });
    }

    // Get total students in teacher's classes
    const studentCountResult = await pool.query(
      "SELECT COUNT(*) FROM enrollments WHERE class_id = ANY($1) AND status = 'active'",
      [classIds]
    );
    const studentCount = studentCountResult.rows[0].count;

    // Get average grade for teacher's classes
    const gradesResult = await pool.query(
      "SELECT percentage FROM grades WHERE class_id = ANY($1)",
      [classIds]
    );

    let averageGrade = "N/A";
    if (gradesResult.rows.length > 0) {
      const totalPercentage = gradesResult.rows.reduce(
        (sum, grade) => sum + parseFloat(grade.percentage || 0),
        0
      );
      const avgPercentage = totalPercentage / gradesResult.rows.length;
      averageGrade =
        avgPercentage >= 97
          ? "A+"
          : avgPercentage >= 93
            ? "A"
            : avgPercentage >= 90
              ? "A-"
              : avgPercentage >= 87
                ? "B+"
                : avgPercentage >= 83
                  ? "B"
                  : "B-";
    }

    // Get attendance rate for teacher's classes (last 30 days)
    const attendanceResult = await pool.query(
      `
      SELECT status FROM attendance 
      WHERE class_id = ANY($1) AND date >= CURRENT_DATE - INTERVAL '30 days'
    `,
      [classIds]
    );

    const presentCount = attendanceResult.rows.filter((a) => a.status === "present").length;
    const totalAttendance = attendanceResult.rows.length || 1;
    const attendanceRate = Math.round((presentCount / totalAttendance) * 100);

    // Get pending assignments count
    const pendingResult = await pool.query(
      `
      SELECT COUNT(*) FROM assignments 
      WHERE class_id = ANY($1) AND status = 'active' AND due_date >= CURRENT_DATE
    `,
      [classIds]
    );
    const pendingAssignments = pendingResult.rows[0].count;

    res.json({
      studentCount: parseInt(studentCount),
      averageGrade,
      attendanceRate: `${attendanceRate}%`,
      pendingAssignments: parseInt(pendingAssignments),
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    res.status(500).json({ message: "Error fetching teacher dashboard data" });
  }
});

// Student Dashboard Data
router.get("/student/:studentId", authMiddleware(), async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student's enrollments
    const enrollmentsResult = await pool.query(
      "SELECT class_id FROM enrollments WHERE student_id = $1 AND status = 'active'",
      [studentId]
    );
    const classIds = enrollmentsResult.rows.map((e) => e.class_id);

    if (classIds.length === 0) {
      return res.json({
        attendance: "0%",
        averageGrade: "N/A",
        assignments: "0/0",
        activities: 0,
      });
    }

    // Get student's attendance (last 30 days)
    const attendanceResult = await pool.query(
      `
      SELECT status FROM attendance 
      WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
    `,
      [studentId]
    );

    const presentCount = attendanceResult.rows.filter((a) => a.status === "present").length;
    const totalDays = attendanceResult.rows.length || 1;
    const attendancePercentage = Math.round((presentCount / totalDays) * 100);

    // Get student's grades
    const gradesResult = await pool.query("SELECT percentage FROM grades WHERE student_id = $1", [
      studentId,
    ]);

    let averageGrade = "N/A";
    if (gradesResult.rows.length > 0) {
      const totalPercentage = gradesResult.rows.reduce(
        (sum, grade) => sum + parseFloat(grade.percentage || 0),
        0
      );
      const avgPercentage = totalPercentage / gradesResult.rows.length;
      averageGrade =
        avgPercentage >= 97 ? "A+" : avgPercentage >= 93 ? "A" : avgPercentage >= 90 ? "A-" : "B+";
    }

    // Get assignments count
    const assignmentsResult = await pool.query(
      "SELECT COUNT(*) FROM assignments WHERE class_id = ANY($1) AND status = 'active'",
      [classIds]
    );

    const submissionsResult = await pool.query(
      `
      SELECT COUNT(*) FROM submissions 
      WHERE student_id = $1 AND status IN ('submitted', 'graded')
    `,
      [studentId]
    );

    const totalAssignments = parseInt(assignmentsResult.rows[0].count);
    const completedAssignments = parseInt(submissionsResult.rows[0].count);

    // Count recent announcements as activities
    const activitiesResult = await pool.query(`
      SELECT COUNT(*) FROM announcements 
      WHERE target_audience IN ('all', 'students') 
      AND is_published = true 
      AND published_at >= CURRENT_DATE - INTERVAL '30 days'
    `);
    const activitiesCount = parseInt(activitiesResult.rows[0].count);

    res.json({
      attendance: `${attendancePercentage}%`,
      averageGrade,
      assignments: `${completedAssignments}/${totalAssignments}`,
      activities: activitiesCount,
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    res.status(500).json({ message: "Error fetching student dashboard data" });
  }
});

// Parent Dashboard Data
router.get("/parent/:parentId", authMiddleware(), async (req, res) => {
  try {
    const { parentId } = req.params;

    // Get parent's children (assuming you have a parent_student_relationships table)
    const childrenResult = await pool.query(
      `
      SELECT u.id, u.first_name, u.last_name, u.status
      FROM parent_student_relationships psr
      JOIN users u ON psr.student_id = u.id
      WHERE psr.parent_id = $1
    `,
      [parentId]
    );

    const children = childrenResult.rows;
    const childrenIds = children.map((c) => c.id);

    if (childrenIds.length === 0) {
      return res.json({
        childrenCount: 0,
        upcomingEvents: 0,
        averageGrade: "N/A",
        attendanceRate: "0%",
        children: [],
      });
    }

    // Get children's grades
    const gradesResult = await pool.query(
      "SELECT percentage FROM grades WHERE student_id = ANY($1)",
      [childrenIds]
    );

    let averageGrade = "N/A";
    if (gradesResult.rows.length > 0) {
      const totalPercentage = gradesResult.rows.reduce(
        (sum, grade) => sum + parseFloat(grade.percentage || 0),
        0
      );
      const avgPercentage = totalPercentage / gradesResult.rows.length;
      averageGrade =
        avgPercentage >= 97 ? "A+" : avgPercentage >= 93 ? "A" : avgPercentage >= 90 ? "A-" : "B+";
    }

    // Get attendance rate (last 30 days)
    const attendanceResult = await pool.query(
      `
      SELECT status FROM attendance 
      WHERE student_id = ANY($1) AND date >= CURRENT_DATE - INTERVAL '30 days'
    `,
      [childrenIds]
    );

    const presentCount = attendanceResult.rows.filter((a) => a.status === "present").length;
    const totalDays = attendanceResult.rows.length || 1;
    const attendanceRate = Math.round((presentCount / totalDays) * 100);

    // Count upcoming announcements as events
    const eventsResult = await pool.query(`
      SELECT COUNT(*) FROM announcements 
      WHERE target_audience IN ('all', 'parents') 
      AND is_published = true 
      AND published_at >= CURRENT_DATE
    `);
    const upcomingEvents = parseInt(eventsResult.rows[0].count);

    res.json({
      childrenCount: children.length,
      upcomingEvents,
      averageGrade,
      attendanceRate: `${attendanceRate}%`,
      children: children.map((child) => ({
        id: child.id,
        name: `${child.first_name || ""} ${child.last_name || ""}`.trim() || "Unknown",
        status: child.status,
      })),
    });
  } catch (error) {
    console.error("Parent dashboard error:", error);
    res.status(500).json({ message: "Error fetching parent dashboard data" });
  }
});

export default router;
