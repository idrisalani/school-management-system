// @ts-nocheck

// server/src/routes/course.routes.js - Course/Class Management Routes (TypeScript Fixed)
import express from "express";
import {
  authenticate,
  authorize,
  requireAdmin,
  requireClassTeacher,
  requireClassEnrollment,
} from "../middleware/auth.middleware.js";
import { withRequestContext } from "../config/database.js";
import logger from "../utils/logger.js";

const router = express.Router();
const courseLogger = logger.child({ module: "course-routes" });

// Helper function to safely convert query parameters to string
const safeString = (value, defaultValue = "") => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] || defaultValue;
  if (value === null || value === undefined) return defaultValue;
  return String(value);
};

// Helper function to safely convert query parameters to number
const safeNumber = (value, defaultValue = 0) => {
  const str = safeString(value);
  const num = parseInt(str, 10);
  return isNaN(num) ? defaultValue : num;
};

// ========================= COURSE/CLASS MANAGEMENT ROUTES =========================

// GET /api/v1/courses - Get all courses/classes
router.get("/", async (req, res) => {
  try {
    const db = withRequestContext(req);

    // FIXED: Properly handle query parameter types
    const page = safeNumber(req.query.page, 1);
    const limit = safeNumber(req.query.limit, 20);
    const department_id = safeString(req.query.department_id);
    const teacher_id = safeString(req.query.teacher_id);
    const semester = safeString(req.query.semester);
    const status = safeString(req.query.status, "active");

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        c.id,
        c.name,
        c.code,
        c.description,
        c.credits,
        c.semester,
        c.academic_year,
        c.status,
        c.max_students,
        c.schedule,
        c.created_at,
        c.updated_at,
        d.name as department_name,
        CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
        u.email as teacher_email,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') as enrolled_count
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
    }

    if (department_id) {
      paramCount++;
      query += ` AND c.department_id = $${paramCount}`;
      params.push(department_id);
    }

    if (teacher_id) {
      paramCount++;
      query += ` AND c.teacher_id = $${paramCount}`;
      params.push(teacher_id);
    }

    if (semester) {
      paramCount++;
      query += ` AND c.semester = $${paramCount}`;
      params.push(semester);
    }

    // Role-based filtering
    if (req.user.role === "teacher") {
      paramCount++;
      query += ` AND (c.teacher_id = $${paramCount} OR c.department_id = $${
        paramCount + 1
      })`;
      params.push(req.user.id, req.user.departmentId);
      paramCount++;
    } else if (req.user.role === "student") {
      paramCount++;
      query += ` AND c.id IN (SELECT class_id FROM enrollments WHERE student_id = $${paramCount} AND status = 'active')`;
      params.push(req.user.id);
    }

    query += ` ORDER BY c.name ASC LIMIT $${paramCount + 1} OFFSET $${
      paramCount + 2
    }`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM classes c
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND c.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (department_id) {
      countParamCount++;
      countQuery += ` AND c.department_id = $${countParamCount}`;
      countParams.push(department_id);
    }

    if (teacher_id) {
      countParamCount++;
      countQuery += ` AND c.teacher_id = $${countParamCount}`;
      countParams.push(teacher_id);
    }

    if (req.user.role === "teacher") {
      countParamCount++;
      countQuery += ` AND (c.teacher_id = $${countParamCount} OR c.department_id = $${
        countParamCount + 1
      })`;
      countParams.push(req.user.id, req.user.departmentId);
      countParamCount++;
    } else if (req.user.role === "student") {
      countParamCount++;
      countQuery += ` AND c.id IN (SELECT class_id FROM enrollments WHERE student_id = $${countParamCount} AND status = 'active')`;
      countParams.push(req.user.id);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCourses = parseInt(countResult.rows[0].total);

    courseLogger.info("Courses retrieved", {
      userId: req.user.id,
      count: result.rows.length,
      total: totalCourses,
      filters: { department_id, teacher_id, semester, status },
    });

    res.json({
      status: "success",
      data: {
        courses: result.rows,
        pagination: {
          page: page,
          limit: limit,
          total: totalCourses,
          pages: Math.ceil(totalCourses / limit),
        },
      },
    });
  } catch (error) {
    courseLogger.error("Get courses error", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch courses",
    });
  }
});

// GET /api/v1/courses/:id - Get single course details
// FIXED: Remove function call from middleware, use direct middleware
router.get(
  "/:id",
  authenticate(),
  authorize(["admin", "teacher", "student"]),
  async (req, res) => {
    try {
      const db = withRequestContext(req);
      const { id } = req.params;

      const result = await db.query(
        `
      SELECT 
        c.*,
        d.name as department_name,
        d.code as department_code,
        CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
        u.email as teacher_email,
        u.phone as teacher_phone,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') as enrolled_count,
        (SELECT COUNT(*) FROM assignments a WHERE a.class_id = c.id AND a.status = 'active') as assignments_count
      FROM classes c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = $1
    `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Course not found",
        });
      }

      const course = result.rows[0];

      // Check if user has access to this course
      if (req.user.role === "student") {
        const enrollmentCheck = await db.query(
          "SELECT id FROM enrollments WHERE class_id = $1 AND student_id = $2 AND status = 'active'",
          [id, req.user.id]
        );

        if (enrollmentCheck.rows.length === 0) {
          return res.status(403).json({
            status: "error",
            message: "Not enrolled in this course",
          });
        }
      } else if (req.user.role === "teacher") {
        if (
          course.teacher_id !== req.user.id &&
          req.user.departmentId !== course.department_id
        ) {
          return res.status(403).json({
            status: "error",
            message: "Not authorized to access this course",
          });
        }
      }

      // Get enrolled students (if user has permission)
      if (req.user.role === "teacher" || req.user.role === "admin") {
        const studentsResult = await db.query(
          `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.student_id,
          e.enrolled_at,
          e.status as enrollment_status
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.class_id = $1 AND e.status = 'active'
        ORDER BY u.last_name, u.first_name
      `,
          [id]
        );

        course.students = studentsResult.rows;
      }

      // Get recent assignments
      const assignmentsResult = await db.query(
        `
      SELECT 
        id,
        title,
        description,
        due_date,
        max_points,
        assignment_type,
        status,
        created_at
      FROM assignments
      WHERE class_id = $1 AND status = 'active'
      ORDER BY due_date DESC
      LIMIT 5
    `,
        [id]
      );

      course.recent_assignments = assignmentsResult.rows;

      courseLogger.info("Course details retrieved", {
        courseId: id,
        userId: req.user.id,
        userRole: req.user.role,
      });

      res.json({
        status: "success",
        data: { course },
      });
    } catch (error) {
      courseLogger.error("Get course details error", error);
      res.status(500).json({
        status: "error",
        message: "Failed to fetch course details",
      });
    }
  }
);

// POST /api/v1/courses - Create new course (Admin/Teacher only)
router.post(
  "/",
  authenticate(),
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const db = withRequestContext(req);
      const {
        name,
        code,
        description,
        credits,
        department_id,
        teacher_id,
        semester,
        academic_year,
        max_students,
        schedule,
      } = req.body;

      // Validation
      if (!name || !code || !department_id) {
        return res.status(400).json({
          status: "error",
          message: "Name, code, and department are required",
        });
      }

      // Check if course code already exists
      const existingCourse = await db.query(
        "SELECT id FROM classes WHERE code = $1",
        [code]
      );

      if (existingCourse.rows.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Course code already exists",
        });
      }

      // For teachers, assign themselves if no teacher_id provided
      const finalTeacherId =
        req.user.role === "teacher" && !teacher_id ? req.user.id : teacher_id;

      const result = await db.query(
        `
      INSERT INTO classes (
        name, code, description, credits, department_id, teacher_id,
        semester, academic_year, max_students, schedule, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
      RETURNING *
    `,
        [
          name,
          code,
          description,
          credits || 3,
          department_id,
          finalTeacherId,
          semester,
          academic_year,
          max_students || 30,
          JSON.stringify(schedule),
        ]
      );

      const newCourse = result.rows[0];

      courseLogger.info("Course created", {
        courseId: newCourse.id,
        courseName: name,
        courseCode: code,
        createdBy: req.user.id,
      });

      res.status(201).json({
        status: "success",
        message: "Course created successfully",
        data: { course: newCourse },
      });
    } catch (error) {
      courseLogger.error("Create course error", error);
      res.status(500).json({
        status: "error",
        message: "Failed to create course",
      });
    }
  }
);

// PUT /api/v1/courses/:id - Update course
router.put(
  "/:id",
  authenticate(),
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const db = withRequestContext(req);
      const { id } = req.params;
      const { name, description, credits, max_students, schedule, status } =
        req.body;

      // Check if user has permission to update this course
      if (req.user.role === "teacher") {
        const courseCheck = await db.query(
          "SELECT teacher_id, department_id FROM classes WHERE id = $1",
          [id]
        );

        if (courseCheck.rows.length === 0) {
          return res.status(404).json({
            status: "error",
            message: "Course not found",
          });
        }

        const course = courseCheck.rows[0];
        if (
          course.teacher_id !== req.user.id &&
          req.user.departmentId !== course.department_id
        ) {
          return res.status(403).json({
            status: "error",
            message: "Not authorized to update this course",
          });
        }
      }

      const result = await db.query(
        `
      UPDATE classes SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        credits = COALESCE($3, credits),
        max_students = COALESCE($4, max_students),
        schedule = COALESCE($5, schedule),
        status = COALESCE($6, status),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `,
        [
          name,
          description,
          credits,
          max_students,
          JSON.stringify(schedule),
          status,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Course not found",
        });
      }

      courseLogger.info("Course updated", {
        courseId: id,
        updatedBy: req.user.id,
        changes: { name, description, credits, max_students, status },
      });

      res.json({
        status: "success",
        message: "Course updated successfully",
        data: { course: result.rows[0] },
      });
    } catch (error) {
      courseLogger.error("Update course error", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update course",
      });
    }
  }
);

// DELETE /api/v1/courses/:id - Delete course (Admin only)
router.delete("/:id", authenticate(), requireAdmin, async (req, res) => {
  try {
    const db = withRequestContext(req);
    const { id } = req.params;

    // Check if course has enrollments
    const enrollmentCheck = await db.query(
      "SELECT COUNT(*) as count FROM enrollments WHERE class_id = $1 AND status = 'active'",
      [id]
    );

    if (parseInt(enrollmentCheck.rows[0].count) > 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete course with active enrollments",
      });
    }

    // Soft delete by updating status
    const result = await db.query(
      `
      UPDATE classes SET 
        status = 'deleted',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Course not found",
      });
    }

    courseLogger.info("Course deleted", {
      courseId: id,
      deletedBy: req.user.id,
    });

    res.json({
      status: "success",
      message: "Course deleted successfully",
    });
  } catch (error) {
    courseLogger.error("Delete course error", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete course",
    });
  }
});

// POST /api/v1/courses/:id/enroll - Enroll student in course
router.post(
  "/:id/enroll",
  authenticate(),
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const db = withRequestContext(req);
      const { id } = req.params;
      const { student_id } = req.body;

      if (!student_id) {
        return res.status(400).json({
          status: "error",
          message: "Student ID is required",
        });
      }

      // Check if user has permission to enroll students in this course
      if (req.user.role === "teacher") {
        const courseCheck = await db.query(
          "SELECT teacher_id, department_id FROM classes WHERE id = $1",
          [id]
        );

        if (courseCheck.rows.length === 0) {
          return res.status(404).json({
            status: "error",
            message: "Course not found",
          });
        }

        const course = courseCheck.rows[0];
        if (
          course.teacher_id !== req.user.id &&
          req.user.departmentId !== course.department_id
        ) {
          return res.status(403).json({
            status: "error",
            message: "Not authorized to enroll students in this course",
          });
        }
      }

      // Check if student exists
      const studentCheck = await db.query(
        "SELECT id, first_name, last_name FROM users WHERE id = $1 AND role = 'student' AND status = 'active'",
        [student_id]
      );

      if (studentCheck.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Student not found",
        });
      }

      // Check if already enrolled
      const existingEnrollment = await db.query(
        "SELECT id FROM enrollments WHERE class_id = $1 AND student_id = $2",
        [id, student_id]
      );

      if (existingEnrollment.rows.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Student already enrolled in this course",
        });
      }

      // Check course capacity
      const capacityCheck = await db.query(
        `
      SELECT 
        c.max_students,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') as current_enrolled
      FROM classes c
      WHERE c.id = $1
    `,
        [id]
      );

      if (capacityCheck.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Course not found",
        });
      }

      const { max_students, current_enrolled } = capacityCheck.rows[0];
      if (parseInt(current_enrolled) >= parseInt(max_students)) {
        return res.status(400).json({
          status: "error",
          message: "Course is at maximum capacity",
        });
      }

      // Enroll student
      const result = await db.query(
        `
      INSERT INTO enrollments (class_id, student_id, status, enrolled_at)
      VALUES ($1, $2, 'active', NOW())
      RETURNING *
    `,
        [id, student_id]
      );

      const student = studentCheck.rows[0];

      courseLogger.info("Student enrolled", {
        courseId: id,
        studentId: student_id,
        studentName: `${student.first_name} ${student.last_name}`,
        enrolledBy: req.user.id,
      });

      res.status(201).json({
        status: "success",
        message: "Student enrolled successfully",
        data: {
          enrollment: result.rows[0],
          student: student,
        },
      });
    } catch (error) {
      courseLogger.error("Enroll student error", error);
      res.status(500).json({
        status: "error",
        message: "Failed to enroll student",
      });
    }
  }
);

// DELETE /api/v1/courses/:id/enroll/:studentId - Remove student from course
router.delete(
  "/:id/enroll/:studentId",
  authenticate(),
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const db = withRequestContext(req);
      const { id, studentId } = req.params;

      // Check if user has permission to withdraw students from this course
      if (req.user.role === "teacher") {
        const courseCheck = await db.query(
          "SELECT teacher_id, department_id FROM classes WHERE id = $1",
          [id]
        );

        if (courseCheck.rows.length === 0) {
          return res.status(404).json({
            status: "error",
            message: "Course not found",
          });
        }

        const course = courseCheck.rows[0];
        if (
          course.teacher_id !== req.user.id &&
          req.user.departmentId !== course.department_id
        ) {
          return res.status(403).json({
            status: "error",
            message: "Not authorized to withdraw students from this course",
          });
        }
      }

      const result = await db.query(
        `
      UPDATE enrollments SET 
        status = 'withdrawn',
        updated_at = NOW()
      WHERE class_id = $1 AND student_id = $2 AND status = 'active'
      RETURNING *
    `,
        [id, studentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Enrollment not found",
        });
      }

      courseLogger.info("Student withdrawn", {
        courseId: id,
        studentId: studentId,
        withdrawnBy: req.user.id,
      });

      res.json({
        status: "success",
        message: "Student withdrawn from course successfully",
      });
    } catch (error) {
      courseLogger.error("Withdraw student error", error);
      res.status(500).json({
        status: "error",
        message: "Failed to withdraw student",
      });
    }
  }
);

// GET /api/v1/courses/:id/students - Get course students
router.get(
  "/:id/students",
  authenticate(),
  authorize(["admin", "teacher", "student"]),
  async (req, res) => {
    try {
      const db = withRequestContext(req);
      const { id } = req.params;

      // Check if user has permission to view students in this course
      if (req.user.role === "student") {
        const enrollmentCheck = await db.query(
          "SELECT id FROM enrollments WHERE class_id = $1 AND student_id = $2 AND status = 'active'",
          [id, req.user.id]
        );

        if (enrollmentCheck.rows.length === 0) {
          return res.status(403).json({
            status: "error",
            message: "Not enrolled in this course",
          });
        }
      } else if (req.user.role === "teacher") {
        const courseCheck = await db.query(
          "SELECT teacher_id, department_id FROM classes WHERE id = $1",
          [id]
        );

        if (courseCheck.rows.length === 0) {
          return res.status(404).json({
            status: "error",
            message: "Course not found",
          });
        }

        const course = courseCheck.rows[0];
        if (
          course.teacher_id !== req.user.id &&
          req.user.departmentId !== course.department_id
        ) {
          return res.status(403).json({
            status: "error",
            message: "Not authorized to view students in this course",
          });
        }
      }

      const result = await db.query(
        `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.student_id,
        u.phone,
        e.enrolled_at,
        e.status as enrollment_status,
        COALESCE(AVG(g.percentage), 0) as current_grade
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      LEFT JOIN grades g ON g.student_id = u.id AND g.class_id = $1
      WHERE e.class_id = $1 AND e.status = 'active'
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.student_id, u.phone, e.enrolled_at, e.status
      ORDER BY u.last_name, u.first_name
    `,
        [id]
      );

      courseLogger.info("Course students retrieved", {
        courseId: id,
        studentCount: result.rows.length,
        requestedBy: req.user.id,
      });

      res.json({
        status: "success",
        data: {
          students: result.rows,
          count: result.rows.length,
        },
      });
    } catch (error) {
      courseLogger.error("Get course students error", error);
      res.status(500).json({
        status: "error",
        message: "Failed to fetch course students",
      });
    }
  }
);

export default router;
