// @ts-nocheck
// server/src/routes/grade.routes.js
import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { createSyncMiddleware } from "../middleware/sync.middleware.js";
import { validateGrade } from "../middleware/validation.middleware.js";
import { rateLimiter } from "../middleware/rate-limiter.middleware.js";
import gradeController from "../controllers/grade.controller.js";

const router = express.Router();
const syncMiddleware = createSyncMiddleware("grades");

/**
 * Handle async route errors
 * @param {Function} handler - Route handler function
 * @returns {Function} Wrapped handler
 */
const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  }
};

// Get all grades (with optional filters)
router.get(
  "/",
  authenticate,
  rateLimiter({ windowMs: 60 * 1000, max: 30 }), // 30 requests per minute
  asyncHandler(gradeController.getGrades)
);

// Get specific grade by ID
router.get(
  "/:id",
  authenticate,
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  asyncHandler(gradeController.getGradeById)
);

// Create new grade
router.post(
  "/",
  authenticate,
  authorize(["admin", "teacher"]),
  rateLimiter({ windowMs: 60 * 1000, max: 20 }),
  validateGrade,
  syncMiddleware,
  asyncHandler(gradeController.createGrade)
);

// Update grade
router.put(
  "/:id",
  authenticate,
  authorize(["admin", "teacher"]),
  rateLimiter({ windowMs: 60 * 1000, max: 20 }),
  validateGrade,
  syncMiddleware,
  asyncHandler(gradeController.updateGrade)
);

// Delete grade
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  syncMiddleware,
  asyncHandler(gradeController.deleteGrade)
);

// Get grades by student ID
router.get(
  "/student/:studentId",
  authenticate,
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  asyncHandler(gradeController.getGradesByStudent)
);

// Get grades by course ID
router.get(
  "/course/:courseId",
  authenticate,
  authorize(["admin", "teacher"]),
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  asyncHandler(gradeController.getGradesByCourse)
);

// Bulk update grades
router.put(
  "/bulk",
  authenticate,
  authorize(["admin", "teacher"]),
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  validateGrade,
  syncMiddleware,
  asyncHandler(gradeController.bulkUpdateGrades)
);

router.get(
  "/statistics",
  authenticate,
  authorize(["admin", "teacher"]),
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  gradeController.getGradeStatistics
);

export default router;
