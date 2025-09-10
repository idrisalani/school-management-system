// @ts-nocheck

// client/src/features/teacher/components/assignments/utils/dateHelpers.js

/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    includeTime: false,
    includeYear: true,
    shortMonth: false,
    relative: false,
  };

  const config = { ...defaultOptions, ...options };
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isInvalid(dateObj)) {
    return "Invalid Date";
  }

  if (config.relative) {
    return getRelativeTimeString(dateObj);
  }

  const formatOptions = {
    month: config.shortMonth ? "short" : "long",
    day: "numeric",
    year: config.includeYear ? "numeric" : undefined,
    hour: config.includeTime ? "numeric" : undefined,
    minute: config.includeTime ? "2-digit" : undefined,
  };

  return dateObj.toLocaleDateString("en-US", formatOptions);
};

/**
 * Check if a date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if the date is in the past, false otherwise
 */
export const isPast = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return isInvalid(dateObj) ? false : dateObj < new Date();
};

/**
 * Check if a date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if the date is in the future, false otherwise
 */
export const isFuture = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return isInvalid(dateObj) ? false : dateObj > new Date();
};

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if the date is today, false otherwise
 */
export const isToday = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const today = new Date();
  return isSameDay(dateObj, today);
};

/**
 * Check if two dates are the same day
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if both dates are on the same day, false otherwise
 */
export const isSameDay = (date1, date2) => {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTimeString = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((dateObj - now) / 1000);
  const absSeconds = Math.abs(diffInSeconds);

  // Define time units in seconds
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  // Helper function for plural formatting
  const plural = (value, unit) => `${value} ${unit}${value === 1 ? "" : "s"}`;

  // Create the relative time string
  let timeString;
  if (absSeconds < minute) {
    timeString = "just now";
  } else if (absSeconds < hour) {
    const minutes = Math.floor(absSeconds / minute);
    timeString = plural(minutes, "minute");
  } else if (absSeconds < day) {
    const hours = Math.floor(absSeconds / hour);
    timeString = plural(hours, "hour");
  } else if (absSeconds < week) {
    const days = Math.floor(absSeconds / day);
    timeString = plural(days, "day");
  } else if (absSeconds < month) {
    const weeks = Math.floor(absSeconds / week);
    timeString = plural(weeks, "week");
  } else if (absSeconds < year) {
    const months = Math.floor(absSeconds / month);
    timeString = plural(months, "month");
  } else {
    const years = Math.floor(absSeconds / year);
    timeString = plural(years, "year");
  }

  return diffInSeconds < 0 ? `${timeString} ago` : `in ${timeString}`;
};

/**
 * Get the date range for a week
 * @param {Date|string} date - Date within the week
 * @returns {object} Start and end dates of the week
 */
export const getWeekRange = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const start = new Date(dateObj);
  start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // End of week (Saturday)
  return { start, end };
};

/**
 * Get the date range for a month
 * @param {Date|string} date - Date within the month
 * @returns {object} Start and end dates of the month
 */
export const getMonthRange = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  const end = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
  return { start, end };
};

/**
 * Calculate the duration between two dates
 * @param {Date|string} start - Start date
 * @param {Date|string} end - End date
 * @returns {object} Duration in various units (days, hours, minutes, seconds)
 */
export const getDuration = (start, end) => {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  const diff = endDate - startDate;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

/**
 * Get deadline status
 * @param {Date|string} deadline - Deadline date
 * @returns {object} Deadline status and formatting information
 */
export const getDeadlineStatus = (deadline) => {
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  const now = new Date();
  const diff = deadlineDate - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return {
      status: "past",
      label: "Past due",
      color: "text-red-600",
      bgColor: "bg-red-50",
    };
  }

  if (days === 0) {
    return {
      status: "today",
      label: "Due today",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    };
  }

  if (days <= 3) {
    return {
      status: "upcoming",
      label: `Due in ${days} day${days === 1 ? "" : "s"}`,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    };
  }

  return {
    status: "future",
    label: formatDate(deadlineDate, { shortMonth: true }),
    color: "text-green-600",
    bgColor: "bg-green-50",
  };
};

/**
 * Check if a date is invalid
 * @param {Date} date - Date to check
 * @returns {boolean} True if the date is invalid, false otherwise
 */
export const isInvalid = (date) => {
  return isNaN(date.getTime());
};

export default {
  formatDate,
  isPast,
  isFuture,
  isToday,
  isSameDay,
  getRelativeTimeString,
  getWeekRange,
  getMonthRange,
  getDuration,
  getDeadlineStatus,
  isInvalid,
};
