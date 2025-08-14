// src/utils/constants.js

/**
 * @typedef {Object} ValidationRules
 * @property {number} NAME_MIN_LENGTH - Minimum length for names
 * @property {number} NAME_MAX_LENGTH - Maximum length for names
 * @property {number} PASSWORD_MIN_LENGTH - Minimum password length
 * @property {number} CODE_LENGTH - Required length for codes
 * @property {number} PHONE_MIN_LENGTH - Minimum phone number length
 * @property {number} PHONE_MAX_LENGTH - Maximum phone number length
 * @property {number} MIN_AGE - Minimum age requirement
 * @property {number} MAX_CREDITS - Maximum credits allowed
 * @property {number} CLASS_SIZE_MIN - Minimum class size
 * @property {number} CLASS_SIZE_MAX - Maximum class size
 */
export const VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  CODE_LENGTH: 6,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  MIN_AGE: 13,
  MAX_CREDITS: 30,
  CLASS_SIZE_MIN: 5,
  CLASS_SIZE_MAX: 50,
  FILE_SIZE_MAX: 5 * 1024 * 1024, // 5MB
  DESCRIPTION_MAX_LENGTH: 500,
};

/**
 * @typedef {Object} TimeConstants
 */
export const TIME_CONSTANTS = {
  SCHOOL_START_HOUR: 8,
  SCHOOL_END_HOUR: 17,
  CLASS_DURATION_MINUTES: 50,
  BREAK_DURATION_MINUTES: 10,
  SESSION_TIMEOUT_MINUTES: 60,
  TOKEN_EXPIRY: {
    ACCESS: "15m",
    REFRESH: "7d",
    RESET: "1h",
    VERIFICATION: "24h",
  },
};

/**
 * @typedef {Object} RegexPatterns
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-]{10,15}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
  CODE: /^[A-Z0-9]{6}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  COURSE_CODE: /^[A-Z]{2,4}[0-9]{3,4}$/,
};

// Existing ROLES definition
export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
};

// Existing PERMISSIONS with additions
export const PERMISSIONS = {
  // User Management
  CREATE_USER: "create_user",
  UPDATE_USER: "update_user",
  DELETE_USER: "delete_user",
  VIEW_USER: "view_user",

  // Course Management
  CREATE_COURSE: "create_course",
  UPDATE_COURSE: "update_course",
  DELETE_COURSE: "delete_course",
  VIEW_COURSE: "view_course",

  // Assignment Management
  CREATE_ASSIGNMENT: "create_assignment",
  UPDATE_ASSIGNMENT: "update_assignment",
  DELETE_ASSIGNMENT: "delete_assignment",
  VIEW_ASSIGNMENT: "view_assignment",
  GRADE_ASSIGNMENT: "grade_assignment",

  // Attendance Management
  MARK_ATTENDANCE: "mark_attendance",
  VIEW_ATTENDANCE: "view_attendance",
  UPDATE_ATTENDANCE: "update_attendance",

  // Grade Management
  CREATE_GRADE: "create_grade",
  UPDATE_GRADE: "update_grade",
  VIEW_GRADE: "view_grade",
  DELETE_GRADE: "delete_grade",

  // Payment Management
  MANAGE_PAYMENTS: "manage_payments",
  VIEW_PAYMENTS: "view_payments",
  PROCESS_REFUNDS: "process_refunds",
};

// Existing ROLE_PERMISSIONS
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.TEACHER]: [
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.VIEW_COURSE,
    PERMISSIONS.CREATE_ASSIGNMENT,
    PERMISSIONS.UPDATE_ASSIGNMENT,
    PERMISSIONS.DELETE_ASSIGNMENT,
    PERMISSIONS.VIEW_ASSIGNMENT,
    PERMISSIONS.GRADE_ASSIGNMENT,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.UPDATE_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.CREATE_GRADE,
    PERMISSIONS.UPDATE_GRADE,
    PERMISSIONS.VIEW_GRADE,
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.VIEW_COURSE,
    PERMISSIONS.VIEW_ASSIGNMENT,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_GRADE,
  ],
  [ROLES.PARENT]: [
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_GRADE,
    PERMISSIONS.VIEW_PAYMENTS,
  ],
};

export const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  SUSPENDED: "suspended",
  ARCHIVED: "archived",
};

// Academic constants
export const ACADEMIC_CONSTANTS = {
  TERMS: ["FIRST", "SECOND", "THIRD"],
  GRADE_TYPES: ["assignment", "quiz", "exam", "project", "midterm", "final"],
  GRADE_SCALE: {
    "A+": { min: 97, max: 100 },
    A: { min: 93, max: 96 },
    "A-": { min: 90, max: 92 },
    "B+": { min: 87, max: 89 },
    B: { min: 83, max: 86 },
    "B-": { min: 80, max: 82 },
    "C+": { min: 77, max: 79 },
    C: { min: 73, max: 76 },
    "C-": { min: 70, max: 72 },
    "D+": { min: 67, max: 69 },
    D: { min: 63, max: 66 },
    "D-": { min: 60, max: 62 },
    F: { min: 0, max: 59 },
  },
  PASSING_GRADE: 60,
};

// File upload constants
export const FILE_CONSTANTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  UPLOAD_PATH: "uploads/",
};

export default {
  VALIDATION_RULES,
  TIME_CONSTANTS,
  REGEX_PATTERNS,
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  STATUS,
  ACADEMIC_CONSTANTS,
  FILE_CONSTANTS,
};
