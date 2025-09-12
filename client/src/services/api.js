// @ts-nocheck
import { useState } from "react";
import axios from "axios";
import demoDataService from "./demoDataService.js"; // Import demo service

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
 * Check if currently in demo mode
 * @returns {boolean} Whether demo mode is active
 */
const isDemoMode = () => {
  // Check if we're on a demo path or demo mode is stored in sessionStorage
  const demoPath = window.location.pathname.startsWith("/demo");
  const demoSession = sessionStorage.getItem("demo_mode") === "true";
  return demoPath || demoSession;
};

/**
 * Create a mock AxiosResponse from demo data
 * @param {any} data - Demo response data
 * @returns {Promise<AxiosApiResponse>} Mock axios response
 */
const createMockAxiosResponse = async (data) => {
  const demoResponse = await data;
  // @ts-ignore - Creating mock response for demo mode
  return {
    data: demoResponse.data || demoResponse,
    status: demoResponse.statusCode || 200,
    statusText: "OK",
    headers: {},
    config: {
      method: "get",
      url: "/demo",
      headers: {},
    },
    request: {},
  };
};

/**
 * Route API call to demo or real service
 * @param {Function} realApiCall - Real API function
 * @param {Function} demoApiCall - Demo API function
 * @returns {Promise<AxiosApiResponse>} API response
 */
const routeApiCall = (realApiCall, demoApiCall) => {
  return isDemoMode() ? createMockAxiosResponse(demoApiCall()) : realApiCall();
};

/**
 * Creates an axios instance with extended functionality and demo detection
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
      // Skip real API calls if in demo mode
      if (isDemoMode()) {
        console.log(`🎭 Demo Mode: Skipping real API call to ${config.url}`);
        return config;
      }

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
      return routeApiCall(
        () =>
          instance.post(url, formData, {
            ...config,
            headers: {
              ...config.headers,
              "Content-Type": "multipart/form-data",
            },
            timeout: config.timeout || 60000, // Longer timeout for file uploads
          }),
        () =>
          demoDataService.mockResponse(
            {
              url: `https://demo.edu/uploads/${Date.now()}.jpg`,
            },
            "File uploaded successfully"
          )
      );
    },

    /**
     * Download file from the server
     * @param {string} url - Download endpoint URL
     * @param {string} filename - Name to save the file as
     * @param {object} [config] - Optional configuration for the download
     * @returns {Promise<AxiosApiResponse>} Download response
     */
    download: async (url, filename, config = {}) => {
      if (isDemoMode()) {
        // Simulate download in demo mode
        await demoDataService.simulateDelay(1000);
        console.log(`🎭 Demo: Would download ${filename} from ${url}`);
        return demoDataService.mockResponse(
          {
            downloadUrl: `https://demo.edu/downloads/${filename}`,
          },
          "Download ready (demo mode)"
        );
      }

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

    // Demo utilities
    isDemoMode,
    getDemoWarning: () =>
      isDemoMode() ? demoDataService.getDemoWarning() : null,

    // Health check endpoints
    health: {
      /**
       * Check API health status
       * @returns {Promise<AxiosApiResponse>} Health check response
       */
      check: () =>
        routeApiCall(
          () => instance.get("/health"),
          () => demoDataService.mockResponse({ status: "ok", mode: "demo" })
        ),

      /**
       * Test database connection
       * @returns {Promise<AxiosApiResponse>} Database test response
       */
      dbTest: () =>
        routeApiCall(
          () => instance.get("/db-test"),
          () =>
            demoDataService.mockResponse({ status: "connected", mode: "demo" })
        ),
    },

    // Enhanced authentication endpoints (always use real API for auth)
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
      getAll: (params) =>
        routeApiCall(
          () => instance.get("/users", { params }),
          () => demoDataService.users.getAll(params)
        ),

      /**
       * Get user by ID
       * @param {string} id - User identifier
       * @returns {Promise<AxiosApiResponse>} User details response
       */
      getById: (id) =>
        routeApiCall(
          () => instance.get(`/users/${id}`),
          () => demoDataService.users.getById(id)
        ),

      /**
       * Create new user
       * @param {object} data - User data
       * @returns {Promise<AxiosApiResponse>} Created user response
       */
      create: (data) =>
        routeApiCall(
          () => instance.post("/users", data),
          () => demoDataService.users.create(data)
        ),

      /**
       * Update existing user
       * @param {string} id - User identifier
       * @param {object} data - Updated user data
       * @returns {Promise<AxiosApiResponse>} Updated user response
       */
      update: (id, data) =>
        routeApiCall(
          () => instance.put(`/users/${id}`, data),
          () => demoDataService.users.update(id, data)
        ),

      /**
       * Delete user
       * @param {string} id - User identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (id) =>
        routeApiCall(
          () => instance.delete(`/users/${id}`),
          () => demoDataService.users.delete(id)
        ),

      /**
       * Get users by role
       * @param {string} role - User role (student, teacher, admin, parent)
       * @param {QueryParams} [params] - Additional query parameters
       * @returns {Promise<AxiosApiResponse>} Users by role response
       */
      getByRole: (role, params) =>
        routeApiCall(
          () => instance.get(`/users/role/${role}`, { params }),
          () => demoDataService.users.getByRole(role, params)
        ),

      /**
       * Update user profile
       * @param {string} id - User identifier
       * @param {object} profileData - Profile data to update
       * @returns {Promise<AxiosApiResponse>} Updated profile response
       */
      updateProfile: (id, profileData) =>
        routeApiCall(
          () => instance.patch(`/users/${id}/profile`, profileData),
          () => demoDataService.users.updateProfile(id, profileData)
        ),

      /**
       * Upload user avatar
       * @param {string} id - User identifier
       * @param {File} file - Avatar image file
       * @returns {Promise<AxiosApiResponse>} Avatar upload response
       */
      uploadAvatar: (id, file) =>
        routeApiCall(
          () => {
            const formData = new FormData();
            formData.append("avatar", file);
            return fileOperations.upload(`/users/${id}/avatar`, formData);
          },
          () => demoDataService.users.uploadAvatar(id, file)
        ),
    },

    classes: {
      /**
       * Get list of classes
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Classes list response
       */
      getAll: (params) =>
        routeApiCall(
          () => instance.get("/classes", { params }),
          () => demoDataService.classes.getAll(params)
        ),

      /**
       * Get class by ID
       * @param {string} id - Class identifier
       * @returns {Promise<AxiosApiResponse>} Class details response
       */
      getById: (id) =>
        routeApiCall(
          () => instance.get(`/classes/${id}`),
          () => demoDataService.classes.getById(id)
        ),

      /**
       * Create new class
       * @param {object} data - Class data
       * @returns {Promise<AxiosApiResponse>} Created class response
       */
      create: (data) =>
        routeApiCall(
          () => instance.post("/classes", data),
          () => demoDataService.classes.create(data)
        ),

      /**
       * Update existing class
       * @param {string} id - Class identifier
       * @param {object} data - Updated class data
       * @returns {Promise<AxiosApiResponse>} Updated class response
       */
      update: (id, data) =>
        routeApiCall(
          () => instance.put(`/classes/${id}`, data),
          () => demoDataService.classes.update(id, data)
        ),

      /**
       * Delete class
       * @param {string} id - Class identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (id) =>
        routeApiCall(
          () => instance.delete(`/classes/${id}`),
          () => demoDataService.classes.delete(id)
        ),

      /**
       * Get students in class
       * @param {string} classId - Class identifier
       * @returns {Promise<AxiosApiResponse>} Class students response
       */
      getStudents: (classId) =>
        routeApiCall(
          () => instance.get(`/classes/${classId}/students`),
          () => demoDataService.classes.getStudents(classId)
        ),

      /**
       * Add student to class
       * @param {string} classId - Class identifier
       * @param {string} studentId - Student identifier
       * @returns {Promise<AxiosApiResponse>} Add student response
       */
      addStudent: (classId, studentId) =>
        routeApiCall(
          () => instance.post(`/classes/${classId}/students`, { studentId }),
          () => demoDataService.classes.addStudent(classId, studentId)
        ),

      /**
       * Remove student from class
       * @param {string} classId - Class identifier
       * @param {string} studentId - Student identifier
       * @returns {Promise<AxiosApiResponse>} Remove student response
       */
      removeStudent: (classId, studentId) =>
        routeApiCall(
          () => instance.delete(`/classes/${classId}/students/${studentId}`),
          () => demoDataService.classes.removeStudent(classId, studentId)
        ),

      /**
       * Get teachers assigned to class
       * @param {string} classId - Class identifier
       * @returns {Promise<AxiosApiResponse>} Class teachers response
       */
      getTeachers: (classId) =>
        routeApiCall(
          () => instance.get(`/classes/${classId}/teachers`),
          () => demoDataService.classes.getTeachers(classId)
        ),

      /**
       * Assign teacher to class
       * @param {string} classId - Class identifier
       * @param {string} teacherId - Teacher identifier
       * @param {string} subjectId - Subject identifier
       * @returns {Promise<AxiosApiResponse>} Assign teacher response
       */
      assignTeacher: (classId, teacherId, subjectId) =>
        routeApiCall(
          () =>
            instance.post(`/classes/${classId}/teachers`, {
              teacherId,
              subjectId,
            }),
          () =>
            demoDataService.classes.assignTeacher(classId, teacherId, subjectId)
        ),
    },

    assignments: {
      /**
       * Get list of assignments
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Assignments list response
       */
      getAll: (params) =>
        routeApiCall(
          () => instance.get("/assignments", { params }),
          () => demoDataService.assignments.getAll(params)
        ),

      /**
       * Get assignment by ID
       * @param {string} assignmentId - Assignment identifier
       * @returns {Promise<AxiosApiResponse>} Assignment details response
       */
      getById: (assignmentId) =>
        routeApiCall(
          () => instance.get(`/assignments/${assignmentId}`),
          () => demoDataService.assignments.getById(assignmentId)
        ),

      /**
       * Create new assignment
       * @param {object} assignmentData - Assignment data
       * @returns {Promise<AxiosApiResponse>} Created assignment response
       */
      create: (assignmentData) =>
        routeApiCall(
          () => instance.post("/assignments", assignmentData),
          () => demoDataService.assignments.create(assignmentData)
        ),

      /**
       * Update existing assignment
       * @param {string} assignmentId - Assignment identifier
       * @param {object} assignmentData - Updated assignment data
       * @returns {Promise<AxiosApiResponse>} Updated assignment response
       */
      update: (assignmentId, assignmentData) =>
        routeApiCall(
          () => instance.put(`/assignments/${assignmentId}`, assignmentData),
          () => demoDataService.assignments.update(assignmentId, assignmentData)
        ),

      /**
       * Delete assignment
       * @param {string} assignmentId - Assignment identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (assignmentId) =>
        routeApiCall(
          () => instance.delete(`/assignments/${assignmentId}`),
          () => demoDataService.assignments.delete(assignmentId)
        ),

      /**
       * Get submissions for assignment
       * @param {string} assignmentId - Assignment identifier
       * @returns {Promise<AxiosApiResponse>} Assignment submissions response
       */
      getSubmissions: (assignmentId) =>
        routeApiCall(
          () => instance.get(`/assignments/${assignmentId}/submissions`),
          () => demoDataService.assignments.getSubmissions(assignmentId)
        ),

      /**
       * Submit assignment
       * @param {string} assignmentId - Assignment identifier
       * @param {object} submissionData - Submission data
       * @returns {Promise<AxiosApiResponse>} Submission response
       */
      submitAssignment: (assignmentId, submissionData) =>
        routeApiCall(
          () =>
            instance.post(
              `/assignments/${assignmentId}/submissions`,
              submissionData
            ),
          () =>
            demoDataService.assignments.submitAssignment(
              assignmentId,
              submissionData
            )
        ),

      /**
       * Grade assignment submission
       * @param {string} assignmentId - Assignment identifier
       * @param {string} submissionId - Submission identifier
       * @param {object} gradeData - Grade data
       * @returns {Promise<AxiosApiResponse>} Grade submission response
       */
      gradeSubmission: (assignmentId, submissionId, gradeData) =>
        routeApiCall(
          () =>
            instance.post(
              `/assignments/${assignmentId}/submissions/${submissionId}/grade`,
              gradeData
            ),
          () =>
            demoDataService.assignments.gradeSubmission(
              assignmentId,
              submissionId,
              gradeData
            )
        ),

      /**
       * Upload assignment attachment
       * @param {string} assignmentId - Assignment identifier
       * @param {File} file - File to upload
       * @returns {Promise<AxiosApiResponse>} Upload response
       */
      uploadAttachment: (assignmentId, file) =>
        routeApiCall(
          () => {
            const formData = new FormData();
            formData.append("file", file);
            return fileOperations.upload(
              `/assignments/${assignmentId}/attachments`,
              formData
            );
          },
          () => demoDataService.assignments.uploadAttachment(assignmentId, file)
        ),
    },

    attendance: {
      /**
       * Get class attendance for date
       * @param {string} classId - Class identifier
       * @param {string} date - Date to get attendance for
       * @returns {Promise<AxiosApiResponse>} Class attendance response
       */
      getByClass: (classId, date) =>
        routeApiCall(
          () =>
            instance.get(`/attendance/class/${classId}`, { params: { date } }),
          () => demoDataService.attendance.getByClass(classId, date)
        ),

      /**
       * Get student attendance for date range
       * @param {string} studentId - Student identifier
       * @param {string} startDate - Start date
       * @param {string} endDate - End date
       * @returns {Promise<AxiosApiResponse>} Student attendance response
       */
      getByStudent: (studentId, startDate, endDate) =>
        routeApiCall(
          () =>
            instance.get(`/attendance/student/${studentId}`, {
              params: { startDate, endDate },
            }),
          () =>
            demoDataService.attendance.getByStudent(
              studentId,
              startDate,
              endDate
            )
        ),

      /**
       * Mark attendance for class
       * @param {string} classId - Class identifier
       * @param {string} date - Attendance date
       * @param {object} attendanceData - Attendance data
       * @returns {Promise<AxiosApiResponse>} Mark attendance response
       */
      markAttendance: (classId, date, attendanceData) =>
        routeApiCall(
          () =>
            instance.post(`/attendance/class/${classId}`, {
              date,
              ...attendanceData,
            }),
          () =>
            demoDataService.attendance.markAttendance(
              classId,
              date,
              attendanceData
            )
        ),

      /**
       * Update attendance record
       * @param {string} attendanceId - Attendance record identifier
       * @param {object} updateData - Updated attendance data
       * @returns {Promise<AxiosApiResponse>} Updated attendance response
       */
      updateAttendance: (attendanceId, updateData) =>
        routeApiCall(
          () => instance.patch(`/attendance/${attendanceId}`, updateData),
          () =>
            demoDataService.attendance.updateAttendance(
              attendanceId,
              updateData
            )
        ),

      /**
       * Get attendance report for class
       * @param {string} classId - Class identifier
       * @param {string} startDate - Start date
       * @param {string} endDate - End date
       * @returns {Promise<AxiosApiResponse>} Attendance report response
       */
      getReport: (classId, startDate, endDate) =>
        routeApiCall(
          () =>
            instance.get(`/attendance/class/${classId}/report`, {
              params: { startDate, endDate },
            }),
          () =>
            demoDataService.attendance.getReport(classId, startDate, endDate)
        ),
    },

    grades: {
      /**
       * Get grades by class
       * @param {string} classId - Class identifier
       * @returns {Promise<AxiosApiResponse>} Class grades response
       */
      getByClass: (classId) =>
        routeApiCall(
          () => instance.get(`/grades/class/${classId}`),
          () => demoDataService.grades.getByClass(classId)
        ),

      /**
       * Get grades by student
       * @param {string} studentId - Student identifier
       * @returns {Promise<AxiosApiResponse>} Student grades response
       */
      getByStudent: (studentId) =>
        routeApiCall(
          () => instance.get(`/grades/student/${studentId}`),
          () => demoDataService.grades.getByStudent(studentId)
        ),

      /**
       * Enter grades for class subject
       * @param {string} classId - Class identifier
       * @param {string} subjectId - Subject identifier
       * @param {object} gradesData - Grades data
       * @returns {Promise<AxiosApiResponse>} Enter grades response
       */
      enterGrades: (classId, subjectId, gradesData) =>
        routeApiCall(
          () =>
            instance.post(
              `/grades/class/${classId}/subject/${subjectId}`,
              gradesData
            ),
          () =>
            demoDataService.grades.enterGrades(classId, subjectId, gradesData)
        ),

      /**
       * Update grade record
       * @param {string} gradeId - Grade identifier
       * @param {object} updateData - Updated grade data
       * @returns {Promise<AxiosApiResponse>} Updated grade response
       */
      updateGrade: (gradeId, updateData) =>
        routeApiCall(
          () => instance.patch(`/grades/${gradeId}`, updateData),
          () => demoDataService.grades.updateGrade(gradeId, updateData)
        ),

      /**
       * Generate student report card
       * @param {string} studentId - Student identifier
       * @param {string} term - Academic term
       * @returns {Promise<AxiosApiResponse>} Report card response
       */
      generateReport: (studentId, term) =>
        routeApiCall(
          () =>
            instance.get(`/grades/student/${studentId}/report`, {
              params: { term },
            }),
          () => demoDataService.grades.generateReport(studentId, term)
        ),

      /**
       * Download student report card
       * @param {string} studentId - Student identifier
       * @param {string} term - Academic term
       * @returns {Promise<AxiosApiResponse>} Report download response
       */
      downloadReport: (studentId, term) =>
        routeApiCall(
          () =>
            fileOperations.download(
              `/grades/student/${studentId}/report/download`,
              `report-${term}.pdf`
            ),
          () => demoDataService.grades.downloadReport(studentId, term)
        ),
    },

    messages: {
      /**
       * Get list of messages
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Messages list response
       */
      getAll: (params) =>
        routeApiCall(
          () => instance.get("/messages", { params }),
          () => demoDataService.messages.getAll(params)
        ),

      /**
       * Get message by ID
       * @param {string} messageId - Message identifier
       * @returns {Promise<AxiosApiResponse>} Message details response
       */
      getById: (messageId) =>
        routeApiCall(
          () => instance.get(`/messages/${messageId}`),
          () => demoDataService.messages.getById(messageId)
        ),

      /**
       * Send new message
       * @param {object} messageData - Message data
       * @returns {Promise<AxiosApiResponse>} Sent message response
       */
      send: (messageData) =>
        routeApiCall(
          () => instance.post("/messages", messageData),
          () => demoDataService.messages.send(messageData)
        ),

      /**
       * Mark message as read
       * @param {string} messageId - Message identifier
       * @returns {Promise<AxiosApiResponse>} Mark read response
       */
      markAsRead: (messageId) =>
        routeApiCall(
          () => instance.patch(`/messages/${messageId}/read`),
          () => demoDataService.messages.markAsRead(messageId)
        ),

      /**
       * Delete message
       * @param {string} messageId - Message identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (messageId) =>
        routeApiCall(
          () => instance.delete(`/messages/${messageId}`),
          () => demoDataService.messages.delete(messageId)
        ),
    },

    events: {
      /**
       * Get list of events
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Events list response
       */
      getAll: (params) =>
        routeApiCall(
          () => instance.get("/events", { params }),
          () => demoDataService.events.getAll(params)
        ),

      /**
       * Get event by ID
       * @param {string} eventId - Event identifier
       * @returns {Promise<AxiosApiResponse>} Event details response
       */
      getById: (eventId) =>
        routeApiCall(
          () => instance.get(`/events/${eventId}`),
          () => demoDataService.events.getById(eventId)
        ),

      /**
       * Create new event
       * @param {object} eventData - Event data
       * @returns {Promise<AxiosApiResponse>} Created event response
       */
      create: (eventData) =>
        routeApiCall(
          () => instance.post("/events", eventData),
          () => demoDataService.events.create(eventData)
        ),

      /**
       * Update existing event
       * @param {string} eventId - Event identifier
       * @param {object} eventData - Updated event data
       * @returns {Promise<AxiosApiResponse>} Updated event response
       */
      update: (eventId, eventData) =>
        routeApiCall(
          () => instance.put(`/events/${eventId}`, eventData),
          () => demoDataService.events.update(eventId, eventData)
        ),

      /**
       * Delete event
       * @param {string} eventId - Event identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (eventId) =>
        routeApiCall(
          () => instance.delete(`/events/${eventId}`),
          () => demoDataService.events.delete(eventId)
        ),

      /**
       * Get events by date range
       * @param {string} startDate - Start date
       * @param {string} endDate - End date
       * @returns {Promise<AxiosApiResponse>} Events in range response
       */
      getByDate: (startDate, endDate) =>
        routeApiCall(
          () =>
            instance.get("/events/range", { params: { startDate, endDate } }),
          () => demoDataService.events.getByDate(startDate, endDate)
        ),
    },

    fees: {
      /**
       * Get list of fees
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Fees list response
       */
      getAll: (params) =>
        routeApiCall(
          () => instance.get("/fees", { params }),
          () => demoDataService.fees.getAll(params)
        ),

      /**
       * Get fee by ID
       * @param {string} feeId - Fee identifier
       * @returns {Promise<AxiosApiResponse>} Fee details response
       */
      getById: (feeId) =>
        routeApiCall(
          () => instance.get(`/fees/${feeId}`),
          () => demoDataService.fees.getById(feeId)
        ),

      /**
       * Create new fee
       * @param {object} feeData - Fee data
       * @returns {Promise<AxiosApiResponse>} Created fee response
       */
      create: (feeData) =>
        routeApiCall(
          () => instance.post("/fees", feeData),
          () => demoDataService.fees.create(feeData)
        ),

      /**
       * Update existing fee
       * @param {string} feeId - Fee identifier
       * @param {object} feeData - Updated fee data
       * @returns {Promise<AxiosApiResponse>} Updated fee response
       */
      update: (feeId, feeData) =>
        routeApiCall(
          () => instance.put(`/fees/${feeId}`, feeData),
          () => demoDataService.fees.update(feeId, feeData)
        ),

      /**
       * Delete fee
       * @param {string} feeId - Fee identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (feeId) =>
        routeApiCall(
          () => instance.delete(`/fees/${feeId}`),
          () => demoDataService.fees.delete(feeId)
        ),

      /**
       * Get student fees
       * @param {string} studentId - Student identifier
       * @returns {Promise<AxiosApiResponse>} Student fees response
       */
      getStudentFees: (studentId) =>
        routeApiCall(
          () => instance.get(`/fees/student/${studentId}`),
          () => demoDataService.fees.getStudentFees(studentId)
        ),

      /**
       * Record fee payment
       * @param {string} feeId - Fee identifier
       * @param {object} paymentData - Payment data
       * @returns {Promise<AxiosApiResponse>} Payment record response
       */
      recordPayment: (feeId, paymentData) =>
        routeApiCall(
          () => instance.post(`/fees/${feeId}/payments`, paymentData),
          () => demoDataService.fees.recordPayment(feeId, paymentData)
        ),

      /**
       * Generate fee invoice
       * @param {string} feeId - Fee identifier
       * @returns {Promise<AxiosApiResponse>} Invoice response
       */
      generateInvoice: (feeId) =>
        routeApiCall(
          () => instance.get(`/fees/${feeId}/invoice`),
          () => demoDataService.fees.generateInvoice(feeId)
        ),

      /**
       * Download fee invoice
       * @param {string} feeId - Fee identifier
       * @returns {Promise<AxiosApiResponse>} Invoice download response
       */
      downloadInvoice: (feeId) =>
        routeApiCall(
          () =>
            fileOperations.download(
              `/fees/${feeId}/invoice/download`,
              `invoice-${feeId}.pdf`
            ),
          () => demoDataService.fees.downloadInvoice(feeId)
        ),
    },

    analytics: {
      /**
       * Get attendance statistics
       * @param {QueryParams} [params] - Query parameters for filtering
       * @returns {Promise<AxiosApiResponse>} Attendance stats response
       */
      getAttendanceStats: (params) =>
        routeApiCall(
          () => instance.get("/analytics/attendance", { params }),
          () => demoDataService.analytics.getAttendanceStats(params)
        ),

      /**
       * Get grade statistics
       * @param {QueryParams} [params] - Query parameters for filtering
       * @returns {Promise<AxiosApiResponse>} Grade stats response
       */
      getGradeStats: (params) =>
        routeApiCall(
          () => instance.get("/analytics/grades", { params }),
          () => demoDataService.analytics.getGradeStats(params)
        ),

      /**
       * Get financial statistics
       * @param {QueryParams} [params] - Query parameters for filtering
       * @returns {Promise<AxiosApiResponse>} Financial stats response
       */
      getFinancialStats: (params) =>
        routeApiCall(
          () => instance.get("/analytics/finance", { params }),
          () => demoDataService.analytics.getFinancialStats(params)
        ),

      /**
       * Generate analytics report
       * @param {string} reportType - Type of report to generate
       * @param {QueryParams} [params] - Query parameters for filtering
       * @returns {Promise<AxiosApiResponse>} Generated report response
       */
      generateReport: (reportType, params) =>
        routeApiCall(
          () => instance.get(`/analytics/reports/${reportType}`, { params }),
          () => demoDataService.analytics.generateReport(reportType, params)
        ),

      /**
       * Download analytics report
       * @param {string} reportType - Type of report to download
       * @param {QueryParams} [params] - Query parameters for filtering
       * @returns {Promise<AxiosApiResponse>} Report download response
       */
      downloadReport: (reportType, params) =>
        routeApiCall(
          () =>
            fileOperations.download(
              `/analytics/reports/${reportType}/download`,
              `${reportType}-report.pdf`,
              { params }
            ),
          () => demoDataService.analytics.downloadReport(reportType, params)
        ),
    },

    schedule: {
      /**
       * Get list of schedules
       * @param {QueryParams} [params] - Query parameters for filtering and pagination
       * @returns {Promise<AxiosApiResponse>} Schedules list response
       */
      getAll: (params) =>
        routeApiCall(
          () => instance.get("/schedules", { params }),
          () => demoDataService.schedule.getAll(params)
        ),

      /**
       * Get schedule by ID
       * @param {string} scheduleId - Schedule identifier
       * @returns {Promise<AxiosApiResponse>} Schedule details response
       */
      getById: (scheduleId) =>
        routeApiCall(
          () => instance.get(`/schedules/${scheduleId}`),
          () => demoDataService.schedule.getById(scheduleId)
        ),

      /**
       * Create new schedule
       * @param {object} scheduleData - Schedule data
       * @returns {Promise<AxiosApiResponse>} Created schedule response
       */
      create: (scheduleData) =>
        routeApiCall(
          () => instance.post("/schedules", scheduleData),
          () => demoDataService.schedule.create(scheduleData)
        ),

      /**
       * Update existing schedule
       * @param {string} scheduleId - Schedule identifier
       * @param {object} scheduleData - Updated schedule data
       * @returns {Promise<AxiosApiResponse>} Updated schedule response
       */
      update: (scheduleId, scheduleData) =>
        routeApiCall(
          () => instance.put(`/schedules/${scheduleId}`, scheduleData),
          () => demoDataService.schedule.update(scheduleId, scheduleData)
        ),

      /**
       * Delete schedule
       * @param {string} scheduleId - Schedule identifier
       * @returns {Promise<AxiosApiResponse>} Deletion response
       */
      delete: (scheduleId) =>
        routeApiCall(
          () => instance.delete(`/schedules/${scheduleId}`),
          () => demoDataService.schedule.delete(scheduleId)
        ),

      /**
       * Get teacher schedule
       * @param {string} teacherId - Teacher identifier
       * @returns {Promise<AxiosApiResponse>} Teacher schedule response
       */
      getByTeacher: (teacherId) =>
        routeApiCall(
          () => instance.get(`/schedules/teacher/${teacherId}`),
          () => demoDataService.schedule.getByTeacher(teacherId)
        ),

      /**
       * Get class schedule
       * @param {string} classId - Class identifier
       * @returns {Promise<AxiosApiResponse>} Class schedule response
       */
      getByClass: (classId) =>
        routeApiCall(
          () => instance.get(`/schedules/class/${classId}`),
          () => demoDataService.schedule.getByClass(classId)
        ),

      /**
       * Get room schedule
       * @param {string} roomId - Room identifier
       * @returns {Promise<AxiosApiResponse>} Room schedule response
       */
      getByRoom: (roomId) =>
        routeApiCall(
          () => instance.get(`/schedules/room/${roomId}`),
          () => demoDataService.schedule.getByRoom(roomId)
        ),
    },

    // Dashboard helper methods
    dashboard: {
      /**
       * Get admin dashboard data
       * @returns {Promise<AxiosApiResponse>} Admin dashboard response
       */
      getAdminDashboardData: () =>
        routeApiCall(
          () =>
            Promise.all([
              instance.get("/analytics/attendance"),
              instance.get("/analytics/grades"),
              instance.get("/analytics/finance"),
            ]).then(([attendance, grades, financial]) => ({
              data: {
                attendance: attendance.data,
                grades: grades.data,
                financial: financial.data,
              },
            })),
          () => demoDataService.dashboard.getAdminDashboardData()
        ),

      /**
       * Get teacher dashboard data
       * @param {string} teacherId - Teacher identifier
       * @returns {Promise<AxiosApiResponse>} Teacher dashboard response
       */
      getTeacherDashboardData: (teacherId) =>
        routeApiCall(
          () =>
            Promise.all([
              instance.get("/classes", { params: { teacherId } }),
              instance.get("/assignments", { params: { teacherId } }),
            ]).then(([classes, assignments]) => ({
              data: {
                classes: classes.data,
                assignments: assignments.data,
              },
            })),
          () => demoDataService.dashboard.getTeacherDashboardData(teacherId)
        ),

      /**
       * Get student dashboard data
       * @param {string} studentId - Student identifier
       * @returns {Promise<AxiosApiResponse>} Student dashboard response
       */
      getStudentDashboardData: (studentId) =>
        routeApiCall(
          () =>
            Promise.all([
              instance.get("/assignments", { params: { studentId } }),
              instance.get(`/grades/student/${studentId}`),
            ]).then(([assignments, grades]) => ({
              data: {
                assignments: assignments.data,
                grades: grades.data,
              },
            })),
          () => demoDataService.dashboard.getStudentDashboardData(studentId)
        ),

      /**
       * Get parent dashboard data
       * @param {string} parentId - Parent identifier
       * @returns {Promise<AxiosApiResponse>} Parent dashboard response
       */
      getParentDashboardData: (parentId) =>
        routeApiCall(
          () =>
            instance
              .get(`/users/role/student`, { params: { parentId } })
              .then((students) =>
                Promise.all(
                  students.data.map((student) =>
                    Promise.all([
                      instance.get(`/grades/student/${student.id}`),
                      instance.get(`/attendance/student/${student.id}`, {
                        params: {
                          startDate: new Date(
                            Date.now() - 30 * 24 * 60 * 60 * 1000
                          )
                            .toISOString()
                            .split("T")[0],
                          endDate: new Date().toISOString().split("T")[0],
                        },
                      }),
                    ]).then(([grades, attendance]) => ({
                      student,
                      grades: grades.data,
                      attendance: attendance.data,
                    }))
                  )
                )
              )
              .then((childrenData) => ({ data: { children: childrenData } })),
          () => demoDataService.dashboard.getParentDashboardData(parentId)
        ),
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
