// @ts-check
import { useState } from "react";
import axios from "axios";

//const BASE_URL = process.env.REACT_APP_API_URL || "/api/v1";

/**
 * @typedef {object} QueryParams
 * @property {number} [page] - Page number for pagination
 * @property {number} [limit] - Number of items per page
 * @property {string} [sort] - Sort field
 * @property {string} [order] - Sort order (asc/desc)
 */

/**
 * @typedef {object} ApiResponse
 * @property {any} data - Response data
 * @property {string} [message] - Response message
 */

/**
 * @typedef {object} FileUploadConfig
 * @property {{[key: string]: string}} [headers] - Additional headers for the request
 */

/**
 * @typedef {Error & {
 *  config?: import('axios').AxiosRequestConfig & {retryCount?: number},
 *  response?: {status: number, data: any}
 * }} ApiError
 */

/**
 * Creates an axios instance with extended functionality
 * @returns {object} Extended axios instance with API endpoints
 */
const createApiInstance = () => {
  /** @type {import('axios').AxiosInstance} */
  const instance = axios.create({
    baseURL: (process.env.REACT_APP_API_URL || "") + "/api/v1",
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  // Add request interceptor
  instance.interceptors.request.use(
    /**
     * Add authorization header to requests
     * @param {import('axios').InternalAxiosRequestConfig} config - Request configuration
     * @returns {import('axios').InternalAxiosRequestConfig} Modified configuration
     */
    (config) => {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    /**
     * Handle request errors
     * @param {ApiError} error - Request error
     * @returns {Promise<never>} Rejected promise with error
     */
    (error) => Promise.reject(error)
  );

  // Add response interceptor with retry logic
  instance.interceptors.response.use(
    (response) => response,
    /**
     * Handle response errors with retry logic
     * @param {ApiError} error - Response error
     * @returns {Promise<any>} Promise that may retry the request
     */
    async (error) => {
      const config = error.config;

      // Handle network errors and retries
      if (config && (!error.response || error.response.status >= 500)) {
        config.retryCount = config.retryCount || 0;
        const maxRetries = 3;

        if (config.retryCount < maxRetries) {
          config.retryCount += 1;
          const delayMs = config.retryCount * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return instance(config);
        }
      }

      // Handle specific error cases
      if (axios.isAxiosError(error) && error.response) {
        switch (error.response.status) {
          case 401:
            localStorage.removeItem("token");
            window.location.href = "/login";
            break;
          case 403:
            console.error("Access denied");
            break;
          case 404:
            console.error("Resource not found");
            break;
          default:
            if (!error.response && error.code === "ERR_NETWORK") {
              console.error("Network error - please check your connection");
            } else {
              console.error(
                "An error occurred:",
                error.response?.data?.message || "Unknown error"
              );
            }
        }
      }

      return Promise.reject(error);
    }
  );

  // File operations helper methods
  const fileOperations = {
    /**
     * Upload file to the server
     * @param {string} url - Upload endpoint URL
     * @param {FormData} formData - Form data containing the file
     * @param {FileUploadConfig} [config] - Optional configuration for the upload
     * @returns {Promise<ApiResponse>} Upload response
     */
    upload: async (url, formData, config = {}) => {
      return instance.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          "Content-Type": "multipart/form-data",
        },
      });
    },

    /**
     * Download file from the server
     * @param {string} url - Download endpoint URL
     * @param {string} filename - Name to save the file as
     * @param {object} [config] - Optional configuration for the download
     * @returns {Promise<ApiResponse>} Download response
     */
    download: async (url, filename, config = {}) => {
      try {
        const response = await instance.get(url, {
          ...config,
          responseType: "blob",
        });

        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        return response;
      } catch (error) {
        console.error("Download failed:", error);
        throw error;
      }
    },
  };

  // Return enhanced instance with endpoints
  return {
    ...instance,
    ...fileOperations,

    auth: {
      /**
       * Authenticate user with credentials
       * @param {string} email - User's email address
       * @param {string} password - User's password
       * @returns {Promise<ApiResponse>} Authentication response
       */
      login: (email, password) =>
        instance.post("/auth/login", { email, password }),

      /**
       * Log out the current user
       * @returns {Promise<ApiResponse>} Logout response
       */
      logout: () => instance.post("/auth/logout"),

      /**
       * Verify current authentication status
       * @returns {Promise<ApiResponse>} Verification response
       */
      verify: () => instance.get("/auth/verify"),

      /**
       * Request password reset for email
       * @param {string} email - User's email address
       * @returns {Promise<ApiResponse>} Reset request response
       */
      requestPasswordReset: (email) =>
        instance.post("/auth/password-reset", { email }),

      /**
       * Reset password with token
       * @param {string} token - Password reset token
       * @param {string} newPassword - New password to set
       * @returns {Promise<ApiResponse>} Password reset response
       */
      resetPassword: (token, newPassword) =>
        instance.post("/auth/password-reset/confirm", { token, newPassword }),

      /**
       * Register new user
       * @param {object} userData - User registration data
       * @returns {Promise<ApiResponse>} Registration response
       */
      register: (userData) => instance.post("/auth/register", userData),
    },

    users: {
      /**
       * Get list of users
       * @param {QueryParams} params - Query parameters for filtering and pagination
       * @returns {Promise<ApiResponse>} Users list response
       */
      getAll: (params) => instance.get("/users", { params }),

      /**
       * Get user by ID
       * @param {string} id - User identifier
       * @returns {Promise<ApiResponse>} User details response
       */
      getById: (id) => instance.get(`/users/${id}`),

      /**
       * Create new user
       * @param {object} data - User data
       * @returns {Promise<ApiResponse>} Created user response
       */
      create: (data) => instance.post("/users", data),

      /**
       * Update existing user
       * @param {string} id - User identifier
       * @param {object} data - Updated user data
       * @returns {Promise<ApiResponse>} Updated user response
       */
      update: (id, data) => instance.put(`/users/${id}`, data),

      /**
       * Delete user
       * @param {string} id - User identifier
       * @returns {Promise<ApiResponse>} Deletion response
       */
      delete: (id) => instance.delete(`/users/${id}`),
    },

    classes: {
      /**
       * Get list of classes
       * @param {QueryParams} params - Query parameters for filtering and pagination
       * @returns {Promise<ApiResponse>} Classes list response
       */
      getAll: (params) => instance.get("/classes", { params }),

      /**
       * Get class by ID
       * @param {string} id - Class identifier
       * @returns {Promise<ApiResponse>} Class details response
       */
      getById: (id) => instance.get(`/classes/${id}`),

      /**
       * Create new class
       * @param {object} data - Class data
       * @returns {Promise<ApiResponse>} Created class response
       */
      create: (data) => instance.post("/classes", data),

      /**
       * Update existing class
       * @param {string} id - Class identifier
       * @param {object} data - Updated class data
       * @returns {Promise<ApiResponse>} Updated class response
       */
      update: (id, data) => instance.put(`/classes/${id}`, data),

      /**
       * Delete class
       * @param {string} id - Class identifier
       * @returns {Promise<ApiResponse>} Deletion response
       */
      delete: (id) => instance.delete(`/classes/${id}`),

      /**
       * Get students in class
       * @param {string} classId - Class identifier
       * @returns {Promise<ApiResponse>} Class students response
       */
      getStudents: (classId) => instance.get(`/classes/${classId}/students`),

      /**
       * Add student to class
       * @param {string} classId - Class identifier
       * @param {string} studentId - Student identifier
       * @returns {Promise<ApiResponse>} Add student response
       */
      addStudent: (classId, studentId) =>
        instance.post(`/classes/${classId}/students`, { studentId }),

      /**
       * Remove student from class
       * @param {string} classId - Class identifier
       * @param {string} studentId - Student identifier
       * @returns {Promise<ApiResponse>} Remove student response
       */
      removeStudent: (classId, studentId) =>
        instance.delete(`/classes/${classId}/students/${studentId}`),

      /**
       * Get teachers assigned to class
       * @param {string} classId - Class identifier
       * @returns {Promise<ApiResponse>} Class teachers response
       */
      getTeachers: (classId) => instance.get(`/classes/${classId}/teachers`),

      /**
       * Assign teacher to class
       * @param {string} classId - Class identifier
       * @param {string} teacherId - Teacher identifier
       * @param {string} subjectId - Subject identifier
       * @returns {Promise<ApiResponse>} Assign teacher response
       */
      assignTeacher: (classId, teacherId, subjectId) =>
        instance.post(`/classes/${classId}/teachers`, { teacherId, subjectId }),
    },

    assignments: {
      /**
       * Get list of assignments
       * @param {QueryParams} params - Query parameters for filtering and pagination
       * @returns {Promise<ApiResponse>} Assignments list response
       */
      getAll: (params) => instance.get("/assignments", { params }),

      /**
       * Get assignment by ID
       * @param {string} assignmentId - Assignment identifier
       * @returns {Promise<ApiResponse>} Assignment details response
       */
      getById: (assignmentId) => instance.get(`/assignments/${assignmentId}`),

      /**
       * Create new assignment
       * @param {object} assignmentData - Assignment data
       * @returns {Promise<ApiResponse>} Created assignment response
       */
      create: (assignmentData) => instance.post("/assignments", assignmentData),

      /**
       * Update existing assignment
       * @param {string} assignmentId - Assignment identifier
       * @param {object} assignmentData - Updated assignment data
       * @returns {Promise<ApiResponse>} Updated assignment response
       */
      update: (assignmentId, assignmentData) =>
        instance.put(`/assignments/${assignmentId}`, assignmentData),

      /**
       * Delete assignment
       * @param {string} assignmentId - Assignment identifier
       * @returns {Promise<ApiResponse>} Deletion response
       */
      delete: (assignmentId) => instance.delete(`/assignments/${assignmentId}`),

      /**
       * Get submissions for assignment
       * @param {string} assignmentId - Assignment identifier
       * @returns {Promise<ApiResponse>} Assignment submissions response
       */
      getSubmissions: (assignmentId) =>
        instance.get(`/assignments/${assignmentId}/submissions`),

      /**
       * Submit assignment
       * @param {string} assignmentId - Assignment identifier
       * @param {object} submissionData - Submission data
       * @returns {Promise<ApiResponse>} Submission response
       */
      submitAssignment: (assignmentId, submissionData) =>
        instance.post(
          `/assignments/${assignmentId}/submissions`,
          submissionData
        ),

      /**
       * Grade assignment submission
       * @param {string} assignmentId - Assignment identifier
       * @param {string} submissionId - Submission identifier
       * @param {object} gradeData - Grade data
       * @returns {Promise<ApiResponse>} Grade submission response
       */
      gradeSubmission: (assignmentId, submissionId, gradeData) =>
        instance.post(
          `/assignments/${assignmentId}/submissions/${submissionId}/grade`,
          gradeData
        ),

      /**
       * Upload assignment attachment
       * @param {string} assignmentId - Assignment identifier
       * @param {File} file - File to upload
       * @returns {Promise<ApiResponse>} Upload response
       */
      uploadAttachment: (assignmentId, file) => {
        const formData = new FormData();
        formData.append("file", file);
        return fileOperations.upload(
          `/assignments/${assignmentId}/attachments`,
          formData
        );
      },
    },

    attendance: {
      /**
       * Get class attendance for date
       * @param {string} classId - Class identifier
       * @param {string} date - Date to get attendance for
       * @returns {Promise<ApiResponse>} Class attendance response
       */
      getByClass: (classId, date) =>
        instance.get(`/attendance/class/${classId}`, { params: { date } }),

      /**
       * Get student attendance for date range
       * @param {string} studentId - Student identifier
       * @param {string} startDate - Start date
       * @param {string} endDate - End date
       * @returns {Promise<ApiResponse>} Student attendance response
       */
      getByStudent: (studentId, startDate, endDate) =>
        instance.get(`/attendance/student/${studentId}`, {
          params: { startDate, endDate },
        }),

      /**
       * Mark attendance for class
       * @param {string} classId - Class identifier
       * @param {string} date - Attendance date
       * @param {object} attendanceData - Attendance data
       * @returns {Promise<ApiResponse>} Mark attendance response
       */
      markAttendance: (classId, date, attendanceData) =>
        instance.post(`/attendance/class/${classId}`, {
          date,
          ...attendanceData,
        }),

      /**
       * Update attendance record
       * @param {string} attendanceId - Attendance record identifier
       * @param {object} updateData - Updated attendance data
       * @returns {Promise<ApiResponse>} Updated attendance response
       */
      updateAttendance: (attendanceId, updateData) =>
        instance.patch(`/attendance/${attendanceId}`, updateData),

      /**
       * Get attendance report for class
       * @param {string} classId - Class identifier
       * @param {string} startDate - Start date
       * @param {string} endDate - End date
       * @returns {Promise<ApiResponse>} Attendance report response
       */
      getReport: (classId, startDate, endDate) =>
        instance.get(`/attendance/class/${classId}/report`, {
          params: { startDate, endDate },
        }),
    },

    grades: {
      /**
       * Get grades by class
       * @param {string} classId - Class identifier
       * @returns {Promise<ApiResponse>} Class grades response
       */
      getByClass: (classId) => instance.get(`/grades/class/${classId}`),

      /**
       * Get grades by student
       * @param {string} studentId - Student identifier
       * @returns {Promise<ApiResponse>} Student grades response
       */
      getByStudent: (studentId) => instance.get(`/grades/student/${studentId}`),

      /**
       * Enter grades for class subject
       * @param {string} classId - Class identifier
       * @param {string} subjectId - Subject identifier
       * @param {object} gradesData - Grades data
       * @returns {Promise<ApiResponse>} Enter grades response
       */
      enterGrades: (classId, subjectId, gradesData) =>
        instance.post(
          `/grades/class/${classId}/subject/${subjectId}`,
          gradesData
        ),

      /**
       * Update grade record
       * @param {string} gradeId - Grade identifier
       * @param {object} updateData - Updated grade data
       * @returns {Promise<ApiResponse>} Updated grade response
       */
      updateGrade: (gradeId, updateData) =>
        instance.patch(`/grades/${gradeId}`, updateData),

      /**
       * Generate student report card
       * @param {string} studentId - Student identifier
       * @param {string} term - Academic term
       * @returns {Promise<ApiResponse>} Report card response
       */
      generateReport: (studentId, term) =>
        instance.get(`/grades/student/${studentId}/report`, {
          params: { term },
        }),

      /**
       * Download student report card
       * @param {string} studentId - Student identifier
       * @param {string} term - Academic term
       * @returns {Promise<ApiResponse>} Report download response
       */
      downloadReport: (studentId, term) =>
        fileOperations.download(
          `/grades/student/${studentId}/report/download`,
          `report-${term}.pdf`
        ),
    },

    messages: {
      /**
       * Get list of messages
       * @param {QueryParams} params - Query parameters for filtering and pagination
       * @returns {Promise<ApiResponse>} Messages list response
       */
      getAll: (params) => instance.get("/messages", { params }),

      /**
       * Get message by ID
       * @param {string} messageId - Message identifier
       * @returns {Promise<ApiResponse>} Message details response
       */
      getById: (messageId) => instance.get(`/messages/${messageId}`),

      /**
       * Send new message
       * @param {object} messageData - Message data
       * @returns {Promise<ApiResponse>} Sent message response
       */
      send: (messageData) => instance.post("/messages", messageData),

      /**
       * Mark message as read
       * @param {string} messageId - Message identifier
       * @returns {Promise<ApiResponse>} Mark read response
       */
      markAsRead: (messageId) => instance.patch(`/messages/${messageId}/read`),

      /**
       * Delete message
       * @param {string} messageId - Message identifier
       * @returns {Promise<ApiResponse>} Deletion response
       */
      delete: (messageId) => instance.delete(`/messages/${messageId}`),
    },

    events: {
      /**
       * Get list of events
       * @param {QueryParams} params - Query parameters for filtering and pagination
       * @returns {Promise<ApiResponse>} Events list response
       */
      getAll: (params) => instance.get("/events", { params }),

      /**
       * Get event by ID
       * @param {string} eventId - Event identifier
       * @returns {Promise<ApiResponse>} Event details response
       */
      getById: (eventId) => instance.get(`/events/${eventId}`),

      /**
       * Create new event
       * @param {object} eventData - Event data
       * @returns {Promise<ApiResponse>} Created event response
       */
      create: (eventData) => instance.post("/events", eventData),

      /**
       * Update existing event
       * @param {string} eventId - Event identifier
       * @param {object} eventData - Updated event data
       * @returns {Promise<ApiResponse>} Updated event response
       */
      update: (eventId, eventData) =>
        instance.put(`/events/${eventId}`, eventData),

      /**
       * Delete event
       * @param {string} eventId - Event identifier
       * @returns {Promise<ApiResponse>} Deletion response
       */
      delete: (eventId) => instance.delete(`/events/${eventId}`),

      /**
       * Get events by date range
       * @param {string} startDate - Start date
       * @param {string} endDate - End date
       * @returns {Promise<ApiResponse>} Events in range response
       */
      getByDate: (startDate, endDate) =>
        instance.get("/events/range", { params: { startDate, endDate } }),
    },

    fees: {
      /**
       * Get list of fees
       * @param {QueryParams} params - Query parameters for filtering and pagination
       * @returns {Promise<ApiResponse>} Fees list response
       */
      getAll: (params) => instance.get("/fees", { params }),

      /**
       * Get fee by ID
       * @param {string} feeId - Fee identifier
       * @returns {Promise<ApiResponse>} Fee details response
       */
      getById: (feeId) => instance.get(`/fees/${feeId}`),

      /**
       * Create new fee
       * @param {object} feeData - Fee data
       * @returns {Promise<ApiResponse>} Created fee response
       */
      create: (feeData) => instance.post("/fees", feeData),

      /**
       * Update existing fee
       * @param {string} feeId - Fee identifier
       * @param {object} feeData - Updated fee data
       * @returns {Promise<ApiResponse>} Updated fee response
       */
      update: (feeId, feeData) => instance.put(`/fees/${feeId}`, feeData),

      /**
       * Delete fee
       * @param {string} feeId - Fee identifier
       * @returns {Promise<ApiResponse>} Deletion response
       */
      delete: (feeId) => instance.delete(`/fees/${feeId}`),

      /**
       * Get student fees
       * @param {string} studentId - Student identifier
       * @returns {Promise<ApiResponse>} Student fees response
       */
      getStudentFees: (studentId) => instance.get(`/fees/student/${studentId}`),

      /**
       * Record fee payment
       * @param {string} feeId - Fee identifier
       * @param {object} paymentData - Payment data
       * @returns {Promise<ApiResponse>} Payment record response
       */
      recordPayment: (feeId, paymentData) =>
        instance.post(`/fees/${feeId}/payments`, paymentData),

      /**
       * Generate fee invoice
       * @param {string} feeId - Fee identifier
       * @returns {Promise<ApiResponse>} Invoice response
       */
      generateInvoice: (feeId) => instance.get(`/fees/${feeId}/invoice`),

      /**
       * Download fee invoice
       * @param {string} feeId - Fee identifier
       * @returns {Promise<ApiResponse>} Invoice download response
       */
      downloadInvoice: (feeId) =>
        fileOperations.download(
          `/fees/${feeId}/invoice/download`,
          `invoice-${feeId}.pdf`
        ),
    },

    analytics: {
      /**
       * Get attendance statistics
       * @param {QueryParams} params - Query parameters for filtering
       * @returns {Promise<ApiResponse>} Attendance stats response
       */
      getAttendanceStats: (params) =>
        instance.get("/analytics/attendance", { params }),

      /**
       * Get grade statistics
       * @param {QueryParams} params - Query parameters for filtering
       * @returns {Promise<ApiResponse>} Grade stats response
       */
      getGradeStats: (params) => instance.get("/analytics/grades", { params }),

      /**
       * Get financial statistics
       * @param {QueryParams} params - Query parameters for filtering
       * @returns {Promise<ApiResponse>} Financial stats response
       */
      getFinancialStats: (params) =>
        instance.get("/analytics/finance", { params }),

      /**
       * Generate analytics report
       * @param {string} reportType - Type of report to generate
       * @param {QueryParams} params - Query parameters for filtering
       * @returns {Promise<ApiResponse>} Generated report response
       */
      generateReport: (reportType, params) =>
        instance.get(`/analytics/reports/${reportType}`, { params }),

      /**
       * Download analytics report
       * @param {string} reportType - Type of report to download
       * @param {QueryParams} params - Query parameters for filtering
       * @returns {Promise<ApiResponse>} Report download response
       */
      downloadReport: (reportType, params) =>
        fileOperations.download(
          `/analytics/reports/${reportType}/download`,
          `${reportType}-report.pdf`,
          { params }
        ),
    },

    schedule: {
      /**
       * Get list of schedules
       * @param {QueryParams} params - Query parameters for filtering and pagination
       * @returns {Promise<ApiResponse>} Schedules list response
       */
      getAll: (params) => instance.get("/schedules", { params }),

      /**
       * Get schedule by ID
       * @param {string} scheduleId - Schedule identifier
       * @returns {Promise<ApiResponse>} Schedule details response
       */
      getById: (scheduleId) => instance.get(`/schedules/${scheduleId}`),

      /**
       * Create new schedule
       * @param {object} scheduleData - Schedule data
       * @returns {Promise<ApiResponse>} Created schedule response
       */
      create: (scheduleData) => instance.post("/schedules", scheduleData),

      /**
       * Update existing schedule
       * @param {string} scheduleId - Schedule identifier
       * @param {object} scheduleData - Updated schedule data
       * @returns {Promise<ApiResponse>} Updated schedule response
       */
      update: (scheduleId, scheduleData) =>
        instance.put(`/schedules/${scheduleId}`, scheduleData),

      /**
       * Delete schedule
       * @param {string} scheduleId - Schedule identifier
       * @returns {Promise<ApiResponse>} Deletion response
       */
      delete: (scheduleId) => instance.delete(`/schedules/${scheduleId}`),

      /**
       * Get teacher schedule
       * @param {string} teacherId - Teacher identifier
       * @returns {Promise<ApiResponse>} Teacher schedule response
       */
      getByTeacher: (teacherId) =>
        instance.get(`/schedules/teacher/${teacherId}`),

      /**
       * Get class schedule
       * @param {string} classId - Class identifier
       * @returns {Promise<ApiResponse>} Class schedule response
       */
      getByClass: (classId) => instance.get(`/schedules/class/${classId}`),

      /**
       * Get room schedule
       * @param {string} roomId - Room identifier
       * @returns {Promise<ApiResponse>} Room schedule response
       */
      getByRoom: (roomId) => instance.get(`/schedules/room/${roomId}`),
    },
  };
};

/**
 * Custom hook for using the API with loading and error states
 * @template T
 * @returns {{
 *   loading: boolean,
 *   error: any,
 *   data: T | null,
 *   execute: (apiCall: () => Promise<import('axios').AxiosResponse<T>>) => Promise<T>,
 *   setError: (error: any) => void
 * }} returns
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(/** @type {T | null} */ (null));

  /**
   * Execute an API call with loading and error handling
   * @param {() => Promise<import('axios').AxiosResponse<T>>} apiCall - API call to execute
   * @returns {Promise<T>} API call response data
   */
  const execute = async (apiCall) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
      return response.data;
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "An error occurred";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    data,
    execute,
    setError,
  };
};

// Create and export API instance
const api = createApiInstance();
export default api;
