// @ts-nocheck

//client\src\utils\helpers.js
import { ACADEMIC, VALIDATION_RULES, FILE_UPLOAD } from "./constants";
import dayjs from "dayjs";

// Date and Time Helpers
export const formatDate = (date, format = "MMM DD, YYYY") => {
  return dayjs(date).format(format);
};

export const isDateInRange = (date, startDate, endDate) => {
  return dayjs(date).isBetween(startDate, endDate, "day", "[]");
};

export const getDateDifference = (date1, date2, unit = "day") => {
  return dayjs(date1).diff(date2, unit);
};

export const getAcademicYear = (date = new Date()) => {
  const year = dayjs(date).year();
  const month = dayjs(date).month();
  return month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
};

// Grade Calculation Helpers
export const calculateGrade = (score, totalPoints) => {
  const percentage = (score / totalPoints) * 100;
  return (
    Object.entries(ACADEMIC.GRADE_SCALE).find(
      ([, range]) => percentage >= range.min && percentage <= range.max
    )?.[0] || "F"
  );
};

export const calculateGPA = (grades) => {
  if (!grades.length) return 0;

  const totalPoints = grades.reduce((sum, grade) => {
    const gradeInfo = ACADEMIC.GRADE_SCALE[grade.letterGrade];
    return sum + (gradeInfo?.gpa || 0);
  }, 0);

  return (totalPoints / grades.length).toFixed(2);
};

export const calculateAttendancePercentage = (attendanceRecords) => {
  if (!attendanceRecords.length) return 0;

  const presentCount = attendanceRecords.filter(
    (record) => record.status === ACADEMIC.ATTENDANCE_STATUSES.PRESENT
  ).length;

  return ((presentCount / attendanceRecords.length) * 100).toFixed(1);
};

// Data Formatting Helpers
export const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

export const formatPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return "(" + match[1] + ") " + match[2] + "-" + match[3];
  }
  return phoneNumber;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Validation Helpers
export const validateEmail = (email) => {
  return VALIDATION_RULES.EMAIL.PATTERN.test(email);
};

export const validatePassword = (password) => {
  return VALIDATION_RULES.PASSWORD.PATTERN.test(password);
};

export const validatePhone = (phone) => {
  return VALIDATION_RULES.PHONE.PATTERN.test(phone);
};

export const validateFile = (file) => {
  const errors = [];

  if (file.size > FILE_UPLOAD.MAX_SIZE) {
    errors.push(
      `File size should not exceed ${formatFileSize(FILE_UPLOAD.MAX_SIZE)}`
    );
  }

  const allowedTypes = [
    ...FILE_UPLOAD.ALLOWED_TYPES.IMAGE,
    ...FILE_UPLOAD.ALLOWED_TYPES.DOCUMENT,
    ...FILE_UPLOAD.ALLOWED_TYPES.SPREADSHEET,
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.push("File type not supported");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Array and Object Helpers
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
};

export const sortBy = (array, key, order = "asc") => {
  return [...array].sort((a, b) => {
    if (order === "asc") {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};

// String Helpers
export const generateInitials = (name) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
};

// Permission Helpers
export const hasPermission = (userPermissions, requiredPermission) => {
  return userPermissions.includes(requiredPermission);
};

export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
};

export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
};

// Data Transform Helpers
export const flattenObject = (obj, prefix = "") => {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? `${prefix}.` : "";
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      Object.assign(acc, flattenObject(obj[key], pre + key));
    } else {
      acc[pre + key] = obj[key];
    }
    return acc;
  }, {});
};

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Error Handling Helpers
export const handleApiError = (error) => {
  if (error.response) {
    return {
      message: error.response.data?.message || "An error occurred",
      status: error.response.status,
    };
  }

  if (error.request) {
    return {
      message: "Network error. Please check your connection.",
      status: 0,
    };
  }

  return {
    message: error.message || "An unexpected error occurred",
    status: 500,
  };
};

// Export all helpers as a default object
export default {
  formatDate,
  isDateInRange,
  getDateDifference,
  getAcademicYear,
  calculateGrade,
  calculateGPA,
  calculateAttendancePercentage,
  formatCurrency,
  formatPhoneNumber,
  formatFileSize,
  validateEmail,
  validatePassword,
  validatePhone,
  validateFile,
  groupBy,
  sortBy,
  generateInitials,
  slugify,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  flattenObject,
  deepClone,
  handleApiError,
};
