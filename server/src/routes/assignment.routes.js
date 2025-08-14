// server/src/routes/assignment.routes.js
import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { query } from "../config/database.js";
import { ApiError } from "../utils/errors.js";
import { createAuditLog } from "../services/audit.service.js";

const router = express.Router();

/**
 * @typedef {Object} Assignment
 * @property {number} id - Assignment ID
 * @property {string} title - Assignment title
 * @property {string} description - Assignment description
 * @property {Date} due_date - Due date
 * @property {number} teacher_id - Teacher who created the assignment
 * @property {number} class_id - Class this assignment belongs to
 * @property {number} max_points - Maximum points for the assignment
 */

/**
 * @typedef {Object} AuthenticatedUser
 * @property {number} id - User ID
 * @property {string} name - User name
 * @property {string} email - User email
 * @property {string} role - User role
 */

/**
 * Helper function to check if user can access assignment
 */
async function canUserAccessAssignment(userId, userRole, assignmentId) {
  if (userRole === "admin") return true;

  if (userRole === "teacher") {
    const teacherCheck = await query(
      "SELECT id FROM assignments WHERE id = $1 AND teacher_id = $2",
      [assignmentId, userId]
    );
    return teacherCheck.rows.length > 0;
  }

  if (userRole === "student") {
    const studentCheck = await query(
      `
      SELECT a.id 
      FROM assignments a
      JOIN enrollments e ON a.class_id = e.class_id
      WHERE a.id = $1 AND e.student_id = $2
    `,
      [assignmentId, userId]
    );
    return studentCheck.rows.length > 0;
  }

  return false;
}

/**
 * Helper function to get user's accessible classes
 */
async function getUserClasses(userId, userRole) {
  if (userRole === "admin") {
    const result = await query("SELECT id FROM classes");
    return result.rows.map((row) => row.id);
  }

  if (userRole === "teacher") {
    const result = await query("SELECT id FROM classes WHERE teacher_id = $1", [
      userId,
    ]);
    return result.rows.map((row) => row.id);
  }

  if (userRole === "student") {
    const result = await query(
      "SELECT class_id FROM enrollments WHERE student_id = $1",
      [userId]
    );
    return result.rows.map((row) => row.class_id);
  }

  return [];
}

// GET /assignments - Get all assignments
router.get("/", authenticate(), async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const {
      class_id,
      teacher_id,
      status,
      page = "1",
      limit = "10",
    } = req.query;

    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramCount = 0;

    // Get user's accessible classes
    const userClasses = await getUserClasses(user.id, user.role);

    // Students can only see assignments for their classes
    if (user.role === "student" && userClasses.length > 0) {
      paramCount++;
      whereClause += ` AND a.class_id = ANY($${paramCount}::int[])`;
      queryParams.push(userClasses);
    } else if (user.role === "teacher" && userClasses.length > 0) {
      paramCount++;
      whereClause += ` AND a.class_id = ANY($${paramCount}::int[])`;
      queryParams.push(userClasses);
    }

    // Additional filters
    if (class_id) {
      paramCount++;
      whereClause += ` AND a.class_id = $${paramCount}`;
      queryParams.push(class_id);
    }

    if (teacher_id) {
      paramCount++;
      whereClause += ` AND a.teacher_id = $${paramCount}`;
      queryParams.push(teacher_id);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Pagination
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const offset = (pageNum - 1) * limitNum;

    // Get assignments with teacher and class info
    const assignmentsQuery = `
      SELECT 
        a.*,
        u.name as teacher_name,
        u.email as teacher_email,
        c.name as class_name,
        c.code as class_code,
        COUNT(s.id) as submission_count
      FROM assignments a
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      ${whereClause}
      GROUP BY a.id, u.name, u.email, c.name, c.code
      ORDER BY a.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limitNum, offset);

    const assignmentsResult = await query(assignmentsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM assignments a
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      ${whereClause}
    `;

    const countResult = await query(
      countQuery,
      queryParams.slice(0, paramCount)
    );
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: assignmentsResult.rows,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    next(new ApiError(500, "Error fetching assignments"));
  }
});

// GET /assignments/:id - Get assignment by ID
router.get("/:id", authenticate(), async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const { id } = req.params;

    // Check if user can access this assignment
    const canAccess = await canUserAccessAssignment(user.id, user.role, id);
    if (!canAccess) {
      res.status(403).json({
        success: false,
        message: "Access denied to this assignment",
      });
      return;
    }

    // Get assignment with teacher and class info
    const assignmentQuery = `
      SELECT 
        a.*,
        u.name as teacher_name,
        u.email as teacher_email,
        c.name as class_name,
        c.code as class_code
      FROM assignments a
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.id = $1
    `;

    const assignmentResult = await query(assignmentQuery, [id]);

    if (assignmentResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
      return;
    }

    const assignment = assignmentResult.rows[0];

    // Get submissions if user is teacher or admin
    if (user.role === "teacher" || user.role === "admin") {
      const submissionsQuery = `
        SELECT 
          s.*,
          u.name as student_name,
          u.email as student_email
        FROM submissions s
        LEFT JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = $1
        ORDER BY s.submitted_at DESC
      `;

      const submissionsResult = await query(submissionsQuery, [id]);
      assignment.submissions = submissionsResult.rows;
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    next(new ApiError(500, "Error fetching assignment"));
  }
});

// POST /assignments - Create new assignment (teachers and admins only)
router.post(
  "/",
  authenticate(),
  authorize(["teacher", "admin"]),
  async (req, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const {
        title,
        description,
        due_date,
        class_id,
        max_points,
        attachments,
        instructions,
        submission_type,
      } = req.body;

      // Validation
      if (!title || !description || !due_date || !class_id) {
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: title, description, due_date, class_id",
        });
        return;
      }

      // Verify teacher has access to the class
      if (user.role === "teacher") {
        const classCheck = await query(
          "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2",
          [class_id, user.id]
        );

        if (classCheck.rows.length === 0) {
          res.status(403).json({
            success: false,
            message: "Access denied to this class",
          });
          return;
        }
      }

      const insertQuery = `
        INSERT INTO assignments (
          title, description, due_date, class_id, teacher_id, 
          max_points, attachments, instructions, submission_type, 
          status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const result = await query(insertQuery, [
        title,
        description,
        new Date(due_date),
        class_id,
        user.id,
        max_points || 100,
        JSON.stringify(attachments || []),
        instructions || "",
        submission_type || "file",
        "active",
      ]);

      const assignment = result.rows[0];

      // Get assignment with populated data
      const populatedQuery = `
        SELECT 
          a.*,
          u.name as teacher_name,
          u.email as teacher_email,
          c.name as class_name,
          c.code as class_code
        FROM assignments a
        LEFT JOIN users u ON a.teacher_id = u.id
        LEFT JOIN classes c ON a.class_id = c.id
        WHERE a.id = $1
      `;

      const populatedResult = await query(populatedQuery, [assignment.id]);

      // Create audit log
      await createAuditLog({
        action: "ASSIGNMENT_CREATED",
        userId: user.id,
        details: `Created assignment: ${title}`,
      });

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        data: populatedResult.rows[0],
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
      next(new ApiError(500, "Error creating assignment"));
    }
  }
);

// PUT /assignments/:id - Update assignment (teachers and admins only)
router.put(
  "/:id",
  authenticate(),
  authorize(["teacher", "admin"]),
  async (req, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      // Check if assignment exists and user has permission
      const assignmentCheck = await query(
        "SELECT * FROM assignments WHERE id = $1",
        [id]
      );

      if (assignmentCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
        return;
      }

      const assignment = assignmentCheck.rows[0];

      // Teachers can only update their own assignments
      if (user.role === "teacher" && assignment.teacher_id !== user.id) {
        res.status(403).json({
          success: false,
          message: "Access denied - can only update your own assignments",
        });
        return;
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

      Object.keys(updates).forEach((key) => {
        if (updates[key] !== undefined && key !== "id") {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          message: "No valid fields to update",
        });
        return;
      }

      // Add updated_at
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date());

      // Add WHERE clause
      paramCount++;
      updateValues.push(id);

      const updateQuery = `
        UPDATE assignments 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const updateResult = await query(updateQuery, updateValues);

      // Get updated assignment with populated data
      const populatedQuery = `
        SELECT 
          a.*,
          u.name as teacher_name,
          u.email as teacher_email,
          c.name as class_name,
          c.code as class_code
        FROM assignments a
        LEFT JOIN users u ON a.teacher_id = u.id
        LEFT JOIN classes c ON a.class_id = c.id
        WHERE a.id = $1
      `;

      const populatedResult = await query(populatedQuery, [id]);

      // Create audit log
      await createAuditLog({
        action: "ASSIGNMENT_UPDATED",
        userId: user.id,
        details: `Updated assignment: ${assignment.title}`,
      });

      res.json({
        success: true,
        message: "Assignment updated successfully",
        data: populatedResult.rows[0],
      });
    } catch (error) {
      console.error("Error updating assignment:", error);
      next(new ApiError(500, "Error updating assignment"));
    }
  }
);

// DELETE /assignments/:id - Delete assignment (teachers and admins only)
router.delete(
  "/:id",
  authenticate(),
  authorize(["teacher", "admin"]),
  async (req, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;

      // Check if assignment exists and user has permission
      const assignmentCheck = await query(
        "SELECT * FROM assignments WHERE id = $1",
        [id]
      );

      if (assignmentCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
        return;
      }

      const assignment = assignmentCheck.rows[0];

      // Teachers can only delete their own assignments
      if (user.role === "teacher" && assignment.teacher_id !== user.id) {
        res.status(403).json({
          success: false,
          message: "Access denied - can only delete your own assignments",
        });
        return;
      }

      // Delete assignment (this will cascade to submissions if foreign key is set up)
      await query("DELETE FROM assignments WHERE id = $1", [id]);

      // Create audit log
      await createAuditLog({
        action: "ASSIGNMENT_DELETED",
        userId: user.id,
        details: `Deleted assignment: ${assignment.title}`,
      });

      res.json({
        success: true,
        message: "Assignment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      next(new ApiError(500, "Error deleting assignment"));
    }
  }
);

// POST /assignments/:id/submit - Submit assignment (students only)
router.post(
  "/:id/submit",
  authenticate(),
  authorize(["student"]),
  async (req, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const { submission_text, attachments } = req.body;

      // Check if assignment exists and user can access it
      const canAccess = await canUserAccessAssignment(user.id, user.role, id);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: "Access denied to this assignment",
        });
        return;
      }

      // Get assignment details
      const assignmentResult = await query(
        "SELECT * FROM assignments WHERE id = $1",
        [id]
      );
      const assignment = assignmentResult.rows[0];

      if (!assignment) {
        res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
        return;
      }

      // Check if assignment is still accepting submissions
      if (new Date() > new Date(assignment.due_date)) {
        res.status(400).json({
          success: false,
          message: "Assignment submission deadline has passed",
        });
        return;
      }

      // Check if student has already submitted
      const existingSubmission = await query(
        "SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2",
        [id, user.id]
      );

      if (existingSubmission.rows.length > 0) {
        res.status(400).json({
          success: false,
          message: "Assignment already submitted",
        });
        return;
      }

      // Create submission
      const insertSubmissionQuery = `
        INSERT INTO submissions (
          assignment_id, student_id, submission_text, attachments, 
          submitted_at, status
        )
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
        RETURNING *
      `;

      await query(insertSubmissionQuery, [
        id,
        user.id,
        submission_text || "",
        JSON.stringify(attachments || []),
        "submitted",
      ]);

      // Create audit log
      await createAuditLog({
        action: "ASSIGNMENT_SUBMITTED",
        userId: user.id,
        details: `Submitted assignment: ${assignment.title}`,
      });

      res.json({
        success: true,
        message: "Assignment submitted successfully",
      });
    } catch (error) {
      console.error("Error submitting assignment:", error);
      next(new ApiError(500, "Error submitting assignment"));
    }
  }
);

// GET /assignments/:id/submissions - Get assignment submissions (teachers and admins only)
router.get(
  "/:id/submissions",
  authenticate(),
  authorize(["teacher", "admin"]),
  async (req, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;

      // Get assignment with teacher info
      const assignmentQuery = `
        SELECT 
          a.*,
          u.name as teacher_name,
          u.email as teacher_email,
          c.name as class_name,
          c.code as class_code
        FROM assignments a
        LEFT JOIN users u ON a.teacher_id = u.id
        LEFT JOIN classes c ON a.class_id = c.id
        WHERE a.id = $1
      `;

      const assignmentResult = await query(assignmentQuery, [id]);

      if (assignmentResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
        return;
      }

      const assignment = assignmentResult.rows[0];

      // Teachers can only see submissions for their assignments
      if (user.role === "teacher" && assignment.teacher_id !== user.id) {
        res.status(403).json({
          success: false,
          message: "Access denied to these submissions",
        });
        return;
      }

      // Get submissions
      const submissionsQuery = `
        SELECT 
          s.*,
          u.name as student_name,
          u.email as student_email
        FROM submissions s
        LEFT JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = $1
        ORDER BY s.submitted_at DESC
      `;

      const submissionsResult = await query(submissionsQuery, [id]);

      res.json({
        success: true,
        data: {
          assignment: {
            id: assignment.id,
            title: assignment.title,
            due_date: assignment.due_date,
            max_points: assignment.max_points,
          },
          submissions: submissionsResult.rows,
        },
      });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      next(new ApiError(500, "Error fetching submissions"));
    }
  }
);

export default router;
