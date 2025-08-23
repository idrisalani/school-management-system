// @ts-check
// server/src/middleware/validation.middleware.js - Fixed TypeScript Issues
import { body, param, query, validationResult } from "express-validator";
import Joi from "joi";
import { ApiError, ValidationError } from "../utils/errors.js";
import logger from "../utils/logger.js";

/**
 * @typedef {Object} ValidationOptions
 * @property {boolean} [abortEarly=false] - Stop validation on first error
 * @property {boolean} [stripUnknown=false] - Remove unknown fields
 * @property {boolean} [allowUnknown=false] - Allow unknown fields
 */

// ========================= ERROR HANDLING =========================

/**
 * Safe field name extractor for validation errors
 * @param {any} error - Validation error object
 * @returns {string} Field name
 */
const getErrorFieldName = (error) => {
  if (typeof error === "object" && error !== null) {
    if ("path" in error && typeof error.path === "string") {
      return error.path;
    }
    if ("param" in error && typeof error.param === "string") {
      return error.param;
    }
    if ("location" in error && typeof error.location === "string") {
      return error.location;
    }
  }
  return "unknown";
};

/**
 * Safe value extractor for validation errors
 * @param {any} error - Validation error object
 * @returns {any} Error value
 */
const getErrorValue = (error) => {
  return error && typeof error === "object" && "value" in error
    ? error.value
    : undefined;
};

/**
 * Safe location extractor for validation errors
 * @param {any} error - Validation error object
 * @returns {string} Error location
 */
const getErrorLocation = (error) => {
  return error &&
    typeof error === "object" &&
    "location" in error &&
    typeof error.location === "string"
    ? error.location
    : "body";
};

/**
 * FIXED: Middleware to handle express-validator validation errors
 * This is the function that was causing the error at line 131
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const handleValidationErrors = (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error) => ({
        field: getErrorFieldName(error),
        message: error.msg || "Validation failed",
        value: getErrorValue(error),
        location: getErrorLocation(error),
      }));

      logger.warn("Express-validator validation failed", {
        url: req.originalUrl,
        method: req.method,
        errors: formattedErrors,
      });

      // FIXED: Use proper ValidationError function from your errors.js
      const validationError = ValidationError("Validation failed", {
        errors: formattedErrors,
      });

      return next(validationError);
    }

    next();
  } catch (error) {
    logger.error("Validation middleware error:", error);

    // FIXED: Return proper error response instead of calling next with error
    return res.status(500).json({
      status: "error",
      message: "Internal validation error",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Generic Joi schema validator - using your existing system
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {ValidationOptions} options - Validation options
 * @returns {Function} Express middleware
 */
export const validateSchema =
  (schema, options = {}) =>
  async (req, res, next) => {
    try {
      const validationOptions = {
        abortEarly: false,
        stripUnknown: false,
        allowUnknown: false,
        ...options,
      };

      const result = await schema.validateAsync(req.body, validationOptions);

      // Replace req.body with validated data
      req.body = result;

      next();
    } catch (error) {
      logger.warn("Joi validation failed", {
        url: req.originalUrl,
        method: req.method,
        error: error.message,
      });

      const details = error.details?.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        value: err.value,
      })) || [{ field: "unknown", message: error.message }];

      // FIXED: Use proper ApiError from your errors.js
      const validationError = new ApiError(400, "Validation failed", {
        errors: details,
      });
      next(validationError);
    }
  };

// ========================= JOI SCHEMAS =========================

/**
 * Enhanced authentication schemas using your existing validators
 */
const authSchemas = {
  login: Joi.object({
    email: Joi.string().email().optional().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
    }),
    username: Joi.string().min(3).max(30).optional().trim().messages({
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 30 characters",
    }),
    password: Joi.string().min(8).required().messages({
      "string.min": "Password must be at least 8 characters long",
      "any.required": "Password is required",
    }),
  }).custom((value, helpers) => {
    if (!value.email && !value.username) {
      return helpers.error("custom.missing_identifier", {
        message: "Either email or username is required",
      });
    }
    return value;
  }),

  registration: Joi.object({
    // Flexible name handling to match your existing system
    name: Joi.string().min(2).max(100).optional().trim().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 100 characters",
    }),
    firstName: Joi.string().min(2).max(50).optional().trim().messages({
      "string.min": "First name must be at least 2 characters long",
      "string.max": "First name cannot exceed 50 characters",
    }),
    lastName: Joi.string().min(2).max(50).optional().trim().messages({
      "string.min": "Last name must be at least 2 characters long",
      "string.max": "Last name cannot exceed 50 characters",
    }),
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    username: Joi.string().min(3).max(30).optional().trim().messages({
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 30 characters",
    }),
    password: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)",
        "any.required": "Password is required",
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords must match",
        "any.required": "Password confirmation is required",
      }),
    role: Joi.string()
      .valid("admin", "teacher", "student", "parent")
      .default("student")
      .messages({
        "any.only":
          "Invalid role. Must be one of: admin, teacher, student, parent",
      }),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .messages({
        "string.pattern.base": "Please provide a valid phone number",
      }),
    dateOfBirth: Joi.date().optional().max("now").messages({
      "date.max": "Date of birth cannot be in the future",
    }),
    address: Joi.string().max(255).optional(),
  }).custom((value, helpers) => {
    // Ensure we have some form of name
    const hasName =
      value.name || (value.firstName && value.lastName) || value.username;
    if (!hasName) {
      return helpers.error("custom.missing_name", {
        message: "Either name, firstName+lastName, or username is required",
      });
    }

    // Construct full name if not provided
    if (!value.name) {
      if (value.firstName || value.lastName) {
        value.name = `${value.firstName || ""} ${value.lastName || ""}`.trim();
      } else {
        value.name = value.username;
      }
    }

    return value;
  }),

  passwordReset: Joi.object({
    token: Joi.string().required().messages({
      "any.required": "Reset token is required",
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)",
        "any.required": "New password is required",
      }),
  }),

  passwordResetRequest: Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      "any.required": "Refresh token is required",
    }),
  }),

  passwordChange: Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required",
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .required()
      .messages({
        "string.min": "New password must be at least 8 characters long",
        "string.pattern.base":
          "New password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
        "any.required": "New password is required",
      }),
  }),

  profileUpdate: Joi.object({
    name: Joi.string().min(2).max(100).optional().trim(),
    firstName: Joi.string().min(2).max(50).optional().trim(),
    lastName: Joi.string().min(2).max(50).optional().trim(),
    username: Joi.string().min(3).max(30).optional().trim(),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional(),
    address: Joi.string().max(255).optional(),
    dateOfBirth: Joi.date().optional().max("now"),
    profileImageUrl: Joi.string().uri().optional(),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
};

/**
 * Academic schemas for PostgreSQL
 */
const academicSchemas = {
  grade: Joi.object({
    student_id: Joi.number().integer().positive().required().messages({
      "number.base": "Student ID must be a number",
      "number.integer": "Student ID must be an integer",
      "number.positive": "Student ID must be positive",
      "any.required": "Student ID is required",
    }),
    class_id: Joi.number().integer().positive().required().messages({
      "number.base": "Class ID must be a number",
      "number.integer": "Class ID must be an integer",
      "number.positive": "Class ID must be positive",
      "any.required": "Class ID is required",
    }),
    assignment_id: Joi.number().integer().positive().optional().messages({
      "number.base": "Assignment ID must be a number",
      "number.integer": "Assignment ID must be an integer",
      "number.positive": "Assignment ID must be positive",
    }),
    score: Joi.number().min(0).required().messages({
      "number.base": "Score must be a number",
      "number.min": "Score cannot be negative",
      "any.required": "Score is required",
    }),
    max_score: Joi.number().positive().optional().messages({
      "number.base": "Maximum score must be a number",
      "number.positive": "Maximum score must be positive",
    }),
    term: Joi.string()
      .valid("first", "second", "third", "fourth")
      .required()
      .messages({
        "any.only": "Term must be one of: first, second, third, fourth",
        "any.required": "Term is required",
      }),
    academic_year: Joi.string()
      .pattern(/^\d{4}-\d{4}$/)
      .required()
      .custom((value, helpers) => {
        const [startYear, endYear] = value.split("-").map(Number);
        if (endYear !== startYear + 1) {
          return helpers.error("custom.invalid_year_range");
        }
        return value;
      })
      .messages({
        "string.pattern.base": "Academic year must be in format YYYY-YYYY",
        "any.required": "Academic year is required",
        "custom.invalid_year_range": "Invalid academic year range",
      }),
  }).custom((value, helpers) => {
    if (value.max_score && value.score > value.max_score) {
      return helpers.error("custom.score_exceeds_max");
    }
    return value;
  }),

  payment: Joi.object({
    student_id: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(500).optional(),
    type: Joi.string()
      .valid(
        "tuition",
        "fees",
        "books",
        "supplies",
        "transport",
        "meals",
        "other"
      )
      .required(),
    academic_year: Joi.string()
      .pattern(/^\d{4}-\d{4}$/)
      .required(),
    due_date: Joi.date().min("now").optional(),
    payment_method: Joi.string()
      .valid("cash", "card", "bank_transfer", "mobile_money", "check")
      .optional(),
  }),

  class: Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    code: Joi.string().min(2).max(20).required().trim().uppercase(),
    description: Joi.string().max(500).optional().trim(),
    department_id: Joi.number().integer().positive().required(),
    teacher_id: Joi.number().integer().positive().optional(),
    grade_level: Joi.string().required().trim(),
    academic_year: Joi.string()
      .pattern(/^\d{4}-\d{4}$/)
      .required(),
    max_students: Joi.number().integer().min(1).max(200).optional().default(30),
    room_number: Joi.string().max(20).optional(),
    schedule: Joi.array()
      .items(
        Joi.object({
          day: Joi.string()
            .valid(
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday"
            )
            .required(),
          start_time: Joi.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .required(),
          end_time: Joi.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .required(),
        })
      )
      .optional(),
  }),

  assignment: Joi.object({
    title: Joi.string().min(3).max(200).required().trim(),
    description: Joi.string().max(2000).optional().trim(),
    class_id: Joi.number().integer().positive().required(),
    teacher_id: Joi.number().integer().positive().required(),
    type: Joi.string()
      .valid(
        "homework",
        "quiz",
        "exam",
        "project",
        "lab",
        "presentation",
        "essay",
        "midterm",
        "final"
      )
      .required(),
    max_points: Joi.number().positive().max(1000).optional().default(100),
    due_date: Joi.date().min("now").required(),
    submission_type: Joi.string()
      .valid("online", "paper", "both")
      .default("online"),
    instructions: Joi.string().max(2000).optional(),
    rubric: Joi.object().optional(),
    attachments: Joi.array().items(Joi.string().uri()).optional(),
  }),

  user: Joi.object({
    name: Joi.string().min(2).max(100).optional().trim(),
    firstName: Joi.string().min(2).max(50).optional().trim(),
    lastName: Joi.string().min(2).max(50).optional().trim(),
    email: Joi.string().email().required().trim().lowercase(),
    username: Joi.string().min(3).max(30).optional().trim(),
    role: Joi.string()
      .valid("admin", "teacher", "student", "parent")
      .required(),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional(),
    address: Joi.string().max(255).optional(),
    dateOfBirth: Joi.date().max("now").optional(),
    status: Joi.string()
      .valid("active", "inactive", "suspended")
      .default("active"),
    department_id: Joi.number().integer().positive().optional(),
    employee_id: Joi.string().max(20).optional(),
    student_id: Joi.string().max(20).optional(),
  }).custom((value, helpers) => {
    // Construct name if not provided
    if (!value.name && (value.firstName || value.lastName)) {
      value.name = `${value.firstName || ""} ${value.lastName || ""}`.trim();
    }
    return value;
  }),
};

// ========================= JOI VALIDATION MIDDLEWARE =========================

export const validateLogin = validateSchema(authSchemas.login);
export const validateRegistration = validateSchema(authSchemas.registration);
export const validatePasswordReset = validateSchema(authSchemas.passwordReset);
export const validatePasswordResetRequest = validateSchema(
  authSchemas.passwordResetRequest
);
export const validateRefreshToken = validateSchema(authSchemas.refreshToken);
export const validateChangePassword = validateSchema(
  authSchemas.passwordChange
);
export const validateProfileUpdate = validateSchema(authSchemas.profileUpdate);

export const validateGrade = validateSchema(academicSchemas.grade);
export const validatePayment = validateSchema(academicSchemas.payment);
export const validateClass = validateSchema(academicSchemas.class);
export const validateAssignment = validateSchema(academicSchemas.assignment);
export const validateUser = validateSchema(academicSchemas.user);

// ========================= EXPRESS-VALIDATOR RULES =========================

/**
 * Email verification validation (for URL params)
 */
export const validateEmailVerification = [
  param("token")
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage("Valid verification token is required"),
  handleValidationErrors,
];

/**
 * Email parameter validation
 */
export const validateEmailParam = [
  param("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  handleValidationErrors,
];

/**
 * ID parameter validation
 */
export const validateId = [
  param("id").isInt({ min: 1 }).withMessage("Invalid ID format"),
  handleValidationErrors,
];

/**
 * Pagination validation
 */
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional()
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage("Sort field must be a valid column name"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc", "ASC", "DESC"])
    .withMessage("Sort order must be 'asc' or 'desc'"),
  handleValidationErrors,
];

/**
 * Search validation
 */
export const validateSearch = [
  query("q")
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage("Search query must be between 1 and 100 characters"),
  query("field")
    .optional()
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage("Search field must be a valid column name"),
  handleValidationErrors,
];

/**
 * Date range validation - Fixed TypeScript issues
 */
export const validateDateRange = [
  query("startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Please provide a valid start date"),
  query("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Please provide a valid end date"),
  query("endDate").custom((value, { req }) => {
    // Fixed: Safe access to req.query
    if (value && req.query && req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error("End date must be after start date");
      }
    }
    return true;
  }),
  handleValidationErrors,
];

/**
 * File upload validation
 */
export const validateFileUpload = [
  body("fileName")
    .optional()
    .isLength({ min: 1, max: 255 })
    .trim()
    .withMessage("File name must be between 1 and 255 characters"),
  body("fileType")
    .optional()
    .isIn([
      "pdf",
      "doc",
      "docx",
      "txt",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "xlsx",
      "pptx",
    ])
    .withMessage("Invalid file type"),
  body("fileSize")
    .optional()
    .isInt({ min: 1, max: 52428800 }) // 50MB
    .withMessage("File size must be between 1 byte and 50MB"),
  body("category")
    .optional()
    .isIn(["assignment", "resource", "profile", "document"])
    .withMessage("Invalid file category"),
  handleValidationErrors,
];

// ========================= CUSTOM VALIDATION FUNCTIONS =========================

/**
 * Custom validation for flexible user data handling
 * Handles different name field combinations
 */
export const validateUserData = (req, res, next) => {
  try {
    const { email, password, firstName, lastName, username, name, role } =
      req.body;
    const errors = [];

    // Email validation
    if (!email) {
      errors.push({ message: "Email is required", field: "email" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        message: "Please provide a valid email address",
        field: "email",
      });
    }

    // Password validation (if provided)
    if (password && password.length < 8) {
      errors.push({
        message: "Password must be at least 8 characters long",
        field: "password",
      });
    }

    // Flexible name handling
    let fullName = name;
    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName || ""} ${lastName || ""}`.trim();
    }
    if (!fullName && username) {
      fullName = username;
    }

    if (!fullName) {
      errors.push({
        message:
          "Name is required (provide either name, firstName/lastName, or username)",
        field: "name",
      });
    }

    // Role validation
    const validRoles = ["student", "teacher", "admin", "parent"];
    if (role && !validRoles.includes(role)) {
      errors.push({ message: "Invalid role specified", field: "role" });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors,
      });
    }

    // Add computed name to request body
    req.body.name = fullName;
    next();
  } catch (error) {
    logger.error("User data validation error:", error);
    return res.status(500).json({
      status: "error",
      message: "Validation error occurred",
    });
  }
};

/**
 * Validate academic year format and logic
 */
export const validateAcademicYear = (req, res, next) => {
  const { academic_year } = req.body;

  if (!academic_year) {
    return next();
  }

  const yearPattern = /^\d{4}-\d{4}$/;
  if (!yearPattern.test(academic_year)) {
    return next(new ApiError(400, "Academic year must be in format YYYY-YYYY"));
  }

  const [startYear, endYear] = academic_year.split("-").map(Number);
  if (endYear !== startYear + 1) {
    return next(new ApiError(400, "Invalid academic year range"));
  }

  next();
};

/**
 * Validate time format (HH:MM)
 */
export const validateTimeFormat = (timeString) => {
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timePattern.test(timeString);
};

/**
 * Security validation for preventing injection attacks
 */
export const sanitizeInput = (req, res, next) => {
  // Remove potentially dangerous characters from string inputs
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        // Remove SQL injection patterns
        obj[key] = obj[key].replace(/[';-]/g, "");
        // Remove script tags
        obj[key] = obj[key].replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          ""
        );
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

// ========================= UTILITY FUNCTIONS =========================

/**
 * Create custom validation middleware
 * @param {Function} validationFn - Custom validation function
 * @param {string} errorMessage - Error message for validation failure
 * @returns {Function} Express middleware
 */
export const createCustomValidation = (
  validationFn,
  errorMessage = "Validation failed"
) => {
  return (req, res, next) => {
    try {
      const isValid = validationFn(req.body, req.params, req.query);
      if (!isValid) {
        return next(new ApiError(400, errorMessage));
      }
      next();
    } catch (error) {
      logger.error("Custom validation error:", error);
      next(new ApiError(400, errorMessage));
    }
  };
};

/**
 * Combine multiple validation middlewares
 * @param {...Function} validations - Validation middlewares to combine
 * @returns {Function[]} Array of validation middlewares
 */
export const combineValidations = (...validations) => {
  return validations.flat();
};

// ========================= EXPORTS =========================

export default {
  // Core validation functions
  validateSchema,
  handleValidationErrors,

  // Authentication validations
  validateLogin,
  validateRegistration,
  validatePasswordReset,
  validatePasswordResetRequest,
  validateEmailVerification,
  validateRefreshToken,
  validateChangePassword,
  validateProfileUpdate,

  // Academic validations
  validateGrade,
  validatePayment,
  validateClass,
  validateAssignment,
  validateUser,

  // Parameter validations
  validateId,
  validateEmailParam,
  validatePagination,
  validateSearch,
  validateDateRange,
  validateFileUpload,

  // Custom validations
  validateUserData,
  validateAcademicYear,
  sanitizeInput,

  // Utility functions
  createCustomValidation,
  combineValidations,
  validateTimeFormat,

  // Schemas for direct use
  authSchemas,
  academicSchemas,
};
