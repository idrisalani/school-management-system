// server/src/utils/constants.js - All Constants Internal (Fixed)

/**
 * User roles - Used across the entire application
 */
export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
};

/**
 * Comprehensive permissions system
 */
export const PERMISSIONS = {
  // User Management
  CREATE_USER: "create_user",
  READ_USER: "read_user",
  UPDATE_USER: "update_user",
  DELETE_USER: "delete_user",
  MANAGE_USERS: "manage_users",

  // Class Management
  CREATE_CLASS: "create_class",
  READ_CLASS: "read_class",
  UPDATE_CLASS: "update_class",
  DELETE_CLASS: "delete_class",
  MANAGE_CLASSES: "manage_classes",

  // Course Management
  CREATE_COURSE: "create_course",
  UPDATE_COURSE: "update_course",
  DELETE_COURSE: "delete_course",
  VIEW_COURSE: "view_course",

  // Assignment Management
  CREATE_ASSIGNMENT: "create_assignment",
  READ_ASSIGNMENT: "read_assignment",
  UPDATE_ASSIGNMENT: "update_assignment",
  DELETE_ASSIGNMENT: "delete_assignment",
  GRADE_ASSIGNMENT: "grade_assignment",

  // Grade Management
  CREATE_GRADE: "create_grade",
  READ_GRADE: "read_grade",
  UPDATE_GRADE: "update_grade",
  DELETE_GRADE: "delete_grade",
  VIEW_ALL_GRADES: "view_all_grades",

  // Attendance Management
  MARK_ATTENDANCE: "mark_attendance",
  VIEW_ATTENDANCE: "view_attendance",
  MANAGE_ATTENDANCE: "manage_attendance",
  UPDATE_ATTENDANCE: "update_attendance",

  // Payment Management
  CREATE_PAYMENT: "create_payment",
  VIEW_PAYMENT: "view_payment",
  MANAGE_PAYMENTS: "manage_payments",
  PROCESS_REFUNDS: "process_refunds",

  // Reports
  VIEW_REPORTS: "view_reports",
  GENERATE_REPORTS: "generate_reports",

  // System Administration
  SYSTEM_CONFIG: "system_config",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  MANAGE_SYSTEM: "manage_system",
};

/**
 * Role-based permissions mapping
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Full system access
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,

    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.CREATE_CLASS,
    PERMISSIONS.READ_CLASS,
    PERMISSIONS.UPDATE_CLASS,
    PERMISSIONS.DELETE_CLASS,

    PERMISSIONS.CREATE_COURSE,
    PERMISSIONS.UPDATE_COURSE,
    PERMISSIONS.DELETE_COURSE,
    PERMISSIONS.VIEW_COURSE,

    PERMISSIONS.CREATE_ASSIGNMENT,
    PERMISSIONS.READ_ASSIGNMENT,
    PERMISSIONS.UPDATE_ASSIGNMENT,
    PERMISSIONS.DELETE_ASSIGNMENT,
    PERMISSIONS.GRADE_ASSIGNMENT,

    PERMISSIONS.CREATE_GRADE,
    PERMISSIONS.READ_GRADE,
    PERMISSIONS.UPDATE_GRADE,
    PERMISSIONS.DELETE_GRADE,
    PERMISSIONS.VIEW_ALL_GRADES,

    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.UPDATE_ATTENDANCE,

    PERMISSIONS.CREATE_PAYMENT,
    PERMISSIONS.VIEW_PAYMENT,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.PROCESS_REFUNDS,

    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,

    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_SYSTEM,
  ],

  [ROLES.TEACHER]: [
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.READ_CLASS,
    PERMISSIONS.UPDATE_CLASS,
    PERMISSIONS.VIEW_COURSE,
    PERMISSIONS.CREATE_ASSIGNMENT,
    PERMISSIONS.READ_ASSIGNMENT,
    PERMISSIONS.UPDATE_ASSIGNMENT,
    PERMISSIONS.DELETE_ASSIGNMENT,
    PERMISSIONS.GRADE_ASSIGNMENT,
    PERMISSIONS.CREATE_GRADE,
    PERMISSIONS.READ_GRADE,
    PERMISSIONS.UPDATE_GRADE,
    PERMISSIONS.DELETE_GRADE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.UPDATE_ATTENDANCE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
  ],

  [ROLES.STUDENT]: [
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.READ_CLASS,
    PERMISSIONS.VIEW_COURSE,
    PERMISSIONS.READ_ASSIGNMENT,
    PERMISSIONS.READ_GRADE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_PAYMENT,
  ],

  [ROLES.PARENT]: [
    PERMISSIONS.READ_USER,
    PERMISSIONS.READ_CLASS,
    PERMISSIONS.VIEW_COURSE,
    PERMISSIONS.READ_ASSIGNMENT,
    PERMISSIONS.READ_GRADE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_PAYMENT,
    PERMISSIONS.VIEW_REPORTS,
  ],
};

/**
 * Status constants
 */
export const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  SUSPENDED: "suspended",
  ARCHIVED: "archived",
};

/**
 * Assignment types
 */
export const ASSIGNMENT_TYPES = {
  HOMEWORK: "homework",
  QUIZ: "quiz",
  EXAM: "exam",
  PROJECT: "project",
  LAB: "lab",
  PRESENTATION: "presentation",
  ESSAY: "essay",
};

/**
 * Assignment statuses
 */
export const ASSIGNMENT_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CLOSED: "closed",
  ARCHIVED: "archived",
};

/**
 * Submission statuses
 */
export const SUBMISSION_STATUSES = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  GRADED: "graded",
  RETURNED: "returned",
  LATE: "late",
};

/**
 * Attendance statuses
 */
export const ATTENDANCE_STATUSES = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  EXCUSED: "excused",
};

/**
 * Payment statuses
 */
export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

/**
 * Payment types
 */
export const PAYMENT_TYPES = {
  TUITION: "tuition",
  FEES: "fees",
  BOOKS: "books",
  TRANSPORT: "transport",
  MEALS: "meals",
  ACTIVITIES: "activities",
  OTHER: "other",
};

/**
 * Grade levels
 */
export const GRADE_LEVELS = {
  KINDERGARTEN: "kindergarten",
  GRADE_1: "grade_1",
  GRADE_2: "grade_2",
  GRADE_3: "grade_3",
  GRADE_4: "grade_4",
  GRADE_5: "grade_5",
  GRADE_6: "grade_6",
  GRADE_7: "grade_7",
  GRADE_8: "grade_8",
  GRADE_9: "grade_9",
  GRADE_10: "grade_10",
  GRADE_11: "grade_11",
  GRADE_12: "grade_12",
};

/**
 * Academic terms
 */
export const ACADEMIC_TERMS = {
  FIRST: "first",
  SECOND: "second",
  THIRD: "third",
  SUMMER: "summer",
};

/**
 * Academic constants
 */
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

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  ASSIGNMENT_DUE: "assignment_due",
  GRADE_POSTED: "grade_posted",
  ATTENDANCE_MARKED: "attendance_marked",
  PAYMENT_DUE: "payment_due",
  ANNOUNCEMENT: "announcement",
  SYSTEM: "system",
};

/**
 * Validation rules
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
  DESCRIPTION_MAX_LENGTH: 500,
};

/**
 * File upload constants
 */
export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 5,
  ALLOWED_EXTENSIONS: [
    "pdf",
    "doc",
    "docx",
    "txt",
    "rtf",
    "jpg",
    "jpeg",
    "png",
    "gif",
    "mp4",
    "mov",
    "avi",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
  ],
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

/**
 * Regex patterns
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-]{10,15}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
  CODE: /^[A-Z0-9]{6}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  COURSE_CODE: /^[A-Z]{2,4}[0-9]{3,4}$/,
};

/**
 * Time constants
 */
export const TIME_CONSTANTS = {
  SCHOOL_START_HOUR: 8,
  SCHOOL_END_HOUR: 17,
  CLASS_DURATION_MINUTES: 50,
  BREAK_DURATION_MINUTES: 10,
  SESSION_TIMEOUT_MINUTES: 60,
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

/**
 * API response messages
 */
export const RESPONSE_MESSAGES = {
  SUCCESS: {
    LOGIN: "Login successful",
    LOGOUT: "Logout successful",
    REGISTER: "Registration successful",
    PASSWORD_RESET: "Password reset successful",
    EMAIL_VERIFIED: "Email verified successfully",
    PROFILE_UPDATED: "Profile updated successfully",
    PASSWORD_CHANGED: "Password changed successfully",
  },
  ERROR: {
    INVALID_CREDENTIALS: "Invalid credentials",
    EMAIL_NOT_VERIFIED: "Email not verified",
    TOKEN_EXPIRED: "Token has expired",
    INVALID_TOKEN: "Invalid token",
    USER_NOT_FOUND: "User not found",
    EMAIL_ALREADY_EXISTS: "Email already exists",
    USERNAME_ALREADY_EXISTS: "Username already exists",
    WEAK_PASSWORD: "Password does not meet requirements",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Insufficient permissions",
    NOT_FOUND: "Resource not found",
    VALIDATION_ERROR: "Validation failed",
    INTERNAL_ERROR: "Internal server error",
  },
};

/**
 * SERVER-SPECIFIC CONSTANTS
 */

/**
 * Class statuses
 */
export const CLASS_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

/**
 * Rate limiting configurations
 */
export const RATE_LIMITS = {
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per window
  },
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per window
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
};

/**
 * JWT token expiration times
 */
export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: "15m",
  REFRESH_TOKEN: "7d",
  VERIFICATION_TOKEN: "24h",
  RESET_TOKEN: "1h",
};

/**
 * Database table names
 */
export const TABLES = {
  USERS: "users",
  CLASSES: "classes",
  ASSIGNMENTS: "assignments",
  SUBMISSIONS: "submissions",
  GRADES: "grades",
  ATTENDANCE: "attendance",
  PAYMENTS: "payments",
  ENROLLMENTS: "enrollments",
  DEPARTMENTS: "departments",
  AUDITS: "audits",
  SCHEDULES: "schedules",
  ANNOUNCEMENTS: "announcements",
};

/**
 * Environment types
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
  TEST: "test",
};

/**
 * Log levels
 */
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

/**
 * Database connection settings
 */
export const DATABASE_CONFIG = {
  POOL_MIN: 2,
  POOL_MAX: 10,
  ACQUIRE_TIMEOUT: 60000,
  IDLE_TIMEOUT: 30000,
  CONNECTION_LIMIT: 100,
};

/**
 * Server security settings
 */
export const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 30 * 60 * 1000, // 30 minutes
  PASSWORD_RESET_TIMEOUT: 60 * 60 * 1000, // 1 hour
  SESSION_SECRET_LENGTH: 64,
  CORS_ORIGINS: [
    "http://localhost:3000",
    "https://school-management-system-668kkjtnr-schoolms.vercel.app",
  ],
};

/**
 * Audit log events
 */
export const AUDIT_EVENTS = {
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  ASSIGNMENT_CREATED: "assignment_created",
  ASSIGNMENT_UPDATED: "assignment_updated",
  ASSIGNMENT_DELETED: "assignment_deleted",
  GRADE_CREATED: "grade_created",
  GRADE_UPDATED: "grade_updated",
  PAYMENT_PROCESSED: "payment_processed",
  ATTENDANCE_MARKED: "attendance_marked",
  SYSTEM_ERROR: "system_error",
};

// Re-export with backward compatibility names
export const USER_STATUSES = STATUS;
export const FILE_LIMITS = FILE_CONSTANTS;

// Default export
export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  STATUS,
  USER_STATUSES: STATUS,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_STATUSES,
  SUBMISSION_STATUSES,
  ATTENDANCE_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  GRADE_LEVELS,
  ACADEMIC_TERMS,
  ACADEMIC_CONSTANTS,
  NOTIFICATION_TYPES,
  VALIDATION_RULES,
  FILE_CONSTANTS,
  FILE_LIMITS: FILE_CONSTANTS,
  REGEX_PATTERNS,
  TIME_CONSTANTS,
  PAGINATION,
  RESPONSE_MESSAGES,
  CLASS_STATUSES,
  RATE_LIMITS,
  TOKEN_EXPIRATION,
  TABLES,
  ENVIRONMENTS,
  LOG_LEVELS,
  DATABASE_CONFIG,
  SECURITY_CONFIG,
  AUDIT_EVENTS,
};
