// server/src/middleware/validation.middleware.js
import Joi from "joi";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";

/**
 * Generic schema validator
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export const validateSchema = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    const details = error.details.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    next(new ApiError(400, "Validation failed", details));
  }
};

/**
 * Validate grade creation/update data (PostgreSQL version)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateGrade = (req, res, next) => {
  try {
    const {
      student_id,
      class_id,
      assignment_id,
      score,
      max_score,
      term,
      academic_year,
    } = req.body;

    const errors = [];

    // Validate required fields
    if (!student_id) errors.push("Student ID is required");
    if (!class_id) errors.push("Class ID is required");
    if (score === undefined || score === null) errors.push("Score is required");
    if (!term) errors.push("Term is required");
    if (!academic_year) errors.push("Academic year is required");

    // Validate score
    if (typeof score === "number") {
      if (score < 0) {
        errors.push("Score cannot be negative");
      }
      if (max_score && score > max_score) {
        errors.push("Score cannot exceed maximum score");
      }
    } else {
      errors.push("Score must be a number");
    }

    // Validate max_score if provided
    if (max_score !== undefined && max_score !== null) {
      if (typeof max_score !== "number" || max_score <= 0) {
        errors.push("Maximum score must be a positive number");
      }
    }

    // Validate term
    const validTerms = ["first", "second", "third", "fourth"];
    if (!validTerms.includes(term)) {
      errors.push(`Term must be one of: ${validTerms.join(", ")}`);
    }

    // Validate academic year format (e.g., "2023-2024")
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(academic_year)) {
      errors.push("Academic year must be in format YYYY-YYYY");
    } else {
      const [startYear, endYear] = academic_year.split("-").map(Number);
      if (endYear !== startYear + 1) {
        errors.push("Invalid academic year range");
      }
    }

    if (errors.length > 0) {
      throw ApiError.validationError("Invalid grade data", errors);
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.internal("Grade validation failed"));
    }
  }
};

// Payment validation schema (PostgreSQL version)
export const paymentSchema = Joi.object({
  student_id: Joi.number().integer().positive().required().messages({
    "number.base": "Student ID must be a number",
    "number.integer": "Student ID must be an integer",
    "number.positive": "Student ID must be positive",
    "any.required": "Student ID is required",
  }),
  amount: Joi.number().positive().required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "any.required": "Amount is required",
  }),
  description: Joi.string().max(500).optional(),
  type: Joi.string()
    .valid("tuition", "fees", "books", "other")
    .required()
    .messages({
      "any.only": "Invalid payment type",
      "any.required": "Payment type is required",
    }),
  academic_year: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "Academic year must be in format YYYY-YYYY",
      "any.required": "Academic year is required",
    }),
});

/**
 * Validate payment data
 */
export const validatePayment = async (req, res, next) => {
  try {
    await paymentSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    const details = error.details.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    next(new ApiError(400, "Invalid payment data", details));
  }
};

// Authentication schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  username: Joi.string().min(3).optional().messages({
    "string.min": "Username must be at least 3 characters long",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
}).xor("email", "username"); // Either email or username is required

const registrationSchema = Joi.object({
  // Name validation
  name: Joi.string().min(2).max(50).required().trim().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
  }),

  // Email validation
  email: Joi.string().email().required().trim().lowercase().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
  }),

  // Username validation (optional)
  username: Joi.string().min(3).max(30).optional().trim().messages({
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
  }),

  // Password validation
  password: Joi.string()
    .min(8)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    )
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty",
    }),

  // Password confirmation
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords must match",
    "any.required": "Password confirmation is required",
    "string.empty": "Password confirmation cannot be empty",
  }),

  // Role validation
  role: Joi.string()
    .valid("admin", "teacher", "student", "parent")
    .required()
    .messages({
      "any.only":
        "Invalid role. Must be one of: admin, teacher, student, parent",
      "any.required": "Role is required",
      "string.empty": "Role cannot be empty",
    }),
});

const passwordResetSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one letter and one number",
      "any.required": "New password is required",
    }),
});

export const validateLogin = async (req, res, next) => {
  try {
    await loginSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(new ApiError(400, error.details[0].message));
  }
};

export const validateRegistration = (req, res, next) => {
  try {
    const { email, password, firstName, lastName, username, name, role } =
      req.body;

    // ✅ FLEXIBLE NAME HANDLING - Accept either 'name' or 'firstName'+'lastName'
    let fullName = name;
    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName || ""} ${lastName || ""}`.trim();
    }
    if (!fullName && username) {
      fullName = username; // Fallback to username if no other name provided
    }

    // Validation rules
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

    // Password validation
    if (!password) {
      errors.push({ message: "Password is required", field: "password" });
    } else if (password.length < 8) {
      errors.push({
        message: "Password must be at least 8 characters long",
        field: "password",
      });
    }

    // Name validation (now flexible)
    if (!fullName) {
      errors.push({
        message: "Name is required (provide either name or firstName/lastName)",
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
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // ✅ ADD COMPUTED NAME TO REQUEST BODY
    req.body.name = fullName;

    next();
  } catch (error) {
    logger.error("Validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Validation error occurred",
    });
  }
};

export const validatePasswordReset = async (req, res, next) => {
  try {
    await passwordResetSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(new ApiError(400, error.details[0].message));
  }
};

export const validateEmailVerification = (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new ApiError(400, "Verification token is required");
    }

    next();
  } catch (error) {
    next(error);
  }
};

// User validation schema (PostgreSQL version)
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  username: Joi.string().min(3).max(30).optional().messages({
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
  }),
  role: Joi.string()
    .valid("admin", "teacher", "student", "parent")
    .required()
    .messages({
      "any.only": "Invalid role selected",
      "any.required": "Role is required",
    }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      "string.pattern.base": "Please enter a valid phone number",
    }),
  address: Joi.string().max(200).optional(),
});

// Profile update schema
const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  username: Joi.string().min(3).max(30).optional(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  address: Joi.string().max(200).optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

/**
 * Validate user creation/update data
 */
export const validateUser = async (req, res, next) => {
  try {
    await userSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new ApiError(400, "Invalid user data", error.details));
  }
};

/**
 * Validate profile update data
 */
export const validateProfileUpdate = async (req, res, next) => {
  try {
    await profileUpdateSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new ApiError(400, "Invalid profile data", error.details));
  }
};

// Password change schema
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/)
    .required()
    .messages({
      "string.min": "New password must be at least 8 characters long",
      "string.pattern.base":
        "New password must contain at least one letter and one number",
      "any.required": "New password is required",
    }),
}).required();

/**
 * Validate password change data
 */
export const validatePasswordChange = async (req, res, next) => {
  try {
    await passwordChangeSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new ApiError(400, "Invalid password data", error.details));
  }
};

// Username validation schema
const usernameSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().trim().messages({
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
    "any.required": "Username is required",
    "string.empty": "Username cannot be empty",
  }),
});

/**
 * Validate username update data
 */
export const validateUsername = async (req, res, next) => {
  try {
    await usernameSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new ApiError(400, "Invalid username data", error.details));
  }
};
