// src/utils/validators.js

import { VALIDATION_RULES, REGEX_PATTERNS } from "./constants.js";

/**
 * Email validation
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password validation
 * Requires:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password meets requirements
 */
export const validatePassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Phone number validation
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if phone number is valid
 */
const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Username validation
 * Allows letters, numbers, and underscores, 3-30 characters
 * @param {string} username - Username to validate
 * @returns {boolean} - True if username is valid
 */
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

/**
 * Date validation
 * @param {Date|string|number} date - Date to validate
 * @returns {boolean} - True if date is valid
 */
const validateDate = (date) => {
  // Convert to Date object if not already
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

/**
 * Future date validation
 * @param {Date|string|number} date - Date to validate
 * @returns {boolean} - True if date is in the future
 */
const validateFutureDate = (date) => {
  if (!validateDate(date)) return false;

  // Convert both dates to timestamps for comparison
  const dateTimestamp = (
    date instanceof Date ? date : new Date(date)
  ).getTime();
  const nowTimestamp = new Date().getTime();

  return dateTimestamp > nowTimestamp;
};
/**
 * Number range validation
 * @param {number} number - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} - True if number is within range
 */
const validateNumberRange = (number, min, max) => {
  return number >= min && number <= max;
};

/**
 * String length validation
 * @param {string} str - String to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} - True if string length is within range
 */
const validateStringLength = (str, minLength, maxLength) => {
  return str.length >= minLength && str.length <= maxLength;
};

/**
 * File size validation
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {boolean} - True if file size is within limit
 */
const validateFileSize = (fileSize, maxSize) => {
  return fileSize <= maxSize;
};

/**
 * File type validation
 * @param {string} fileType - MIME type of the file
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if file type is allowed
 */
const validateFileType = (fileType, allowedTypes) => {
  return allowedTypes.includes(fileType);
};

/**
 * URL validation
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * MongoDB ObjectId validation
 * @param {string} id - ObjectId to validate
 * @returns {boolean} - True if ObjectId is valid
 */
const validateObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Array length validation
 * @param {Array} array - Array to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} - True if array length is within range
 */
const validateArrayLength = (array, minLength, maxLength) => {
  return array.length >= minLength && array.length <= maxLength;
};

/**
 * Time format validation (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {boolean} - True if time format is valid
 */
const validateTimeFormat = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Grade validation
 * @param {string} grade - Grade to validate
 * @returns {boolean} - True if grade is valid
 */
const validateGrade = (grade) => {
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
 * Percentage validation (0-100)
 * @param {number} value - Percentage value to validate
 * @returns {boolean} - True if percentage is valid
 */
const validatePercentage = (value) => {
  return validateNumberRange(value, 0, 100);
};

/**
 * Course code validation (e.g., CS101, MATH2001)
 * @param {string} code - Course code to validate
 * @returns {boolean} - True if course code is valid
 */
const validateCourseCode = (code) => {
  const courseCodeRegex = /^[A-Z]{2,4}[0-9]{3,4}$/;
  return courseCodeRegex.test(code);
};

/**
 * Creates a validation schema for form validation
 * @param {Object} fields - Field validation rules
 * @returns {Function} - Validation function
 */
export const createValidationSchema = (fields) => {
  return (data) => {
    const errors = {};

    for (const [field, rules] of Object.entries(fields)) {
      const value = data[field];

      if (rules.required && !value) {
        errors[field] = `${field} is required`;
        continue;
      }

      if (value) {
        if (rules.minLength && value.length < rules.minLength) {
          errors[
            field
          ] = `${field} must be at least ${rules.minLength} characters`;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors[
            field
          ] = `${field} must be no more than ${rules.maxLength} characters`;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors[field] = `${field} format is invalid`;
        }

        if (rules.validate) {
          const validationError = rules.validate(value, data);
          if (validationError) {
            errors[field] = validationError;
          }
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };
};

// Export all validators as individual functions and as a default object
export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateUsername,
  validateDate,
  validateFutureDate,
  validateNumberRange,
  validateStringLength,
  validateFileSize,
  validateFileType,
  validateUrl,
  validateObjectId,
  validateArrayLength,
  validateTimeFormat,
  validateGrade,
  validatePercentage,
  validateCourseCode,
  createValidationSchema,
};
