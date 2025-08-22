// shared/constants.js - Shared constants used by both client and server

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
 * Role-based permissions mapping - Complete and consistent
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
    // Class and student management
    PERMISSIONS.READ_USER, // Can view student profiles
    PERMISSIONS.UPDATE_USER, // Can update student info in their classes

    PERMISSIONS.READ_CLASS,
    PERMISSIONS.UPDATE_CLASS, // Can update their own classes
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
    // Limited access - mostly read-only
    PERMISSIONS.READ_USER, // Can view own profile
    PERMISSIONS.UPDATE_USER, // Can update own profile

    PERMISSIONS.READ_CLASS, // Can view enrolled classes
    PERMISSIONS.VIEW_COURSE, // Can view course details
    PERMISSIONS.READ_ASSIGNMENT, // Can view assignments
    PERMISSIONS.READ_GRADE, // Can view own grades
    PERMISSIONS.VIEW_ATTENDANCE, // Can view own attendance

    PERMISSIONS.VIEW_PAYMENT, // Can view own payment history
  ],

  [ROLES.PARENT]: [
    // Can view child's information
    PERMISSIONS.READ_USER, // Can view child's profile
    PERMISSIONS.READ_CLASS, // Can view child's classes
    PERMISSIONS.VIEW_COURSE, // Can view child's courses
    PERMISSIONS.READ_ASSIGNMENT, // Can view child's assignments
    PERMISSIONS.READ_GRADE, // Can view child's grades
    PERMISSIONS.VIEW_ATTENDANCE, // Can view child's attendance
    PERMISSIONS.VIEW_PAYMENT, // Can view payment history
    PERMISSIONS.VIEW_REPORTS, // Can view child's reports
  ],
};

/**
 * Status constants used throughout the application
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
 * Assignment types - Used in both UI dropdowns and server validation
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
 * Assignment statuses - For assignment lifecycle management
 */
export const ASSIGNMENT_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CLOSED: "closed",
  ARCHIVED: "archived",
};

/**
 * Submission statuses - For tracking student submissions
 */
export const SUBMISSION_STATUSES = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  GRADED: "graded",
  RETURNED: "returned",
  LATE: "late",
};

/**
 * Attendance statuses - For daily attendance tracking
 */
export const ATTENDANCE_STATUSES = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  EXCUSED: "excused",
};

/**
 * Payment statuses - For financial management
 */
export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

/**
 * Payment types - Categories of payments
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
 * Grade levels - Academic year classifications
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
 * Academic terms - School year divisions
 */
export const ACADEMIC_TERMS = {
  FIRST: "first",
  SECOND: "second",
  THIRD: "third",
  SUMMER: "summer",
};

/**
 * Academic constants - Grading and assessment
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
 * Notification types - For system notifications
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
 * Validation rules - Consistent across client and server
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
 * File upload constants - RECONCILED TO RESOLVE CONFLICTS
 */
export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB - Server limit (was inconsistent)
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
 * Regex patterns - For validation across client and server
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
 * Time constants - School scheduling
 */
export const TIME_CONSTANTS = {
  SCHOOL_START_HOUR: 8,
  SCHOOL_END_HOUR: 17,
  CLASS_DURATION_MINUTES: 50,
  BREAK_DURATION_MINUTES: 10,
  SESSION_TIMEOUT_MINUTES: 60,
};

/**
 * Pagination defaults - For data display
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

/**
 * API response messages - For consistent messaging
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

// Default export with all shared constants
export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  STATUS,
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
  REGEX_PATTERNS,
  TIME_CONSTANTS,
  PAGINATION,
  RESPONSE_MESSAGES,
};
