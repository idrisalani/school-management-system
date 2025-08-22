// @ts-nocheck

// server/src/routes/user.routes.js - COMPLETELY FIXED - ALL MIDDLEWARE ERRORS RESOLVED
import express from "express";
import { body, validationResult, param, query } from "express-validator";
import { createUserService } from "../services/user.service.js";

// ✅ COMPLETELY FIXED IMPORTS - Import individual functions directly
import {
  authenticate,
  authorize,
  adminOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Validation middleware
const validateUserRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must be at least 8 characters with uppercase, lowercase, and number"
    ),
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name is required and must be less than 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name is required and must be less than 50 characters"),
  body("role")
    .optional()
    .isIn(["student", "teacher", "admin"])
    .withMessage("Role must be student, teacher, or admin"),
];

const validateUserUpdate = [
  body("firstName").optional().trim().isLength({ min: 1, max: 50 }),
  body("lastName").optional().trim().isLength({ min: 1, max: 50 }),
  body("phone").optional().isMobilePhone("any"),
  body("address").optional().trim().isLength({ max: 200 }),
];

const validatePasswordChange = [
  body("oldPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must be at least 8 characters with uppercase, lowercase, and number"
    ),
];

// Helper function to handle validation errors
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

// Helper function to handle service errors
const handleServiceError = (error, res) => {
  const errorMap = {
    EMAIL_ALREADY_EXISTS: {
      status: 409,
      message: "Email address is already registered",
    },
    USER_NOT_FOUND: { status: 404, message: "User not found" },
    INVALID_OLD_PASSWORD: {
      status: 400,
      message: "Current password is incorrect",
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

  // Generic error
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

// Routes

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public (or Admin for creating teachers/admins)
 */
router.post(
  "/register",
  validateUserRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userService = createUserService(req);
      const user = await userService.createUser(req.body);

      return res.status(201).json({
        status: "success",
        message: "User created successfully",
        data: { user },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get(
  "/profile",
  authenticate(), // ✅ FIXED - Single middleware function call
  async (req, res) => {
    try {
      const userService = createUserService(req);
      const user = await userService.getUserById(req.user.id);

      return res.json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or self)
 */
router.get(
  "/:id",
  authenticate(), // ✅ FIXED - Single middleware
  param("id").isUUID().withMessage("Invalid user ID"),
  handleValidationErrors,
  async (req, res) => {
    try {
      // Check if user is accessing their own profile or is admin
      if (req.user.id !== req.params.id && req.user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }

      const userService = createUserService(req);
      const user = await userService.getUserById(req.params.id);

      return res.json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put(
  "/profile",
  authenticate(), // ✅ FIXED - Single middleware
  validateUserUpdate,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userService = createUserService(req);
      const updatedUser = await userService.updateUser(req.user.id, req.body);

      return res.json({
        status: "success",
        message: "Profile updated successfully",
        data: { user: updatedUser },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   PUT /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  "/change-password",
  authenticate(), // ✅ FIXED - Single middleware
  validatePasswordChange,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userService = createUserService(req);
      await userService.changePassword(
        req.user.id,
        req.body.oldPassword,
        req.body.newPassword
      );

      return res.json({
        status: "success",
        message: "Password changed successfully",
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private (Admin or Teacher)
 */
router.get(
  "/search",
  authenticate(), // ✅ FIXED - Single middleware
  authorize(["admin", "teacher"]), // ✅ FIXED - Single middleware
  query("q").notEmpty().withMessage("Search query is required"),
  query("role").optional().isIn(["student", "teacher", "admin"]),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("offset").optional().isInt({ min: 0 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { q, role, limit = 20, offset = 0 } = req.query;

      const userService = createUserService(req);
      const users = await userService.searchUsers(
        q,
        role,
        parseInt(limit.toString()),
        parseInt(offset.toString())
      );

      return res.json({
        status: "success",
        data: {
          users,
          pagination: {
            limit: parseInt(limit.toString()),
            offset: parseInt(offset.toString()),
            count: users.length,
          },
        },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get(
  "/stats",
  authenticate(), // ✅ FIXED - Single middleware
  async (req, res) => {
    try {
      const userService = createUserService(req);
      const stats = await userService.getUserStats(req.user.id);

      return res.json({
        status: "success",
        data: { stats },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/",
  authenticate(), // ✅ FIXED - Use individual middleware instead of adminOnly()
  authorize(["admin"]), // ✅ FIXED - Separate authorize call
  query("role").optional().isIn(["student", "teacher", "admin"]),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("offset").optional().isInt({ min: 0 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { role, limit = 50, offset = 0 } = req.query;

      const userService = createUserService(req);

      if (role || limit || offset) {
        // Use search with empty query to get filtered results
        const users = await userService.searchUsers(
          "",
          role,
          parseInt(limit.toString()),
          parseInt(offset.toString())
        );
        return res.json({
          status: "success",
          data: {
            users,
            pagination: {
              limit: parseInt(limit.toString()),
              offset: parseInt(offset.toString()),
              count: users.length,
            },
          },
        });
      }

      // Get basic user list without search
      const users = await userService.searchUsers("", null, 50, 0);
      return res.json({
        status: "success",
        data: { users },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user (Admin only)
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authenticate(), // ✅ FIXED - Use individual middleware instead of adminOnly()
  authorize(["admin"]), // ✅ FIXED - Separate authorize call
  param("id").isUUID().withMessage("Invalid user ID"),
  handleValidationErrors,
  async (req, res) => {
    try {
      // Prevent admin from deactivating themselves
      if (req.user.id === req.params.id) {
        return res.status(400).json({
          status: "error",
          message: "Cannot deactivate your own account",
        });
      }

      const userService = createUserService(req);
      const deactivatedUser = await userService.deactivateUser(req.params.id);

      return res.json({
        status: "success",
        message: "User deactivated successfully",
        data: { user: deactivatedUser },
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  }
);

export default router;
