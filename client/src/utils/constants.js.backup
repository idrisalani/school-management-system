//client\src\utils\constants.js
// User roles and permissions
export const ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
    PARENT: 'parent'
  };
  
  export const PERMISSIONS = {
    // User management
    MANAGE_USERS: 'manage_users',
    VIEW_USERS: 'view_users',
    
    // Class management
    MANAGE_CLASSES: 'manage_classes',
    VIEW_CLASSES: 'view_classes',
    
    // Assignment management
    CREATE_ASSIGNMENTS: 'create_assignments',
    GRADE_ASSIGNMENTS: 'grade_assignments',
    SUBMIT_ASSIGNMENTS: 'submit_assignments',
    VIEW_ASSIGNMENTS: 'view_assignments',
    
    // Attendance management
    MARK_ATTENDANCE: 'mark_attendance',
    VIEW_ATTENDANCE: 'view_attendance',
    
    // Grade management
    MANAGE_GRADES: 'manage_grades',
    VIEW_GRADES: 'view_grades',
    
    // Fee management
    MANAGE_FEES: 'manage_fees',
    VIEW_FEES: 'view_fees'
  };
  
  // Role-based permission mappings
  export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.TEACHER]: [
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.VIEW_CLASSES,
      PERMISSIONS.MANAGE_CLASSES,
      PERMISSIONS.CREATE_ASSIGNMENTS,
      PERMISSIONS.GRADE_ASSIGNMENTS,
      PERMISSIONS.VIEW_ASSIGNMENTS,
      PERMISSIONS.MARK_ATTENDANCE,
      PERMISSIONS.VIEW_ATTENDANCE,
      PERMISSIONS.MANAGE_GRADES,
      PERMISSIONS.VIEW_GRADES
    ],
    [ROLES.STUDENT]: [
      PERMISSIONS.VIEW_CLASSES,
      PERMISSIONS.SUBMIT_ASSIGNMENTS,
      PERMISSIONS.VIEW_ASSIGNMENTS,
      PERMISSIONS.VIEW_ATTENDANCE,
      PERMISSIONS.VIEW_GRADES,
      PERMISSIONS.VIEW_FEES
    ],
    [ROLES.PARENT]: [
      PERMISSIONS.VIEW_ASSIGNMENTS,
      PERMISSIONS.VIEW_ATTENDANCE,
      PERMISSIONS.VIEW_GRADES,
      PERMISSIONS.VIEW_FEES
    ]
  };
  
  // API endpoints
  export const API_ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      VERIFY: '/auth/verify'
    },
    USERS: {
      BASE: '/users',
      BY_ID: (id) => `/users/${id}`,
      PROFILE: (id) => `/users/${id}/profile`,
      ROLES: '/users/roles'
    },
    CLASSES: {
      BASE: '/classes',
      BY_ID: (id) => `/classes/${id}`,
      STUDENTS: (id) => `/classes/${id}/students`,
      TEACHERS: (id) => `/classes/${id}/teachers`
    },
    ASSIGNMENTS: {
      BASE: '/assignments',
      BY_ID: (id) => `/assignments/${id}`,
      SUBMISSIONS: (id) => `/assignments/${id}/submissions`,
      GRADE: (id, submissionId) => `/assignments/${id}/submissions/${submissionId}/grade`
    },
    ATTENDANCE: {
      BASE: '/attendance',
      BY_CLASS: (id) => `/attendance/class/${id}`,
      BY_STUDENT: (id) => `/attendance/student/${id}`
    },
    GRADES: {
      BASE: '/grades',
      BY_CLASS: (id) => `/grades/class/${id}`,
      BY_STUDENT: (id) => `/grades/student/${id}`,
      REPORT: (id) => `/grades/student/${id}/report`
    },
    FEES: {
      BASE: '/fees',
      BY_ID: (id) => `/fees/${id}`,
      BY_STUDENT: (id) => `/fees/student/${id}`,
      PAYMENTS: (id) => `/fees/${id}/payments`
    }
  };
  
  // Form validation rules
  export const VALIDATION_RULES = {
    PASSWORD: {
      MIN_LENGTH: 8,
      PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      MESSAGE: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
    },
    EMAIL: {
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      MESSAGE: 'Please enter a valid email address'
    },
    PHONE: {
      PATTERN: /^\+?[\d\s-]{10,}$/,
      MESSAGE: 'Please enter a valid phone number'
    },
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
      MESSAGE: 'Name must be between 2 and 50 characters'
    }
  };
  
  // UI constants
  export const UI_CONSTANTS = {
    SIDEBAR_WIDTH: 280,
    HEADER_HEIGHT: 64,
    FOOTER_HEIGHT: 50,
    BREAKPOINTS: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    ANIMATION_DURATION: {
      fast: 200,
      normal: 300,
      slow: 500
    },
    TOAST_DURATION: 5000
  };
  
  // Date formats
  export const DATE_FORMATS = {
    DISPLAY_DATE: 'MMM DD, YYYY',
    DISPLAY_TIME: 'hh:mm A',
    DISPLAY_DATETIME: 'MMM DD, YYYY hh:mm A',
    ISO_DATE: 'YYYY-MM-DD',
    ISO_DATETIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  };
  
  // File upload constants
  export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: {
      IMAGE: ['image/jpeg', 'image/png'],
      DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    }
  };
  
  // Academic constants
  export const ACADEMIC = {
    GRADE_SCALE: {
      'A+': { min: 97, max: 100, gpa: 4.0 },
      'A': { min: 93, max: 96, gpa: 4.0 },
      'A-': { min: 90, max: 92, gpa: 3.7 },
      'B+': { min: 87, max: 89, gpa: 3.3 },
      'B': { min: 83, max: 86, gpa: 3.0 },
      'B-': { min: 80, max: 82, gpa: 2.7 },
      'C+': { min: 77, max: 79, gpa: 2.3 },
      'C': { min: 73, max: 76, gpa: 2.0 },
      'C-': { min: 70, max: 72, gpa: 1.7 },
      'D+': { min: 67, max: 69, gpa: 1.3 },
      'D': { min: 63, max: 66, gpa: 1.0 },
      'D-': { min: 60, max: 62, gpa: 0.7 },
      'F': { min: 0, max: 59, gpa: 0.0 }
    },
    ATTENDANCE_STATUSES: {
      PRESENT: 'present',
      ABSENT: 'absent',
      LATE: 'late',
      EXCUSED: 'excused'
    },
    ASSIGNMENT_TYPES: {
      HOMEWORK: 'homework',
      PROJECT: 'project',
      QUIZ: 'quiz',
      TEST: 'test',
      EXAM: 'exam',
      OTHER: 'other'
    }
  };
  
  export default {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    API_ENDPOINTS,
    VALIDATION_RULES,
    UI_CONSTANTS,
    DATE_FORMATS,
    FILE_UPLOAD,
    ACADEMIC
  };