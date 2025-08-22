// shared/validation-rules.js - Unified validation for client and server

/**
 * UNIFIED VALIDATION RULES
 * These rules are the single source of truth for both client and server
 * Updated for PostgreSQL (Supabase) compatibility
 */

export const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    normalize: true, // Convert to lowercase
    message: "Please provide a valid email address",
  },

  password: {
    required: true,
    minLength: 8,
    pattern:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message:
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)",
  },

  username: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9]([a-zA-Z0-9._]){1,28}[a-zA-Z0-9]$/,
    message:
      "Username: 3-30 characters, letters/numbers/dots/underscores, cannot start/end with dot/underscore",
  },

  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]{2,100}$/,
    message: "Name: 2-100 characters, letters/spaces/apostrophes/hyphens only",
  },

  phone: {
    required: false,
    pattern: /^\+?[\d\s\-\(\)]{10,15}$/,
    message:
      "Phone: 10-15 characters, numbers/spaces/hyphens/parentheses, optional + prefix",
  },

  role: {
    required: true,
    enum: ["student", "teacher", "admin", "parent"],
    default: "student",
    message: "Role must be: student, teacher, admin, or parent",
  },

  dateOfBirth: {
    required: false,
    type: "date",
    minAge: 5,
    maxAge: 150,
    message: "Please provide a valid date of birth (age 5-150)",
  },

  // PostgreSQL-specific validations
  id: {
    required: false,
    type: "uuid",
    pattern:
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    message: "Invalid ID format",
  },

  // School-specific validations
  courseCode: {
    required: false,
    pattern: /^[A-Z]{2,4}[0-9]{3,4}$/,
    message:
      "Course code format: 2-4 letters followed by 3-4 numbers (e.g., CS101, MATH2001)",
  },

  grade: {
    required: false,
    enum: [
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
    ],
    message: "Invalid grade",
  },

  percentage: {
    required: false,
    type: "number",
    min: 0,
    max: 100,
    message: "Percentage must be between 0 and 100",
  },
};

/**
 * Sanitize input string (server-side security)
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";

  return input
    .trim()
    .replace(/[<>\"'&]/g, "") // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
};

/**
 * Validate individual field
 */
export const validateField = (fieldName, value, customRules = null) => {
  const rules = customRules || VALIDATION_RULES[fieldName];
  if (!rules) {
    return { isValid: true, errors: [] };
  }

  const errors = [];

  // Check required
  if (
    rules.required &&
    (!value || (typeof value === "string" && value.trim() === ""))
  ) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return { isValid: true, errors: [] };
  }

  const trimmedValue = typeof value === "string" ? value.trim() : value;

  // Type validation
  if (rules.type === "date") {
    const dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) {
      errors.push(rules.message || `${fieldName} must be a valid date`);
    } else if (rules.minAge || rules.maxAge) {
      const now = new Date();
      const age = now.getFullYear() - dateObj.getFullYear();
      if (rules.minAge && age < rules.minAge) {
        errors.push(`Minimum age is ${rules.minAge} years`);
      }
      if (rules.maxAge && age > rules.maxAge) {
        errors.push(`Maximum age is ${rules.maxAge} years`);
      }
    }
  }

  if (rules.type === "number") {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push(`${fieldName} must be a number`);
    } else {
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push(`${fieldName} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push(`${fieldName} must be no more than ${rules.max}`);
      }
    }
  }

  // String validations
  if (typeof trimmedValue === "string") {
    // Length validation
    if (rules.minLength && trimmedValue.length < rules.minLength) {
      errors.push(
        `${fieldName} must be at least ${rules.minLength} characters`
      );
    }

    if (rules.maxLength && trimmedValue.length > rules.maxLength) {
      errors.push(
        `${fieldName} must be no more than ${rules.maxLength} characters`
      );
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(trimmedValue)) {
      errors.push(rules.message || `${fieldName} format is invalid`);
    }
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(trimmedValue)) {
    errors.push(
      rules.message || `${fieldName} must be one of: ${rules.enum.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized:
      typeof trimmedValue === "string"
        ? sanitizeInput(trimmedValue)
        : trimmedValue,
  };
};

/**
 * Validate entire form/object
 */
export const validateForm = (data, fieldsToValidate = null) => {
  const fields = fieldsToValidate || Object.keys(data);
  const errors = {};
  const sanitized = {};
  let isValid = true;

  fields.forEach((fieldName) => {
    const result = validateField(fieldName, data[fieldName]);

    if (!result.isValid) {
      errors[fieldName] = result.errors;
      isValid = false;
    }

    if (result.sanitized !== undefined) {
      sanitized[fieldName] = result.sanitized;
    } else if (data[fieldName] !== undefined) {
      sanitized[fieldName] = data[fieldName];
    }
  });

  return { isValid, errors, sanitized };
};

/**
 * CLIENT-SIDE: Individual validation functions for backward compatibility
 */
export const validateEmail = (email) => {
  const result = validateField("email", email);
  return result.isValid;
};

export const validatePassword = (password) => {
  const result = validateField("password", password);
  return result.isValid;
};

export const validateUsername = (username) => {
  const result = validateField("username", username);
  return result.isValid;
};

export const validatePhone = (phone) => {
  const result = validateField("phone", phone);
  return result.isValid;
};

export const validateName = (name) => {
  const result = validateField("name", name);
  return result.isValid;
};

export const validateDateOfBirth = (dateOfBirth) => {
  const result = validateField("dateOfBirth", dateOfBirth);
  return result.isValid;
};

export const validateRole = (role) => {
  const result = validateField("role", role);
  return result.isValid;
};

// PostgreSQL-specific validators
export const validateUUID = (id) => {
  const result = validateField("id", id);
  return result.isValid;
};

export const validateCourseCode = (code) => {
  const result = validateField("courseCode", code);
  return result.isValid;
};

export const validateGrade = (grade) => {
  const result = validateField("grade", grade);
  return result.isValid;
};

export const validatePercentage = (percentage) => {
  const result = validateField("percentage", percentage);
  return result.isValid;
};

/**
 * SERVER-SIDE: Express validator middleware creator
 */
export const createExpressValidators = (fields) => {
  // This function would be used server-side with express-validator
  if (typeof window === "undefined") {
    try {
      const { body } = require("express-validator");

      return fields
        .map((fieldName) => {
          const rules = VALIDATION_RULES[fieldName];
          if (!rules) return null;

          let validator = body(fieldName);

          if (rules.required) {
            validator = validator
              .notEmpty()
              .withMessage(`${fieldName} is required`);
          } else {
            validator = validator.optional();
          }

          if (rules.minLength) {
            validator = validator.isLength({ min: rules.minLength });
          }

          if (rules.maxLength) {
            validator = validator.isLength({ max: rules.maxLength });
          }

          if (rules.pattern) {
            validator = validator.matches(rules.pattern);
          }

          if (rules.enum) {
            validator = validator.isIn(rules.enum);
          }

          if (rules.normalize) {
            validator = validator.normalizeEmail();
          }

          return validator.withMessage(rules.message);
        })
        .filter(Boolean);
    } catch (error) {
      console.warn("express-validator not available:", error.message);
      return [];
    }
  }
  return [];
};

/**
 * SERVER-SIDE: Registration data validation
 */
export const validateRegistrationData = (userData) => {
  const requiredFields = ["email", "password", "name"];
  const result = validateForm(userData, requiredFields);

  // Add role default if not provided
  if (!userData.role) {
    result.sanitized.role = "student";
  }

  return {
    isValid: result.isValid,
    errors: result.errors,
    sanitized: result.sanitized,
  };
};

/**
 * Utility: Get validation rules for a field (useful for dynamic forms)
 */
export const getFieldRules = (fieldName) => {
  return VALIDATION_RULES[fieldName] || null;
};

/**
 * Utility: Get all available validation fields
 */
export const getAvailableFields = () => {
  return Object.keys(VALIDATION_RULES);
};

// Default export for backward compatibility
export default {
  // Validation functions
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhone,
  validateName,
  validateDateOfBirth,
  validateRole,
  validateUUID,
  validateCourseCode,
  validateGrade,
  validatePercentage,

  // Form validation
  validateField,
  validateForm,
  validateRegistrationData,

  // Utilities
  sanitizeInput,
  createExpressValidators,
  getFieldRules,
  getAvailableFields,

  // Constants
  VALIDATION_RULES,
};

/*
USAGE EXAMPLES:

// CLIENT-SIDE (React):
import { validateField, validateForm, validateEmail } from './shared/validation-rules.js';

// Real-time validation
const handleEmailChange = (email) => {
  const result = validateField('email', email);
  setEmailErrors(result.errors);
};

// Form submission
const handleSubmit = (formData) => {
  const { isValid, errors, sanitized } = validateForm(formData, ['email', 'password', 'name']);
  if (!isValid) {
    setFormErrors(errors);
    return;
  }
  // Submit sanitized data
  submitForm(sanitized);
};

// SERVER-SIDE (Express):
import { createExpressValidators, validateRegistrationData, handleValidationErrors } from './shared/validation-rules.js';

// Middleware
const registerValidators = createExpressValidators(['email', 'password', 'name']);

// Route with validation
app.post('/api/auth/register', registerValidators, (req, res) => {
  const { isValid, errors, sanitized } = validateRegistrationData(req.body);
  
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }
  
  // Use sanitized data for database insertion
  createUser(sanitized);
});
*/
