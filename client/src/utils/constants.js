// client/src/utils/constants.js - Reconciled Version
// ✅ KEEPING YOUR EXCELLENT EXISTING STRUCTURE + Adding missing exports for validators

/**
 * User roles and permissions - Enhanced for server compatibility
 * ✅ KEEPING EXISTING EXCELLENT STRUCTURE
 */
export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
};

// Keep existing simple permissions (working well) + add detailed ones for server compatibility
export const PERMISSIONS = {
  // User management - Simple (existing)
  MANAGE_USERS: "manage_users",
  VIEW_USERS: "view_users",

  // User management - Detailed (for server compatibility)
  CREATE_USER: "create_user",
  READ_USER: "read_user",
  UPDATE_USER: "update_user",
  DELETE_USER: "delete_user",

  // Class management
  MANAGE_CLASSES: "manage_classes",
  VIEW_CLASSES: "view_classes",
  CREATE_CLASS: "create_class",
  READ_CLASS: "read_class",
  UPDATE_CLASS: "update_class",
  DELETE_CLASS: "delete_class",

  // Assignment management
  CREATE_ASSIGNMENTS: "create_assignments",
  GRADE_ASSIGNMENTS: "grade_assignments",
  SUBMIT_ASSIGNMENTS: "submit_assignments",
  VIEW_ASSIGNMENTS: "view_assignments",
  READ_ASSIGNMENT: "read_assignment",
  UPDATE_ASSIGNMENT: "update_assignment",
  DELETE_ASSIGNMENT: "delete_assignment",
  GRADE_ASSIGNMENT: "grade_assignment",

  // Attendance management
  MARK_ATTENDANCE: "mark_attendance",
  VIEW_ATTENDANCE: "view_attendance",
  MANAGE_ATTENDANCE: "manage_attendance",
  UPDATE_ATTENDANCE: "update_attendance",

  // Grade management
  MANAGE_GRADES: "manage_grades",
  VIEW_GRADES: "view_grades",
  CREATE_GRADE: "create_grade",
  READ_GRADE: "read_grade",
  UPDATE_GRADE: "update_grade",
  DELETE_GRADE: "delete_grade",
  VIEW_ALL_GRADES: "view_all_grades",

  // Fee/Payment management - Enhanced
  MANAGE_FEES: "manage_fees",
  VIEW_FEES: "view_fees",
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

// Enhanced role permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.TEACHER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.READ_CLASS,
    PERMISSIONS.UPDATE_CLASS,
    PERMISSIONS.CREATE_ASSIGNMENTS,
    PERMISSIONS.GRADE_ASSIGNMENTS,
    PERMISSIONS.VIEW_ASSIGNMENTS,
    PERMISSIONS.CREATE_ASSIGNMENT,
    PERMISSIONS.READ_ASSIGNMENT,
    PERMISSIONS.UPDATE_ASSIGNMENT,
    PERMISSIONS.DELETE_ASSIGNMENT,
    PERMISSIONS.GRADE_ASSIGNMENT,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.UPDATE_ATTENDANCE,
    PERMISSIONS.MANAGE_GRADES,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.CREATE_GRADE,
    PERMISSIONS.READ_GRADE,
    PERMISSIONS.UPDATE_GRADE,
    PERMISSIONS.DELETE_GRADE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.READ_CLASS,
    PERMISSIONS.SUBMIT_ASSIGNMENTS,
    PERMISSIONS.VIEW_ASSIGNMENTS,
    PERMISSIONS.READ_ASSIGNMENT,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.READ_GRADE,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.VIEW_PAYMENT,
  ],
  [ROLES.PARENT]: [
    PERMISSIONS.VIEW_ASSIGNMENTS,
    PERMISSIONS.READ_ASSIGNMENT,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.READ_GRADE,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.VIEW_PAYMENT,
    PERMISSIONS.VIEW_REPORTS,
  ],
};

/**
 * API endpoints - ✅ KEEPING EXISTING EXCELLENT STRUCTURE!
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    VERIFY: "/auth/verify",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  USERS: {
    BASE: "/users",
    BY_ID: (id) => `/users/${id}`,
    PROFILE: (id) => `/users/${id}/profile`,
    ROLES: "/users/roles",
    PREFERENCES: (id) => `/users/${id}/preferences`,
  },
  CLASSES: {
    BASE: "/classes",
    BY_ID: (id) => `/classes/${id}`,
    STUDENTS: (id) => `/classes/${id}/students`,
    TEACHERS: (id) => `/classes/${id}/teachers`,
    ROSTER: (id) => `/classes/${id}/roster`,
    SCHEDULE: (id) => `/classes/${id}/schedule`,
  },
  ASSIGNMENTS: {
    BASE: "/assignments",
    BY_ID: (id) => `/assignments/${id}`,
    SUBMISSIONS: (id) => `/assignments/${id}/submissions`,
    GRADE: (id, submissionId) =>
      `/assignments/${id}/submissions/${submissionId}/grade`,
    SUBMIT: (id) => `/assignments/${id}/submit`,
  },
  ATTENDANCE: {
    BASE: "/attendance",
    BY_CLASS: (id) => `/attendance/class/${id}`,
    BY_STUDENT: (id) => `/attendance/student/${id}`,
    MARK: "/attendance/mark",
    REPORT: "/attendance/report",
  },
  GRADES: {
    BASE: "/grades",
    BY_CLASS: (id) => `/grades/class/${id}`,
    BY_STUDENT: (id) => `/grades/student/${id}`,
    REPORT: (id) => `/grades/student/${id}/report`,
  },
  FEES: {
    BASE: "/fees",
    BY_ID: (id) => `/fees/${id}`,
    BY_STUDENT: (id) => `/fees/student/${id}`,
    PAYMENTS: (id) => `/fees/${id}/payments`,
  },
  PAYMENTS: {
    BASE: "/payments",
    METHODS: "/payments/methods",
    PROCESS: "/payments/process",
    BY_ID: (id) => `/payments/${id}`,
  },
  UPLOAD: {
    FILE: "/upload",
    ASSIGNMENT: "/upload/assignment",
    PROFILE_PICTURE: "/upload/profile-picture",
  },
};

/**
 * Form validation rules - 🔧 UPDATED: Fixed server inconsistencies + ESLint fixes
 */
export const VALIDATION_RULES = {
  // 🆕 ADDED: Core validation constants for validators.js compatibility
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB - consistent with your FILE_UPLOAD
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],

  // Your existing excellent detailed validation rules
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    MESSAGE:
      "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
    // Additional helper constants for validators
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: "Please enter a valid email address",
  },
  PHONE: {
    // 🔧 FIXED: Updated to match server pattern + ESLint fix (removed unnecessary escapes)
    PATTERN: /^[+]?[\d\s\-()]{10,15}$/,
    MESSAGE:
      "Phone: 10-15 characters, numbers/spaces/hyphens/parentheses, optional + prefix",
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s'-]{2,100}$/, // Added pattern for consistency
    MESSAGE: "Name must be between 2 and 50 characters",
  },
  USERNAME: {
    // 🔧 FIXED: Updated to match server pattern (cannot start/end with dot/underscore)
    PATTERN: /^[a-zA-Z0-9]([a-zA-Z0-9._]){1,28}[a-zA-Z0-9]$/,
    MESSAGE:
      "Username: 3-30 characters, letters/numbers/dots/underscores, cannot start/end with dot/underscore",
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
  },
  CODE: {
    LENGTH: 6,
    PATTERN: /^[A-Z0-9]{6}$/,
    MESSAGE: "Code must be 6 uppercase letters and numbers",
  },
  // 🆕 ADDED: PostgreSQL-specific validation (replaces MongoDB ObjectId)
  UUID: {
    PATTERN:
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    MESSAGE: "Invalid ID format",
  },
  // 🆕 ADDED: Course code validation
  COURSE_CODE: {
    PATTERN: /^[A-Z]{2,4}[0-9]{3,4}$/,
    MESSAGE:
      "Course code format: 2-4 letters followed by 3-4 numbers (e.g., CS101, MATH2001)",
  },
  // 🆕 ADDED: Date of birth validation constants
  DATE_OF_BIRTH: {
    MIN_AGE: 5,
    MAX_AGE: 150,
    MESSAGE: "Please provide a valid date of birth (age 5-150)",
  },
};

// 🆕 ADDED: Regex patterns for easier access (referenced by validators)
export const REGEX_PATTERNS = {
  EMAIL: VALIDATION_RULES.EMAIL.PATTERN,
  PASSWORD: VALIDATION_RULES.PASSWORD.PATTERN,
  USERNAME: VALIDATION_RULES.USERNAME.PATTERN,
  PHONE: VALIDATION_RULES.PHONE.PATTERN,
  NAME: VALIDATION_RULES.NAME.PATTERN,
  UUID: VALIDATION_RULES.UUID.PATTERN,
  COURSE_CODE: VALIDATION_RULES.COURSE_CODE.PATTERN,
  TIME_FORMAT: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  // ESLint fix: Removed unnecessary escapes in URL pattern
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
};

// 🆕 ADDED: Valid grades array for validation (keeping your excellent naming + adding validator-expected name)
export const VALID_GRADES = [
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

// 🆕 ADDED: Alias for validators.js compatibility
export const GRADE_VALUES = VALID_GRADES;

// 🆕 ADDED: User roles array for validation
export const VALID_ROLES = Object.values(ROLES);

// 🆕 ADDED: Error messages for consistent UX
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: "This field is required",
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
  INVALID_USERNAME:
    "Username: 3-30 characters, letters/numbers/dots/underscores, cannot start/end with dot/underscore",
  INVALID_PHONE:
    "Phone: 10-15 characters, numbers/spaces/hyphens/parentheses, optional + prefix",
  INVALID_NAME:
    "Name: 2-100 characters, letters/spaces/apostrophes/hyphens only",
  PASSWORDS_DONT_MATCH: "Passwords do not match",
  NETWORK_ERROR: "Network error, please try again",
  SERVER_ERROR: "Server error, please try again later",
  UNAUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: "Resource not found",
};

// 🆕 ADDED: Success messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: "Account created successfully",
  LOGIN_SUCCESS: "Logged in successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",
  EMAIL_SENT: "Email sent successfully",
  DATA_SAVED: "Data saved successfully",
};

/**
 * UI constants - ✅ KEEPING EXISTING EXCELLENT STRUCTURE!
 */
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 50,
  BREAKPOINTS: {
    xs: "320px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  ANIMATION_DURATION: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  TOAST_DURATION: 5000,
  // Added missing UI constants
  THEMES: {
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system",
  },
  COMPONENT_SIZES: {
    SMALL: "sm",
    MEDIUM: "md",
    LARGE: "lg",
    EXTRA_LARGE: "xl",
  },
};

/**
 * Date formats - ✅ KEEPING EXISTING GOOD STRUCTURE
 */
export const DATE_FORMATS = {
  DISPLAY_DATE: "MMM DD, YYYY",
  DISPLAY_TIME: "hh:mm A",
  DISPLAY_DATETIME: "MMM DD, YYYY hh:mm A",
  ISO_DATE: "YYYY-MM-DD",
  ISO_DATETIME: "YYYY-MM-DDTHH:mm:ss.SSSZ",
  // Added more formats
  SHORT: "MM/DD/YYYY",
  LONG: "MMMM DD, YYYY",
  READABLE: "dddd, MMMM DD, YYYY",
};

/**
 * File upload constants - ✅ KEEPING EXISTING + MINOR ENHANCEMENTS
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB - consistent with server
  MAX_FILES_PER_UPLOAD: 5,
  ALLOWED_TYPES: {
    IMAGE: ["image/jpeg", "image/png", "image/gif"],
    DOCUMENT: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    SPREADSHEET: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    PRESENTATION: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },
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
};

/**
 * Academic constants - ✅ KEEPING EXISTING EXCELLENT GPA STRUCTURE + ADDITIONS
 */
export const ACADEMIC = {
  GRADE_SCALE: {
    "A+": { min: 97, max: 100, gpa: 4.0 },
    A: { min: 93, max: 96, gpa: 4.0 },
    "A-": { min: 90, max: 92, gpa: 3.7 },
    "B+": { min: 87, max: 89, gpa: 3.3 },
    B: { min: 83, max: 86, gpa: 3.0 },
    "B-": { min: 80, max: 82, gpa: 2.7 },
    "C+": { min: 77, max: 79, gpa: 2.3 },
    C: { min: 73, max: 76, gpa: 2.0 },
    "C-": { min: 70, max: 72, gpa: 1.7 },
    "D+": { min: 67, max: 69, gpa: 1.3 },
    D: { min: 63, max: 66, gpa: 1.0 },
    "D-": { min: 60, max: 62, gpa: 0.7 },
    F: { min: 0, max: 59, gpa: 0.0 },
  },
  PASSING_GRADE: 60,
  ATTENDANCE_STATUSES: {
    PRESENT: "present",
    ABSENT: "absent",
    LATE: "late",
    EXCUSED: "excused",
  },
  ASSIGNMENT_TYPES: {
    HOMEWORK: "homework",
    PROJECT: "project",
    QUIZ: "quiz",
    TEST: "test",
    EXAM: "exam",
    LAB: "lab",
    PRESENTATION: "presentation",
    ESSAY: "essay",
    OTHER: "other",
  },
  // Added missing academic constants
  ASSIGNMENT_STATUSES: {
    DRAFT: "draft",
    PUBLISHED: "published",
    CLOSED: "closed",
    ARCHIVED: "archived",
  },
  SUBMISSION_STATUSES: {
    PENDING: "pending",
    SUBMITTED: "submitted",
    GRADED: "graded",
    RETURNED: "returned",
    LATE: "late",
  },
  GRADE_LEVELS: {
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
  },
  TERMS: {
    FIRST: "first",
    SECOND: "second",
    THIRD: "third",
    SUMMER: "summer",
  },
};

/**
 * Payment/Fee constants - ✅ KEEPING EXISTING EXCELLENT STRUCTURE
 */
export const PAYMENT = {
  STATUSES: {
    PENDING: "pending",
    PAID: "paid",
    OVERDUE: "overdue",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
  },
  TYPES: {
    TUITION: "tuition",
    FEES: "fees",
    BOOKS: "books",
    TRANSPORT: "transport",
    MEALS: "meals",
    ACTIVITIES: "activities",
    OTHER: "other",
  },
};

/**
 * Status constants - ✅ KEEPING EXISTING
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
 * Notification types - ✅ KEEPING EXISTING
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
 * Client-specific constants - ✅ KEEPING EXISTING EXCELLENT STRUCTURE
 */

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "sms_auth_token",
  REFRESH_TOKEN: "sms_refresh_token",
  USER_PREFERENCES: "sms_user_preferences",
  THEME: "sms_theme",
  LANGUAGE: "sms_language",
  SIDEBAR_COLLAPSED: "sms_sidebar_collapsed",
  RECENT_SEARCHES: "sms_recent_searches",
};

// Application routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",

  // Student routes
  STUDENT_DASHBOARD: "/student/dashboard",
  STUDENT_ASSIGNMENTS: "/student/assignments",
  STUDENT_GRADES: "/student/grades",
  STUDENT_ATTENDANCE: "/student/attendance",
  STUDENT_SCHEDULE: "/student/schedule",

  // Teacher routes
  TEACHER_DASHBOARD: "/teacher/dashboard",
  TEACHER_CLASSES: "/teacher/classes",
  TEACHER_ASSIGNMENTS: "/teacher/assignments",
  TEACHER_GRADING: "/teacher/grading",
  TEACHER_ATTENDANCE: "/teacher/attendance",

  // Admin routes
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_CLASSES: "/admin/classes",
  ADMIN_PAYMENTS: "/admin/payments",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_SETTINGS: "/admin/settings",

  // Parent routes
  PARENT_DASHBOARD: "/parent/dashboard",
  PARENT_CHILDREN: "/parent/children",
  PARENT_PAYMENTS: "/parent/payments",
};

// Modal dialog types
export const MODAL_TYPES = {
  CONFIRMATION: "confirmation",
  CREATE_USER: "create_user",
  EDIT_USER: "edit_user",
  DELETE_USER: "delete_user",
  CREATE_CLASS: "create_class",
  EDIT_CLASS: "edit_class",
  CREATE_ASSIGNMENT: "create_assignment",
  EDIT_ASSIGNMENT: "edit_assignment",
  GRADE_ASSIGNMENT: "grade_assignment",
  VIEW_SUBMISSION: "view_submission",
  UPLOAD_FILE: "upload_file",
  CHANGE_PASSWORD: "change_password",
  SETTINGS: "settings",
};

// Toast notification types
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

// Loading states
export const LOADING_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// ESLint fix: Create a named constant for the default export
const constants = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  API_ENDPOINTS,
  VALIDATION_RULES,
  REGEX_PATTERNS, // Added
  VALID_GRADES, // Your excellent existing name
  GRADE_VALUES, // Added alias for validators.js compatibility
  VALID_ROLES, // Added
  ERROR_MESSAGES, // Added
  SUCCESS_MESSAGES, // Added
  UI_CONSTANTS,
  DATE_FORMATS,
  FILE_UPLOAD,
  ACADEMIC,
  PAYMENT,
  STATUS,
  NOTIFICATION_TYPES,
  STORAGE_KEYS,
  ROUTES,
  MODAL_TYPES,
  TOAST_TYPES,
  LOADING_STATES,
  PAGINATION,
};

// Export the constants object as default
export default constants;
