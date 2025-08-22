// server/src/utils/validators.js - Fixed TypeScript Issues
import { body, validationResult } from "express-validator";

/**
 * UNIFIED SERVER VALIDATION - MATCHES CLIENT EXACTLY
 * Updated for PostgreSQL (Supabase) compatibility
 * Fixed TypeScript compatibility issues
 */

/**
 * Validate email format - UNIFIED WITH CLIENT
 * @param {string} email - Email to validate
 * @returns {boolean} Is email valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Validate password strength - UPDATED TO MATCH CLIENT (WITH SPECIAL CHARACTERS)
 * @param {string} password - Password to validate
 * @returns {boolean} Is password valid
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== "string") return false;

  // Password requirements (NOW MATCHES CLIENT):
  // - At least 8 characters
  // - Contains at least one uppercase letter
  // - Contains at least one lowercase letter
  // - Contains at least one number
  // - Contains at least one special character [@$!%*?&]
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

/**
 * Validate username format - UNIFIED WITH CLIENT
 * @param {string} username - Username to validate
 * @returns {boolean} Is username valid
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== "string") return false;

  // Username requirements (SAME AS CLIENT):
  // - 3-30 characters
  // - Only letters, numbers, dots, and underscores
  // - Cannot start or end with dot or underscore
  const usernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._]){1,28}[a-zA-Z0-9]$/;
  return usernameRegex.test(username);
};

/**
 * Validate phone number - UNIFIED WITH CLIENT
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is phone valid
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;

  // Phone validation (SAME AS CLIENT)
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

/**
 * Validate full name - UNIFIED WITH CLIENT
 * @param {string} name - Full name to validate
 * @returns {boolean} Is name valid
 */
export const validateName = (name) => {
  if (!name || typeof name !== "string") return false;

  // Name requirements (SAME AS CLIENT):
  // - 2-100 characters
  // - Only letters, spaces, apostrophes, and hyphens
  const nameRegex = /^[a-zA-Z\s'-]{2,100}$/;
  return nameRegex.test(name.trim());
};

/**
 * Validate date of birth - FIXED DATE COMPARISON
 * @param {string} dateOfBirth - Date of birth to validate
 * @returns {boolean} Is date valid
 */
export const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) return false;

  const date = new Date(dateOfBirth);
  const now = new Date();

  // Check if date is valid
  if (isNaN(date.getTime())) return false;

  // Create date boundaries properly
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - 150);

  const maxDate = new Date();
  maxDate.setFullYear(now.getFullYear() - 5);

  // Fixed: Compare using getTime() to avoid TypeScript date comparison issues
  return (
    date.getTime() >= minDate.getTime() && date.getTime() <= maxDate.getTime()
  );
};

/**
 * Validate role - UNIFIED WITH CLIENT
 * @param {string} role - Role to validate
 * @returns {boolean} Is role valid
 */
export const validateRole = (role) => {
  const validRoles = ["student", "teacher", "admin", "parent"];
  return validRoles.includes(role);
};

/**
 * PostgreSQL UUID validation - REPLACES MongoDB ObjectId validation
 * @param {string} id - UUID to validate
 * @returns {boolean} Is UUID valid
 */
export const validateUUID = (id) => {
  if (!id || typeof id !== "string") return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Course code validation
 * @param {string} code - Course code to validate
 * @returns {boolean} Is course code valid
 */
export const validateCourseCode = (code) => {
  if (!code || typeof code !== "string") return false;

  const courseCodeRegex = /^[A-Z]{2,4}[0-9]{3,4}$/;
  return courseCodeRegex.test(code);
};

/**
 * Grade validation
 * @param {string} grade - Grade to validate
 * @returns {boolean} Is grade valid
 */
export const validateGrade = (grade) => {
  const validGrades = [
    "A+",
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "C-",
    "D+",
    "D",
    "D-",
    "F",
  ];
  return validGrades.includes(grade);
};

/**
 * Sanitize input string - ENHANCED SECURITY
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";

  return input
    .trim()
    .replace(/[<>\"'&]/g, "") // Remove potentially dangerous characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .substring(0, 1000); // Limit length
};

/**
 * Validate and sanitize user registration data - ENHANCED VERSION
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result
 */
export const validateRegistrationData = (userData) => {
  const errors = [];
  const sanitized = {};

  // Validate and sanitize email
  if (!userData.email) {
    errors.push("Email is required");
  } else if (!validateEmail(userData.email)) {
    errors.push("Please provide a valid email address");
  } else {
    sanitized.email = userData.email.trim().toLowerCase();
  }

  // Validate password (NOW WITH SPECIAL CHARACTER REQUIREMENT)
  if (!userData.password) {
    errors.push("Password is required");
  } else if (!validatePassword(userData.password)) {
    errors.push(
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)"
    );
  } else {
    sanitized.password = userData.password;
  }

  // Validate name (could be username or full name)
  const nameField = userData.username || userData.name;
  if (!nameField) {
    errors.push("Name is required");
  } else if (userData.username && !validateUsername(userData.username)) {
    errors.push(
      "Username: 3-30 characters, letters/numbers/dots/underscores, cannot start/end with dot/underscore"
    );
  } else if (userData.name && !validateName(userData.name)) {
    errors.push(
      "Name: 2-100 characters, letters/spaces/apostrophes/hyphens only"
    );
  } else {
    if (userData.username) {
      sanitized.username = sanitizeInput(userData.username);
    }
    if (userData.name) {
      sanitized.name = sanitizeInput(userData.name);
    }
  }

  // Validate role
  if (userData.role && !validateRole(userData.role)) {
    errors.push("Invalid role specified");
  } else {
    sanitized.role = userData.role || "student";
  }

  // Optional fields validation
  if (userData.phone) {
    if (!validatePhone(userData.phone)) {
      errors.push(
        "Phone: 10-15 characters, numbers/spaces/hyphens/parentheses, optional + prefix"
      );
    } else {
      sanitized.phone = sanitizeInput(userData.phone);
    }
  }

  if (userData.dateOfBirth) {
    if (!validateDateOfBirth(userData.dateOfBirth)) {
      errors.push("Please provide a valid date of birth (age 5-150)");
    } else {
      sanitized.dateOfBirth = userData.dateOfBirth;
    }
  }

  // Add PostgreSQL-compatible fields
  if (userData.id && !validateUUID(userData.id)) {
    errors.push("Invalid ID format");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
};

/**
 * Enhanced Express validator middleware for registration
 */
export const registrationValidators = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)"
    ),
  body("username")
    .optional()
    .matches(/^[a-zA-Z0-9]([a-zA-Z0-9._]){1,28}[a-zA-Z0-9]$/)
    .withMessage(
      "Username: 3-30 characters, letters/numbers/dots/underscores, cannot start/end with dot/underscore"
    ),
  body("name")
    .optional()
    .matches(/^[a-zA-Z\s'-]{2,100}$/)
    .withMessage(
      "Name: 2-100 characters, letters/spaces/apostrophes/hyphens only"
    ),
  body("role")
    .optional()
    .isIn(["student", "teacher", "admin", "parent"])
    .withMessage("Invalid role specified"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s\-\(\)]{10,15}$/)
    .withMessage(
      "Phone: 10-15 characters, numbers/spaces/hyphens/parentheses, optional + prefix"
    ),
  body("dateOfBirth")
    .optional()
    .isDate()
    .withMessage("Please provide a valid date of birth"),
];

/**
 * Express validator middleware for login
 */
export const loginValidators = [
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("username")
    .optional()
    .isLength({ min: 1 })
    .withMessage("Username cannot be empty"),
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Express validator middleware for password reset
 */
export const passwordResetValidators = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)"
    ),
];

/**
 * PostgreSQL-specific validators
 */
export const postgreSQLValidators = {
  // UUID validation for PostgreSQL primary keys
  validateId: [
    body("id")
      .optional()
      .matches(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      .withMessage("Invalid ID format"),
  ],

  // Course validation
  validateCourse: [
    body("name")
      .isLength({ min: 2, max: 100 })
      .withMessage("Course name must be 2-100 characters"),
    body("code")
      .matches(/^[A-Z]{2,4}[0-9]{3,4}$/)
      .withMessage(
        "Course code format: 2-4 letters followed by 3-4 numbers (e.g., CS101)"
      ),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description must be no more than 1000 characters"),
  ],

  // Assignment validation
  validateAssignment: [
    body("title")
      .isLength({ min: 2, max: 200 })
      .withMessage("Assignment title must be 2-200 characters"),
    body("description")
      .optional()
      .isLength({ max: 2000 })
      .withMessage("Description must be no more than 2000 characters"),
    body("dueDate").isISO8601().withMessage("Due date must be a valid date"),
    body("points")
      .optional()
      .isFloat({ min: 0, max: 1000 })
      .withMessage("Points must be between 0 and 1000"),
  ],
};

/**
 * Enhanced middleware to handle validation errors - TYPESCRIPT SAFE
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = {};

    // Group errors by field for better client-side handling
    errors.array().forEach((error) => {
      const fieldName = getErrorFieldName(error);

      if (!formattedErrors[fieldName]) {
        formattedErrors[fieldName] = [];
      }
      formattedErrors[fieldName].push(error.msg || "Validation failed");
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
      totalErrors: errors.array().length,
    });
  }

  next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = [
  body("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  body("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  body("sortBy")
    .optional()
    .isAlpha()
    .withMessage("Sort field must contain only letters"),
  body("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be 'asc' or 'desc'"),
];

/**
 * Bulk validation helper for multiple records
 * @param {Array} records - Array of records to validate
 * @param {Function} validator - Validation function
 * @returns {Object} Validation result
 */
export const validateBulk = (records, validator) => {
  const results = [];
  let hasErrors = false;

  records.forEach((record, index) => {
    const result = validator(record);
    results.push({
      index,
      ...result,
    });

    if (!result.isValid) {
      hasErrors = true;
    }
  });

  return {
    isValid: !hasErrors,
    results,
    validRecords: results.filter((r) => r.isValid).map((r) => r.sanitized),
    invalidRecords: results.filter((r) => !r.isValid),
  };
};

/**
 * Additional TypeScript-friendly helper functions
 */

/**
 * Type-safe field name extractor for validation errors
 * @param {any} error - Validation error object
 * @returns {string} Field name
 */
export const getErrorFieldName = (error) => {
  // Use 'in' operator for type-safe property checking
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
 * Safe date comparison helper
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Comparison result (-1, 0, 1)
 */
export const compareDates = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new Error("Invalid date provided");
  }

  const time1 = d1.getTime();
  const time2 = d2.getTime();

  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
};

/**
 * Type-safe error formatter
 * @param {any} error - Error object
 * @returns {Object} Formatted error
 */
export const formatValidationError = (error) => {
  return {
    field: getErrorFieldName(error),
    message: (error && error.msg) || "Validation failed",
    value: (error && error.value) || undefined,
    location: (error && error.location) || "body",
  };
};

export default {
  // Core validation functions
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhone,
  validateName,
  validateDateOfBirth,
  validateRole,
  validateUUID, // PostgreSQL UUID validation
  validateCourseCode,
  validateGrade,

  // Utility functions
  sanitizeInput,
  validateRegistrationData,
  validateBulk,
  compareDates,
  formatValidationError,
  getErrorFieldName,

  // Express middleware
  registrationValidators,
  loginValidators,
  passwordResetValidators,
  postgreSQLValidators,
  validatePagination,
  handleValidationErrors,
};

/*
USAGE EXAMPLES:

// Express route with validation
import { registrationValidators, handleValidationErrors, validateRegistrationData } from './utils/validators.js';

app.post('/api/auth/register', 
  registrationValidators, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      // Additional server-side validation
      const { isValid, errors, sanitized } = validateRegistrationData(req.body);
      
      if (!isValid) {
        return res.status(400).json({ 
          success: false, 
          message: 'Registration failed', 
          errors 
        });
      }
      
      // Use sanitized data for database insertion
      const newUser = await createUserInDatabase(sanitized);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: newUser
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// PostgreSQL-specific validation
app.post('/api/courses', 
  postgreSQLValidators.validateCourse,
  handleValidationErrors,
  async (req, res) => {
    // Course creation logic
  }
);

// Type-safe date validation
try {
  const isValidAge = validateDateOfBirth('1990-01-01');
  console.log('Date is valid:', isValidAge);
} catch (error) {
  console.error('Date validation failed:', error.message);
}
*/
