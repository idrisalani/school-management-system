// @ts-check
import { useState } from "react";
import axios from "axios";

/**
 * @typedef {object} QueryParams
 * @property {number} [page] - Page number for pagination
 * @property {number} [limit] - Number of items per page
 * @property {string} [sort] - Sort field
 * @property {string} [order] - Sort order (asc/desc)
 * @property {string} [search] - Search term
 * @property {string} [filter] - Filter criteria
 * @property {string} [startDate] - Start date for date range queries
 * @property {string} [endDate] - End date for date range queries
 */

/**
 * @typedef {object} ApiResponse
 * @property {any} data - Response data
 * @property {string} [message] - Response message
 * @property {string} [status] - Response status
 * @property {boolean} [success] - Success indicator
 * @property {number} [statusCode] - HTTP status code
 */

/**
 * @typedef {import('axios').AxiosResponse} AxiosApiResponse
 */

/**
 * @typedef {object} FileUploadConfig
 * @property {{[key: string]: string}} [headers] - Additional headers for the request
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {(progressEvent: any) => void} [onUploadProgress] - Upload progress callback
 */

/**
 * @typedef {Error & {
 *  config?: import('axios').AxiosRequestConfig & {retryCount?: number},
 *  response?: {status: number, data: any},
 *  code?: string
 * }} ApiError
 */

/**
 * @typedef {object} User
 * @property {string} id - User's unique identifier
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} role - User's role in the system
 * @property {string} [username] - User's username
 * @property {string} [firstName] - User's first name
 * @property {string} [lastName] - User's last name
 * @property {boolean} [isVerified] - Whether user's email is verified
 * @property {string} [phone] - User's phone number
 * @property {string} [avatar] - User's profile picture URL
 * @property {Date} [createdAt] - Account creation date
 * @property {Date} [updatedAt] - Last update date
 */

/**
 * @typedef {object} LoginCredentials
 * @property {string} emailOrUsername - User's email address or username for authentication
 * @property {string} password - User's password for authentication
 */

/**
 * @typedef {object} AuthResponse
 * @property {string} status - Response status ("success" | "error")
 * @property {string} [message] - Response message
 * @property {User} user - User data
 * @property {string} [accessToken] - Access token
 * @property {string} [token] - Authentication token
 * @property {string} [refreshToken] - Refresh token
 */

/**
 * @typedef {object} VerifyResponse
 * @property {string} status - Response status
 * @property {boolean} authenticated - Whether user is authenticated
 * @property {User} user - User data
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
    timeout: 30000, // 30 second timeout
  });

  // Add request interceptor with enhanced logging
  instance.interceptors.request.use(
    /**
     * Add authorization header and logging to requests
     * @param {import('axios').InternalAxiosRequestConfig} config - Request configuration
     * @returns {import('axios').InternalAxiosRequestConfig} Modified configuration
     */
    (config) => {
      // Add authorization header to requests
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request for debugging in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`,
          {
            headers: config.headers,
            data: config.data,
            params: config.params,
          }
        );
      }

      return config;
    },
    /**
     * Handle request errors
     * @param {ApiError} error - Request error
     * @returns {Promise<never>} Rejected promise with error
     */
    (error) => {
      console.error("❌ Request interceptor error:", error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor with enhanced error handling and retry logic
  instance.interceptors.response.use(
    /**
     * Handle successful responses
     * @param {import('axios').AxiosResponse} response - Axios response
     * @returns {import('axios').AxiosResponse} Response
     */
    (response) => {
      // Log successful responses in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`,
          {
            status: response.status,
            data: response.data,
          }
        );
      }
      return response;
    },
    /**
     * Handle response errors with retry logic and enhanced error handling
     * @param {ApiError} error - Response error
     * @returns {Promise<any>} Promise that may retry the request
     */
    async (error) => {
      const config = error.config;

      // Log error for debugging
      if (process.env.NODE_ENV === "development") {
        console.error("❌ API Error:", {
          method: config?.method,
          url: config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          data: error.response?.data,
        });
      }

      // Handle network errors and retries
      if (config && (!error.response || error.response.status >= 500)) {
        config.retryCount = config.retryCount || 0;
        const maxRetries = 3;

        if (config.retryCount < maxRetries) {
          config.retryCount += 1;
          const delayMs = config.retryCount * 1000;
          console.log(
            `🔄 Retrying request (${config.retryCount}/${maxRetries}) in ${delayMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return instance(config);
        }
      }

      // Handle specific error cases
      if (axios.isAxiosError(error) && error.response) {
        switch (error.response.status) {
          case 401:
            console.warn(
              "🔐 Unauthorized - clearing token and redirecting to login"
            );
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Only redirect if not already on login page
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
            break;
          case 403:
            console.error("🚫 Access denied - insufficient permissions");
            break;
          case 404:
            console.error("🔍 Resource not found");
            break;
          case 422:
            console.error("⚠️ Validation error:", error.response.data);
            break;
          case 429:
            console.error("⏰ Rate limit exceeded - please try again later");
            break;
          default:
            if (error.response.status >= 500) {
              console.error("🔥 Server error - please try again later");
            } else {
              console.error(
                "❌ API Error:",
                error.response?.data?.message || "Unknown error"
              );
            }
        }
      } else if (error.code === "ERR_NETWORK") {
        console.error("🌐 Network error - please check your connection");
      } else if (error.code === "ECONNABORTED") {
        console.error("⏰ Request timeout - please try again");
      }

      return Promise.reject(error);
    }
  );

  // Enhanced file operations helper methods
  const fileOperations = {
    /**
     * Upload file to the server with progress tracking
     * @param {string} url - Upload endpoint URL
     * @param {FormData} formData - Form data containing the file
     * @param {FileUploadConfig} [config] - Optional configuration for the upload
     * @returns {Promise<AxiosApiResponse>} Upload response
     */
    upload: async (url, formData, config = {}) => {
      return instance.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          "Content-Type": "multipart/form-data",
        },
        timeout: config.timeout || 60000, // Longer timeout for file uploads
      });
    },

    /**
     * Download file from the server
     * @param {string} url - Download endpoint URL
     * @param {string} filename - Name to save the file as
     * @param {object} [config] - Optional configuration for the download
     * @returns {Promise<AxiosApiResponse>} Download response
     */
    download: async (url, filename, config = {}) => {
      try {
        const response = await instance.get(url, {
          ...config,
          responseType: "blob",
          timeout: 60000, // Longer timeout for downloads
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
        console.error("❌ Download failed:", error);
        throw error;
      }
    },
  };

  // Return enhanced instance with endpoints
  return {
    ...instance,
    ...fileOperations,

    // Health check endpoints
    health: {
      /**
       * Check API health status
       * @returns {Promise<AxiosApiResponse>} Health check response
       */
      check: () => instance.get("/health"),

      /**
       * Test database connection
       * @returns {Promise<AxiosApiResponse>} Database test response
       */
      dbTest: () => instance.get("/db-test"),
    },

    // Enhanced authentication endpoints
    auth: {
      /**
       * Authenticate user with email or username
       * @param {string} emailOrUsername - User's email address or username
       * @param {string} password - User's password
       * @returns {Promise<AxiosApiResponse>} Authentication response
       */
      login: (emailOrUsername, password) => {
        // Backend expects either email OR username, not both
        const payload = { password };

        // Determine if it's email or username
        if (emailOrUsername.includes("@")) {
          payload.email = emailOrUsername;
        } else {
          payload.username = emailOrUsername;
        }

        console.log("🔐 API: Sending login request with:", {
          hasEmail: !!payload.email,
          hasUsername: !!payload.username,
          hasPassword: !!payload.password,
        });

        return instance.post("/auth/login", payload);
      },

      /**
       * Register new user
       * @param {object} userData - User registration data
       * @property {string} userData.email - User's email address
       * @property {string} userData.password - User's password
       * @property {string} userData.firstName - User's first name
       * @property {string} userData.lastName - User's last name
       * @property {string} [userData.username] - User's username
       * @property {string} userData.role - User's role (student, teacher, admin)
       * @returns {Promise<AxiosApiResponse>} Registration response
       */
      register: (userData) => {
        console.log("📝 API: Sending registration request");
        return instance.post("/auth/register", userData);
      },

      /**
       * Log out the current user
       * @returns {Promise<AxiosApiResponse>} Logout response
       */
      logout: () => {
        console.log("👋 API: Sending logout request");
        return instance.post("/auth/logout");
      },

      /**
       * Verify current authentication status
       * @returns {Promise<AxiosApiResponse>} Verification response
       */
      verify: () => {
        console.log("🔍 API: Verifying authentication");
        return instance.get("/auth/verify");
      },

      /**
       * Get current user profile
       * @returns {Promise<AxiosApiResponse>} User profile response
       */
      getProfile: () => {
        console.log("👤 API: Getting user profile");
        return instance.get("/auth/me");
      },

      /**
       * Request password reset for email
       * @param {string} email - User's email address
       * @returns {Promise<AxiosApiResponse>} Reset request response
       */
      requestPasswordReset: (email) => {
        console.log("🔄 API: Requesting password reset for:", email);
        return instance.post("/auth/request-password-reset", { email });
      },

      /**
       * Reset password with token
       * @param {string} token - Password reset token
       * @param {string} newPassword - New password to set
       * @returns {Promise<AxiosApiResponse>} Password reset response
       */
      resetPassword: (token, newPassword) => {
        console.log("🔑 API: Resetting password with token");
        return instance.post("/auth/reset-password", { token, newPassword });
      },

      /**
       * Verify email with token
       * @param {string} token - Email verification token
       * @returns {Promise<AxiosApiResponse>} Email verification response
       */
      verifyEmail: (token) => {
        console.log("📧 API: Verifying email with token");
        return instance.post(`/auth/verify-email/${token}`);
      },

      /**
       * Check if user exists
       * @param {string} email - Email to check
       * @returns {Promise<AxiosApiResponse>} User existence response
       */
      checkUser: (email) => {
        console.log("🔍 API: Checking if user exists:", email);
        return instance.get(`/auth/check-user/${email}`);
      },

      /**
       * Refresh access token
       * @param {string} refreshToken - Refresh token
       * @returns {Promise<AxiosApiResponse>} Token refresh response
       */
      refreshToken: (refreshToken) => {
        console.log("🔄 API: Refreshing access token");
        return instance.post("/auth/refresh-token", { refreshToken });
      },
    },

    users: {
      /**
       * Get list of users
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Users list response
       */
      getAll: (params) => instance.get("/users", { params }),

      /**
       * Get user by ID
       * @param {string} id - User identifier
       * @returns {Promise<AxiosApiResponse>} User details response
       */
      getById: (id) => instance.get(`/users/${id}`),

      /**
       * Create new user
       * @param {object} data - User data
       * @returns {Promise<AxiosApiResponse>} Created user response
       */
      create: (data) => instance.post("/users", data),

      /**
       * Update existing user
       * @param {string} id - User identifier
       * @param {object} data - Updated user data
       * @returns {Promise<AxiosApiResponse>} Updated user response
       */
      update: (id, data) => instance.put(`/users/${id}`, data),

      /**
       * Delete user
       * @param {string} id - User identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (id) => instance.delete(`/users/${id}`),

      /**
       * Get users by role
       * @param {string} role - User role (student, teacher, admin, parent)
       * @param {QueryParams} [params] - Additional query parameters
       * @returns {Promise<AxiosApiResponse>} Users by role response
       */
      getByRole: (role, params) =>
        instance.get(`/users/role/${role}`, { params }),

      /**
       * Update user profile
       * @param {string} id - User identifier
       * @param {object} profileData - Profile data to update
       * @returns {Promise<AxiosApiResponse>} Updated profile response
       */
      updateProfile: (id, profileData) =>
        instance.patch(`/users/${id}/profile`, profileData),

      /**
       * Upload user avatar
       * @param {string} id - User identifier
       * @param {File} file - Avatar image file
       * @returns {Promise<AxiosApiResponse>} Avatar upload response
       */
      uploadAvatar: (id, file) => {
        const formData = new FormData();
        formData.append("avatar", file);
        return fileOperations.upload(`/users/${id}/avatar`, formData);
      },
    },

    classes: {
      /**
       * Get list of classes
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Classes list response
       */
      getAll: (params) => instance.get("/classes", { params }),

      /**
       * Get class by ID
       * @param {string} id - Class identifier
       * @returns {Promise<AxiosApiResponse>} Class details response
       */
      getById: (id) => instance.get(`/classes/${id}`),

      /**
       * Create new class
       * @param {object} data - Class data
       * @returns {Promise<AxiosApiResponse>} Created class response
       */
      create: (data) => instance.post("/classes", data),

      /**
       * Update existing class
       * @param {string} id - Class identifier
       * @param {object} data - Updated class data
       * @returns {Promise<AxiosApiResponse>} Updated class response
       */
      update: (id, data) => instance.put(`/classes/${id}`, data),

      /**
       * Delete class
       * @param {string} id - Class identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (id) => instance.delete(`/classes/${id}`),

      /**
       * Get students in class
       * @param {string} classId - Class identifier
       * @returns {Promise<AxiosApiResponse>} Class students response
       */
      getStudents: (classId) => instance.get(`/classes/${classId}/students`),

      /**
       * Add student to class
       * @param {string} classId - Class identifier
       * @param {string} studentId - Student identifier
       * @returns {Promise<AxiosApiResponse>} Add student response
       */
      addStudent: (classId, studentId) =>
        instance.post(`/classes/${classId}/students`, { studentId }),

      /**
       * Remove student from class
       * @param {string} classId - Class identifier
       * @param {string} studentId - Student identifier
       * @returns {Promise<AxiosApiResponse>} Remove student response
       */
      removeStudent: (classId, studentId) =>
        instance.delete(`/classes/${classId}/students/${studentId}`),

      /**
       * Get teachers assigned to class
       * @param {string} classId - Class identifier
       * @returns {Promise<AxiosApiResponse>} Class teachers response
       */
      getTeachers: (classId) => instance.get(`/classes/${classId}/teachers`),

      /**
       * Assign teacher to class
       * @param {string} classId - Class identifier
       * @param {string} teacherId - Teacher identifier
       * @param {string} subjectId - Subject identifier
       * @returns {Promise<AxiosApiResponse>} Assign teacher response
       */
      assignTeacher: (classId, teacherId, subjectId) =>
        instance.post(`/classes/${classId}/teachers`, { teacherId, subjectId }),
    },

    assignments: {
      /**
       * Get list of assignments
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Assignments list response
       */
      getAll: (params) => instance.get("/assignments", { params }),

      /**
       * Get assignment by ID
       * @param {string} assignmentId - Assignment identifier
       * @returns {Promise<AxiosApiResponse>} Assignment details response
       */
      getById: (assignmentId) => instance.get(`/assignments/${assignmentId}`),

      /**
       * Create new assignment
       * @param {object} assignmentData - Assignment data
       * @returns {Promise<AxiosApiResponse>} Created assignment response
       */
      create: (assignmentData) => instance.post("/assignments", assignmentData),

      /**
       * Update existing assignment
       * @param {string} assignmentId - Assignment identifier
       * @param {object} assignmentData - Updated assignment data
       * @returns {Promise<AxiosApiResponse>} Updated assignment response
       */
      update: (assignmentId, assignmentData) =>
        instance.put(`/assignments/${assignmentId}`, assignmentData),

      /**
       * Delete assignment
       * @param {string} assignmentId - Assignment identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (assignmentId) => instance.delete(`/assignments/${assignmentId}`),

      /**
       * Get submissions for assignment
       * @param {string} assignmentId - Assignment identifier
       * @returns {Promise<AxiosApiResponse>} Assignment submissions response
       */
      getSubmissions: (assignmentId) =>
        instance.get(`/assignments/${assignmentId}/submissions`),

      /**
       * Submit assignment
       * @param {string} assignmentId - Assignment identifier
       * @param {object} submissionData - Submission data
       * @returns {Promise<AxiosApiResponse>} Submission response
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
       * @returns {Promise<AxiosApiResponse>} Grade submission response
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
       * @returns {Promise<AxiosApiResponse>} Upload response
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
       * @returns {Promise<AxiosApiResponse>} Class attendance response
       */
      getByClass: (classId, date) =>
        instance.get(`/attendance/class/${classId}`, { params: { date } }),

      /**
       * Get student attendance for date range
       * @param {string} studentId - Student identifier
       * @param {string} startDate - Start date
       * @param {string} endDate - End date
       * @returns {Promise<AxiosApiResponse>} Student attendance response
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
       * @returns {Promise<AxiosApiResponse>} Mark attendance response
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
       * @returns {Promise<AxiosApiResponse>} Updated attendance response
       */
      updateAttendance: (attendanceId, updateData) =>
        instance.patch(`/attendance/${attendanceId}`, updateData),

      /**
       * Get attendance report for class
       * @param {string} classId - Class identifier
       * @param {string} startDate - Start date
       * @param {string} endDate - End date
       * @returns {Promise<AxiosApiResponse>} Attendance report response
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
       * @returns {Promise<AxiosApiResponse>} Class grades response
       */
      getByClass: (classId) => instance.get(`/grades/class/${classId}`),

      /**
       * Get grades by student
       * @param {string} studentId - Student identifier
       * @returns {Promise<AxiosApiResponse>} Student grades response
       */
      getByStudent: (studentId) => instance.get(`/grades/student/${studentId}`),

      /**
       * Enter grades for class subject
       * @param {string} classId - Class identifier
       * @param {string} subjectId - Subject identifier
       * @param {object} gradesData - Grades data
       * @returns {Promise<AxiosApiResponse>} Enter grades response
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
       * @returns {Promise<AxiosApiResponse>} Updated grade response
       */
      updateGrade: (gradeId, updateData) =>
        instance.patch(`/grades/${gradeId}`, updateData),

      /**
       * Generate student report card
       * @param {string} studentId - Student identifier
       * @param {string} term - Academic term
       * @returns {Promise<AxiosApiResponse>} Report card response
       */
      generateReport: (studentId, term) =>
        instance.get(`/grades/student/${studentId}/report`, {
          params: { term },
        }),

      /**
       * Download student report card
       * @param {string} studentId - Student identifier
       * @param {string} term - Academic term
       * @returns {Promise<AxiosApiResponse>} Report download response
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
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Messages list response
       */
      getAll: (params) => instance.get("/messages", { params }),

      /**
       * Get message by ID
       * @param {string} messageId - Message identifier
       * @returns {Promise<AxiosApiResponse>} Message details response
       */
      getById: (messageId) => instance.get(`/messages/${messageId}`),

      /**
       * Send new message
       * @param {object} messageData - Message data
       * @returns {Promise<AxiosApiResponse>} Sent message response
       */
      send: (messageData) => instance.post("/messages", messageData),

      /**
       * Mark message as read
       * @param {string} messageId - Message identifier
       * @returns {Promise<AxiosApiResponse>} Mark read response
       */
      markAsRead: (messageId) => instance.patch(`/messages/${messageId}/read`),

      /**
       * Delete message
       * @param {string} messageId - Message identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (messageId) => instance.delete(`/messages/${messageId}`),
    },

    events: {
      /**
       * Get list of events
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Events list response
       */
      getAll: (params) => instance.get("/events", { params }),

      /**
       * Get event by ID
       * @param {string} eventId - Event identifier
       * @returns {Promise<AxiosApiResponse>} Event details response
       */
      getById: (eventId) => instance.get(`/events/${eventId}`),

      /**
       * Create new event
       * @param {object} eventData - Event data
       * @returns {Promise<AxiosApiResponse>} Created event response
       */
      create: (eventData) => instance.post("/events", eventData),

      /**
       * Update existing event
       * @param {string} eventId - Event identifier
       * @param {object} eventData - Updated event data
       * @returns {Promise<AxiosApiResponse>} Updated event response
       */
      update: (eventId, eventData) =>
        instance.put(`/events/${eventId}`, eventData),

      /**
       * Delete event
       * @param {string} eventId - Event identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (eventId) => instance.delete(`/events/${eventId}`),

      /**
       * Get events by date range
       * @param {string} startDate - Start date
       * @param {string} endDate - End date
       * @returns {Promise<AxiosApiResponse>} Events in range response
       */
      getByDate: (startDate, endDate) =>
        instance.get("/events/range", { params: { startDate, endDate } }),
    },

    fees: {
      /**
       * Get list of fees
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Fees list response
       */
      getAll: (params) => instance.get("/fees", { params }),

      /**
       * Get fee by ID
       * @param {string} feeId - Fee identifier
       * @returns {Promise<AxiosApiResponse>} Fee details response
       */
      getById: (feeId) => instance.get(`/fees/${feeId}`),

      /**
       * Create new fee
       * @param {object} feeData - Fee data
       * @returns {Promise<AxiosApiResponse>} Created fee response
       */
      create: (feeData) => instance.post("/fees", feeData),

      /**
       * Update existing fee
       * @param {string} feeId - Fee identifier
       * @param {object} feeData - Updated fee data
       * @returns {Promise<AxiosApiResponse>} Updated fee response
       */
      update: (feeId, feeData) => instance.put(`/fees/${feeId}`, feeData),

      /**
       * Delete fee
       * @param {string} feeId - Fee identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (feeId) => instance.delete(`/fees/${feeId}`),

      /**
       * Get student fees
       * @param {string} studentId - Student identifier
       * @returns {Promise<AxiosApiResponse>} Student fees response
       */
      getStudentFees: (studentId) => instance.get(`/fees/student/${studentId}`),

      /**
       * Record fee payment
       * @param {string} feeId - Fee identifier
       * @param {object} paymentData - Payment data
       * @returns {Promise<AxiosApiResponse>} Payment record response
       */
      recordPayment: (feeId, paymentData) =>
        instance.post(`/fees/${feeId}/payments`, paymentData),

      /**
       * Generate fee invoice
       * @param {string} feeId - Fee identifier
       * @returns {Promise<AxiosApiResponse>} Invoice response
       */
      generateInvoice: (feeId) => instance.get(`/fees/${feeId}/invoice`),

      /**
       * Download fee invoice
       * @param {string} feeId - Fee identifier
       * @returns {Promise<AxiosApiResponse>} Invoice download response
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
       * @param {QueryParams} [params] - Query parameters for filtering
       * @returns {Promise<AxiosApiResponse>} Attendance stats response
       */
      getAttendanceStats: (params) =>
        instance.get("/analytics/attendance", { params }),

      /**
       * Get grade statistics
       * @param {QueryParams} [params] - Query parameters for filtering
       * @returns {Promise<AxiosApiResponse>} Grade stats response
       */
      getGradeStats: (params) => instance.get("/analytics/grades", { params }),

      /**
       * Get financial statistics
       * @param {QueryParams} [params] - Query parameters for filtering
       * @returns {Promise<AxiosApiResponse>} Financial stats response
       */
      getFinancialStats: (params) =>
        instance.get("/analytics/finance", { params }),

      /**
       * Generate analytics report
       * @param {string} reportType - Type of report to generate
       * @param {QueryParams} [params] - Query parameters for filtering
       * @returns {Promise<AxiosApiResponse>} Generated report response
       */
      generateReport: (reportType, params) =>
        instance.get(`/analytics/reports/${reportType}`, { params }),

      /**
       * Download analytics report
       * @param {string} reportType - Type of report to download
       * @param {QueryParams} [params] - Query parameters for filtering
       * @returns {Promise<AxiosApiResponse>} Report download response
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
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Schedules list response
       */
      getAll: (params) => instance.get("/schedules", { params }),

      /**
       * Get schedule by ID
       * @param {string} scheduleId - Schedule identifier
       * @returns {Promise<AxiosApiResponse>} Schedule details response
       */
      getById: (scheduleId) => instance.get(`/schedules/${scheduleId}`),

      /**
       * Create new schedule
       * @param {object} scheduleData - Schedule data
       * @returns {Promise<AxiosApiResponse>} Created schedule response
       */
      create: (scheduleData) => instance.post("/schedules", scheduleData),

      /**
       * Update existing schedule
       * @param {string} scheduleId - Schedule identifier
       * @param {object} scheduleData - Updated schedule data
       * @returns {Promise<AxiosApiResponse>} Updated schedule response
       */
      update: (scheduleId, scheduleData) =>
        instance.put(`/schedules/${scheduleId}`, scheduleData),

      /**
       * Delete schedule
       * @param {string} scheduleId - Schedule identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (scheduleId) => instance.delete(`/schedules/${scheduleId}`),

      /**
       * Get teacher schedule
       * @param {string} teacherId - Teacher identifier
       * @returns {Promise<AxiosApiResponse>} Teacher schedule response
       */
      getByTeacher: (teacherId) =>
        instance.get(`/schedules/teacher/${teacherId}`),

      /**
       * Get class schedule
       * @param {string} classId - Class identifier
       * @returns {Promise<AxiosApiResponse>} Class schedule response
       */
      getByClass: (classId) => instance.get(`/schedules/class/${classId}`),

      /**
       * Get room schedule
       * @param {string} roomId - Room identifier
       * @returns {Promise<AxiosApiResponse>} Room schedule response
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
 *   setError: (error: any) => void,
 *   clearError: () => void
 * }} Hook returns
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {any} */ (null));
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

  /**
   * Clear current error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    data,
    execute,
    setError,
    clearError,
  };
};

// Create and export API instance
const api = createApiInstance();
export default api;
