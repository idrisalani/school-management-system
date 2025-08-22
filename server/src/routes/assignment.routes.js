// @ts-nocheck

// server/src/routes/assignment.routes.js - COMPLETE WITH ALL FIXES
import express from "express";
import { body, validationResult, param, query } from "express-validator";
import { createAssignmentService } from "../services/assignment.service.js";
import { createAnalyticsService } from "../services/analytics.service.js";

// ✅ CORRECT IMPORT - Fixed middleware import
import {
  authenticate,
  authorize,
  teacherOrAdmin,
  adminOnly,
  requireClassTeacher,
  requireClassEnrollment,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Validation middleware
const validateAssignmentCreation = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title is required and must be less than 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be less than 1000 characters"),
  body("classId").isUUID().withMessage("Valid class ID is required"),
  body("dueDate").isISO8601().withMessage("Valid due date is required"),
  body("maxPoints")
    .isFloat({ min: 0, max: 10000 })
    .withMessage("Max points must be between 0 and 10000"),
  body("type")
    .optional()
    .isIn(["homework", "quiz", "exam", "project", "lab"])
    .withMessage("Invalid assignment type"),
];

const validateSubmission = [
  body("text")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Submission text must be less than 5000 characters"),
  body("attachments")
    .optional()
    .isArray()
    .withMessage("Attachments must be an array"),
];

const validateGrading = [
  body("score")
    .isFloat({ min: 0 })
    .withMessage("Score must be a positive number"),
  body("feedback")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Feedback must be less than 1000 characters"),
];

// Helper functions
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

const handleServiceError = (error, res) => {
  const errorMap = {
    UNAUTHORIZED_CLASS_ACCESS: {
      status: 403,
      message: "You do not have access to this class",
    },
    DUE_DATE_MUST_BE_FUTURE: {
      status: 400,
      message: "Due date must be in the future",
    },
    ASSIGNMENT_NOT_FOUND: { status: 404, message: "Assignment not found" },
    ASSIGNMENT_DEADLINE_PASSED: {
      status: 400,
      message: "Assignment deadline has passed",
    },
    STUDENT_NOT_ENROLLED: {
      status: 403,
      message: "Student is not enrolled in this class",
    },
    SUBMISSION_NOT_FOUND: { status: 404, message: "Submission not found" },
    UNAUTHORIZED_TO_GRADE: {
      status: 403,
      message: "You are not authorized to grade this assignment",
    },
    INVALID_SCORE_RANGE: {
      status: 400,
      message: "Score is outside valid range",
    },
    UNAUTHORIZED_TO_UPDATE: {
      status: 403,
      message: "You are not authorized to update this assignment",
    },
    UNAUTHORIZED_TO_DELETE: {
      status: 403,
      message: "You are not authorized to delete this assignment",
    },
    NO_VALID_FIELDS_TO_UPDATE: {
      status: 400,
      message: "No valid fields provided for update",
    },
  };

  const errorInfo = errorMap[error.message];
  if (errorInfo) {
    return res.status(errorInfo.status).json({
      status: "error",
      message: errorInfo.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

// Routes

/**
 * @route   POST /api/assignments
 * @desc    Create a new assignment
 * @access  Private (Teacher)
 */
router.post(
  "/",
  ...teacherOrAdmin(), // ✅ FIXED - Spread the array
  validateAssignmentCreation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      const assignmentData = {
        ...req.body,
        teacherId: req.user.id,
      };

      const assignment = await assignmentService.createAssignment(
        assignmentData
      );

      return res.status(201).json({
        status: "success",
        message: "Assignment created successfully",
        data: { assignment },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/assignments/:id
 * @desc    Get assignment by ID
 * @access  Private
 */
router.get(
  "/:id",
  authenticate(), // ✅ FIXED - Single middleware function
  param("id").isUUID().withMessage("Invalid assignment ID"),
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      const assignment = await assignmentService.getAssignmentById(
        req.params.id
      );

      // Check if user has access to this assignment
      if (req.user.role === "student") {
        // Student must be enrolled in the class
        try {
          await assignmentService.validateStudentEnrollment(
            req.user.id,
            assignment.class_id
          );
        } catch (error) {
          return res.status(403).json({
            status: "error",
            message: "Access denied",
          });
        }
      } else if (
        req.user.role === "teacher" &&
        assignment.teacher_id !== req.user.id
      ) {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }

      return res.json({
        status: "success",
        data: { assignment },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/assignments/class/:classId
 * @desc    Get assignments for a class
 * @access  Private
 */
router.get(
  "/class/:classId",
  authenticate(), // ✅ FIXED - Single middleware function
  param("classId").isUUID().withMessage("Invalid class ID"),
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      let assignments;

      if (req.user.role === "teacher") {
        assignments = await assignmentService.getAssignmentsByClass(
          req.params.classId,
          req.user.id
        );
      } else if (req.user.role === "student") {
        assignments = await assignmentService.getStudentAssignments(
          req.user.id,
          req.params.classId
        );
      } else if (req.user.role === "admin") {
        assignments = await assignmentService.getAssignmentsByClass(
          req.params.classId
        );
      } else {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }

      return res.json({
        status: "success",
        data: { assignments },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/assignments/student/my
 * @desc    Get current student's assignments
 * @access  Private (Student)
 */
router.get(
  "/student/my",
  authenticate(), // ✅ FIXED - Single middleware function
  authorize(["student"]), // ✅ FIXED - Single middleware function
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      const assignments = await assignmentService.getStudentAssignments(
        req.user.id
      );

      return res.json({
        status: "success",
        data: { assignments },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   POST /api/assignments/:id/submit
 * @desc    Submit assignment
 * @access  Private (Student)
 */
router.post(
  "/:id/submit",
  authenticate(), // ✅ FIXED - Single middleware function
  authorize(["student"]), // ✅ FIXED - Single middleware function
  param("id").isUUID().withMessage("Invalid assignment ID"),
  validateSubmission,
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      const submission = await assignmentService.submitAssignment(
        req.params.id,
        req.user.id,
        req.body
      );

      return res.status(201).json({
        status: "success",
        message: "Assignment submitted successfully",
        data: { submission },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   POST /api/assignments/submissions/:submissionId/grade
 * @desc    Grade a submission
 * @access  Private (Teacher)
 */
router.post(
  "/submissions/:submissionId/grade",
  ...teacherOrAdmin(), // ✅ FIXED - Spread the array
  param("submissionId").isUUID().withMessage("Invalid submission ID"),
  validateGrading,
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      const { score, feedback } = req.body;

      const gradeResult = await assignmentService.gradeSubmission(
        req.params.submissionId,
        req.user.id,
        score,
        feedback
      );

      return res.json({
        status: "success",
        message: "Submission graded successfully",
        data: { grade: gradeResult },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   PUT /api/assignments/:id
 * @desc    Update assignment
 * @access  Private (Teacher - own assignments only)
 */
router.put(
  "/:id",
  ...teacherOrAdmin(), // ✅ FIXED - Spread the array
  param("id").isUUID().withMessage("Invalid assignment ID"),
  [
    body("title").optional().trim().isLength({ min: 1, max: 200 }),
    body("description").optional().trim().isLength({ max: 1000 }),
    body("dueDate").optional().isISO8601(),
    body("maxPoints").optional().isFloat({ min: 0, max: 10000 }),
    body("type")
      .optional()
      .isIn(["homework", "quiz", "exam", "project", "lab"]),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      const updatedAssignment = await assignmentService.updateAssignment(
        req.params.id,
        req.user.id,
        req.body
      );

      return res.json({
        status: "success",
        message: "Assignment updated successfully",
        data: { assignment: updatedAssignment },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete assignment
 * @access  Private (Teacher - own assignments only)
 */
router.delete(
  "/:id",
  ...teacherOrAdmin(), // ✅ FIXED - Spread the array
  param("id").isUUID().withMessage("Invalid assignment ID"),
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      await assignmentService.deleteAssignment(req.params.id, req.user.id);

      return res.json({
        status: "success",
        message: "Assignment deleted successfully",
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/assignments/:id/analytics
 * @desc    Get assignment analytics
 * @access  Private (Teacher - own assignments only)
 */
router.get(
  "/:id/analytics",
  ...teacherOrAdmin(), // ✅ FIXED - Spread the array
  param("id").isUUID().withMessage("Invalid assignment ID"),
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      const analyticsService = createAnalyticsService(req);

      const analytics = await assignmentService.getAssignmentAnalytics(
        req.params.id,
        req.user.id
      );
      const detailedAnalytics = await analyticsService.getAssignmentAnalytics(
        req.params.id,
        req.user.id
      );

      return res.json({
        status: "success",
        data: {
          basicAnalytics: analytics,
          detailedAnalytics,
        },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/assignments/teacher/my
 * @desc    Get current teacher's assignments across all classes
 * @access  Private (Teacher)
 */
router.get(
  "/teacher/my",
  ...teacherOrAdmin(), // ✅ FIXED - Spread the array
  query("status").optional().isIn(["active", "inactive"]),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("offset").optional().isInt({ min: 0 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);

      // Get teacher's classes first, then get assignments for each
      // This is a simplified approach - in a real implementation, you'd want a dedicated method
      const assignments = await assignmentService.getAssignmentsByClass(
        null,
        req.user.id
      );

      return res.json({
        status: "success",
        data: { assignments },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/assignments/:id/submissions
 * @desc    Get all submissions for an assignment with comprehensive data
 * @access  Private (Teacher - own assignments only)
 */
router.get(
  "/:id/submissions",
  ...teacherOrAdmin(), // ✅ FIXED - Spread the array
  param("id").isUUID().withMessage("Invalid assignment ID"),
  query("status")
    .optional()
    .isIn(["submitted", "graded", "late", "not_submitted"]),
  query("include_missing").optional().isBoolean(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      const { status } = req.query;

      // Get comprehensive submissions data using the new service method
      const submissionsData = await assignmentService.getAssignmentSubmissions(
        req.params.id,
        req.user.id,
        status
      );

      return res.json({
        status: "success",
        data: submissionsData,
        meta: {
          request_params: {
            assignment_id: req.params.id,
            status_filter: status || "all",
            teacher_id: req.user.id,
          },
          generated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/assignments/:id/submissions/export
 * @desc    Export assignment submissions data (CSV format)
 * @access  Private (Teacher - own assignments only)
 */
router.get(
  "/:id/submissions/export",
  ...teacherOrAdmin(), // ✅ FIXED - Spread the array
  param("id").isUUID().withMessage("Invalid assignment ID"),
  query("format")
    .optional()
    .isIn(["csv", "json"])
    .withMessage("Format must be csv or json"),
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);
      const format = req.query.format || "csv";

      // Get all submissions data
      const submissionsData = await assignmentService.getAssignmentSubmissions(
        req.params.id,
        req.user.id
      );

      if (format === "csv") {
        // Generate CSV content
        const csvData = generateSubmissionsCSV(submissionsData);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="assignment_${req.params.id}_submissions.csv"`
        );

        return res.send(csvData);
      } else {
        // Return JSON with proper headers for download
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="assignment_${req.params.id}_submissions.json"`
        );

        return res.json(submissionsData);
      }
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/assignments/:id/submissions/summary
 * @desc    Get quick summary of assignment submissions
 * @access  Private (Teacher - own assignments only)
 */
router.get(
  "/:id/submissions/summary",
  ...teacherOrAdmin(), // ✅ FIXED - Spread the array
  param("id").isUUID().withMessage("Invalid assignment ID"),
  handleValidationErrors,
  async (req, res) => {
    try {
      const assignmentService = createAssignmentService(req);

      // Get just the statistics without full submission data
      const submissionsData = await assignmentService.getAssignmentSubmissions(
        req.params.id,
        req.user.id
      );

      return res.json({
        status: "success",
        data: {
          assignment: submissionsData.assignment,
          statistics: submissionsData.statistics,
          grade_statistics: submissionsData.grade_statistics,
          summary: {
            needs_attention: {
              pending_grading: submissionsData.statistics.pending_grading,
              missing_submissions: submissionsData.statistics.total_missing,
              late_submissions: submissionsData.statistics.late_submissions,
            },
            progress: {
              submission_rate: submissionsData.statistics.submission_rate,
              grading_rate: submissionsData.statistics.grading_rate,
              completion_status:
                submissionsData.statistics.grading_rate === 100
                  ? "complete"
                  : "in_progress",
            },
          },
        },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

// Helper function for CSV generation
function generateSubmissionsCSV(submissionsData) {
  const headers = [
    "Student Name",
    "Email",
    "Username",
    "Submission Status",
    "Submitted At",
    "Is Late",
    "Hours Late",
    "Score",
    "Percentage",
    "Letter Grade",
    "Graded At",
    "Grader",
    "Comments",
  ];

  let csvContent = headers.join(",") + "\n";

  // Add submitted assignments
  submissionsData.submissions.forEach((submission) => {
    const row = [
      `"${submission.student_name}"`,
      `"${submission.student_email}"`,
      `"${submission.username}"`,
      `"${submission.submission_status}"`,
      submission.submitted_at
        ? `"${new Date(submission.submitted_at).toLocaleString()}"`
        : '""',
      submission.is_late ? "Yes" : "No",
      submission.hours_late || "0",
      submission.score || "",
      submission.percentage || "",
      submission.grade_letter || "",
      submission.graded_at
        ? `"${new Date(submission.graded_at).toLocaleString()}"`
        : '""',
      submission.grader_name ? `"${submission.grader_name}"` : '""',
      submission.grade_comments
        ? `"${submission.grade_comments.replace(/"/g, '""')}"`
        : '""',
    ];
    csvContent += row.join(",") + "\n";
  });

  // Add missing submissions
  submissionsData.missing_submissions.forEach((missing) => {
    const row = [
      `"${missing.student_name}"`,
      `"${missing.student_email}"`,
      `"${missing.username}"`,
      '"Not Submitted"',
      '""',
      missing.is_late ? "Yes" : "No",
      missing.hours_past_due ? missing.hours_past_due.toFixed(2) : "0",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
    csvContent += row.join(",") + "\n";
  });

  return csvContent;
}

export default router;
