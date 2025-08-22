// server/src/utils/constants.js - Server-specific constants

// Import shared constants that both client and server use
import {
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
} from "../../../shared/constants.js";

/**
 * Re-export shared constants for backward compatibility
 */
export {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  STATUS as USER_STATUSES,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_STATUSES,
  SUBMISSION_STATUSES,
  ATTENDANCE_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  GRADE_LEVELS,
  ACADEMIC_TERMS,
  NOTIFICATION_TYPES,
  VALIDATION_RULES,
  FILE_CONSTANTS as FILE_LIMITS,
  REGEX_PATTERNS,
  TIME_CONSTANTS,
  PAGINATION,
  RESPONSE_MESSAGES,
  ACADEMIC_CONSTANTS,
};

/**
 * SERVER-SPECIFIC CONSTANTS BELOW
 * These are only used by the backend server
 */

/**
 * Class statuses - Server-specific workflow states
 */
export const CLASS_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

/**
 * Rate limiting configurations - Server security
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
 * JWT token expiration times - Server authentication
 */
export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: "15m",
  REFRESH_TOKEN: "7d",
  VERIFICATION_TOKEN: "24h",
  RESET_TOKEN: "1h",
};

/**
 * Email templates - Server email service
 */
export const EMAIL_TEMPLATES = {
  WELCOME: "welcome",
  PASSWORD_RESET: "password_reset",
  EMAIL_VERIFICATION: "email_verification",
  ASSIGNMENT_REMINDER: "assignment_reminder",
  GRADE_NOTIFICATION: "grade_notification",
};

/**
 * Database table names - Server ORM mapping
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
 * Environment types - Server deployment configurations
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
  TEST: "test",
};

/**
 * Log levels - Server logging system
 */
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

/**
 * Database connection settings - Server database config
 */
export const DATABASE_CONFIG = {
  POOL_MIN: 2,
  POOL_MAX: 10,
  ACQUIRE_TIMEOUT: 60000,
  IDLE_TIMEOUT: 30000,
  CONNECTION_LIMIT: 100,
};

/**
 * Server security settings - Server-specific security
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
 * File processing settings - Server file handling
 */
export const FILE_PROCESSING = {
  TEMP_UPLOAD_DIR: "/tmp/uploads",
  PROCESSED_DIR: "/app/uploads",
  IMAGE_QUALITY: 80,
  MAX_IMAGE_WIDTH: 1920,
  MAX_IMAGE_HEIGHT: 1080,
  THUMBNAIL_SIZE: 200,
};

/**
 * Cache settings - Server caching configuration
 */
export const CACHE_CONFIG = {
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 24 * 60 * 60, // 24 hours
  },
  KEYS: {
    USER_PERMISSIONS: "user_permissions:",
    CLASS_ROSTER: "class_roster:",
    ASSIGNMENT_LIST: "assignment_list:",
    GRADE_SUMMARY: "grade_summary:",
  },
};

/**
 * Audit log events - Server audit tracking
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

/**
 * WebSocket events - Server real-time communication
 */
export const WEBSOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  JOIN_CLASS: "join_class",
  LEAVE_CLASS: "leave_class",
  NEW_ASSIGNMENT: "new_assignment",
  GRADE_UPDATE: "grade_update",
  ATTENDANCE_UPDATE: "attendance_update",
  ANNOUNCEMENT: "announcement",
  SYSTEM_MAINTENANCE: "system_maintenance",
};

/**
 * Background job types - Server task queue
 */
export const JOB_TYPES = {
  SEND_EMAIL: "send_email",
  GENERATE_REPORT: "generate_report",
  PROCESS_GRADES: "process_grades",
  BACKUP_DATA: "backup_data",
  CLEANUP_FILES: "cleanup_files",
  SEND_REMINDERS: "send_reminders",
};

/**
 * API versioning - Server API management
 */
export const API_VERSIONS = {
  V1: "v1",
  V2: "v2",
  CURRENT: "v1",
};

/**
 * Health check endpoints - Server monitoring
 */
export const HEALTH_ENDPOINTS = {
  BASIC: "/health",
  DETAILED: "/health/detailed",
  DATABASE: "/health/database",
  REDIS: "/health/redis",
  EXTERNAL: "/health/external",
};

// Default export for server-specific constants
export default {
  // Shared constants (re-exported)
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  USER_STATUSES: STATUS,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_STATUSES,
  SUBMISSION_STATUSES,
  ATTENDANCE_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  GRADE_LEVELS,
  ACADEMIC_TERMS,
  NOTIFICATION_TYPES,
  FILE_LIMITS: FILE_CONSTANTS,
  PAGINATION,
  RESPONSE_MESSAGES,
  ACADEMIC_CONSTANTS,

  // Server-specific constants
  CLASS_STATUSES,
  RATE_LIMITS,
  TOKEN_EXPIRATION,
  EMAIL_TEMPLATES,
  TABLES,
  ENVIRONMENTS,
  LOG_LEVELS,
  DATABASE_CONFIG,
  SECURITY_CONFIG,
  FILE_PROCESSING,
  CACHE_CONFIG,
  AUDIT_EVENTS,
  WEBSOCKET_EVENTS,
  JOB_TYPES,
  API_VERSIONS,
  HEALTH_ENDPOINTS,
};
