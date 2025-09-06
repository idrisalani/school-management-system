// client/src/services/dashboardApi.js - Enhanced with CRUD Operations
const API_BASE_URL =
  (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api/v1";

// Helper function to make authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
};

// ========================= EXISTING DASHBOARD APIS =========================

// Admin Dashboard API calls
export const getAdminDashboardData = async () => {
  try {
    const data = await apiCall("/dashboard/admin");
    return data;
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return {
      studentCount: "0",
      teacherCount: "0",
      averageAttendance: "0%",
      revenue: "$0",
    };
  }
};

// Teacher Dashboard API calls
export const getTeacherDashboardData = async (teacherId) => {
  try {
    const data = await apiCall(`/dashboard/teacher/${teacherId}`);
    return data;
  } catch (error) {
    console.error("Error fetching teacher dashboard data:", error);
    return {
      studentCount: 0,
      averageGrade: "N/A",
      attendanceRate: "0%",
      pendingAssignments: 0,
    };
  }
};

// Student Dashboard API calls
export const getStudentDashboardData = async (studentId) => {
  try {
    const data = await apiCall(`/dashboard/student/${studentId}`);
    return data;
  } catch (error) {
    console.error("Error fetching student dashboard data:", error);
    return {
      attendance: "0%",
      averageGrade: "N/A",
      assignments: "0/0",
      activities: 0,
    };
  }
};

// Parent Dashboard API calls
export const getParentDashboardData = async (parentId) => {
  try {
    const data = await apiCall(`/dashboard/parent/${parentId}`);
    return data;
  } catch (error) {
    console.error("Error fetching parent dashboard data:", error);
    return {
      childrenCount: 0,
      upcomingEvents: 0,
      averageGrade: "N/A",
      attendanceRate: "0%",
      children: [],
    };
  }
};

// Get weekly attendance data for charts
export const getWeeklyAttendanceData = async () => {
  try {
    const data = await apiCall("/analytics/attendance/weekly");
    return data;
  } catch (error) {
    console.error("Error fetching weekly attendance data:", error);
    return [
      { day: "Monday", rate: 95 },
      { day: "Tuesday", rate: 92 },
      { day: "Wednesday", rate: 88 },
      { day: "Thursday", rate: 94 },
      { day: "Friday", rate: 90 },
    ];
  }
};

// Get grade distribution data
export const getGradeDistributionData = async () => {
  try {
    const data = await apiCall("/analytics/grades/distribution");
    return data;
  } catch (error) {
    console.error("Error fetching grade distribution:", error);
    return [
      { grade: "A", count: 45, color: "green" },
      { grade: "B", count: 32, color: "blue" },
      { grade: "C", count: 18, color: "yellow" },
      { grade: "D", count: 8, color: "orange" },
      { grade: "F", count: 3, color: "red" },
    ];
  }
};

// Get recent activities/announcements
export const getRecentActivities = async (limit = 5) => {
  try {
    const data = await apiCall(`/activities/recent?limit=${limit}`);
    return data;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
};

// Helper function to get user's display name
export const getUserDisplayName = (user) => {
  if (user?.first_name && user?.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (user?.first_name) {
    return user.first_name;
  }
  if (user?.name) {
    return user.name;
  }
  if (user?.username) {
    return user.username;
  }
  return "User";
};

// ========================= EXISTING READ OPERATIONS =========================

export const getClasses = async () => {
  try {
    return await apiCall("/classes");
  } catch (error) {
    console.error("Error fetching classes:", error);
    return [];
  }
};

export const getUsers = async (role = null) => {
  try {
    const endpoint = role ? `/users?role=${role}` : "/users";
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const getAssignments = async (classId = null) => {
  try {
    const endpoint = classId
      ? `/assignments?classId=${classId}`
      : "/assignments";
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return [];
  }
};

export const getGrades = async (studentId = null, classId = null) => {
  try {
    let endpoint = "/grades";
    const params = new URLSearchParams();

    if (studentId) params.append("studentId", studentId);
    if (classId) params.append("classId", classId);

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching grades:", error);
    return [];
  }
};

export const getAttendance = async (
  studentId = null,
  classId = null,
  date = null
) => {
  try {
    let endpoint = "/attendance";
    const params = new URLSearchParams();

    if (studentId) params.append("studentId", studentId);
    if (classId) params.append("classId", classId);
    if (date) params.append("date", date);

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
};

export const getPayments = async (studentId = null) => {
  try {
    const endpoint = studentId
      ? `/payments?studentId=${studentId}`
      : "/payments";
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
};

// ========================= NEW: PROFILE & SETTINGS MANAGEMENT =========================

// Get user profile details
export const getUserProfile = async (userId = null) => {
  try {
    const endpoint = userId ? `/users/${userId}/profile` : "/users/profile";
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    return await apiCall("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append("profilePicture", file);

    return await apiCall("/users/profile/picture", {
      method: "POST",
      headers: {
        // Don't set Content-Type, let browser set it for FormData
      },
      body: formData,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

// Get notification preferences
export const getNotificationPreferences = async () => {
  try {
    return await apiCall("/users/notifications/preferences");
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return {
      emailNotifications: true,
      pushNotifications: true,
      gradeUpdates: true,
      assignmentReminders: true,
      attendanceAlerts: true,
      systemAnnouncements: true,
    };
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (preferences) => {
  try {
    return await apiCall("/users/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw error;
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    return await apiCall("/users/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

// ========================= NEW: ASSIGNMENT & GRADING OPERATIONS =========================

// Create new assignment (Teachers)
export const createAssignment = async (assignmentData) => {
  try {
    return await apiCall("/assignments", {
      method: "POST",
      body: JSON.stringify(assignmentData),
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    throw error;
  }
};

// Update assignment
export const updateAssignment = async (assignmentId, assignmentData) => {
  try {
    return await apiCall(`/assignments/${assignmentId}`, {
      method: "PUT",
      body: JSON.stringify(assignmentData),
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    throw error;
  }
};

// Submit assignment (Students)
export const submitAssignment = async (assignmentId, submissionData) => {
  try {
    const formData = new FormData();

    // Add text data
    if (submissionData.text) {
      formData.append("text", submissionData.text);
    }

    // Add files
    if (submissionData.files && submissionData.files.length > 0) {
      submissionData.files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }

    return await apiCall(`/assignments/${assignmentId}/submit`, {
      method: "POST",
      headers: {}, // Let browser set headers for FormData
      body: formData,
    });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    throw error;
  }
};

// Get assignment submissions (Teachers)
export const getAssignmentSubmissions = async (assignmentId) => {
  try {
    return await apiCall(`/assignments/${assignmentId}/submissions`);
  } catch (error) {
    console.error("Error fetching assignment submissions:", error);
    return [];
  }
};

// Grade assignment submission
export const gradeSubmission = async (submissionId, gradeData) => {
  try {
    return await apiCall(`/submissions/${submissionId}/grade`, {
      method: "POST",
      body: JSON.stringify(gradeData),
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    throw error;
  }
};

// Bulk grade submissions
export const bulkGradeSubmissions = async (grades) => {
  try {
    return await apiCall("/submissions/bulk-grade", {
      method: "POST",
      body: JSON.stringify({ grades }),
    });
  } catch (error) {
    console.error("Error bulk grading submissions:", error);
    throw error;
  }
};

// ========================= NEW: COMMUNICATION SYSTEM =========================

// Get messages/conversations
export const getMessages = async (conversationId = null) => {
  try {
    const endpoint = conversationId
      ? `/messages/${conversationId}`
      : "/messages";
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

// Send message
export const sendMessage = async (messageData) => {
  try {
    return await apiCall("/messages", {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Send bulk notification (Teachers/Admins)
export const sendBulkNotification = async (notificationData) => {
  try {
    return await apiCall("/notifications/bulk", {
      method: "POST",
      body: JSON.stringify(notificationData),
    });
  } catch (error) {
    console.error("Error sending bulk notification:", error);
    throw error;
  }
};

// Schedule parent-teacher meeting
export const scheduleParentMeeting = async (meetingData) => {
  try {
    return await apiCall("/meetings", {
      method: "POST",
      body: JSON.stringify(meetingData),
    });
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    throw error;
  }
};

// Get scheduled meetings
export const getMeetings = async (userId = null) => {
  try {
    const endpoint = userId ? `/meetings?userId=${userId}` : "/meetings";
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return [];
  }
};

// ========================= NEW: PAYMENT & FEE MANAGEMENT =========================

// Get fee structure
export const getFeeStructure = async (studentId = null) => {
  try {
    const endpoint = studentId
      ? `/fees/structure?studentId=${studentId}`
      : "/fees/structure";
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching fee structure:", error);
    return [];
  }
};

// Get payment history
export const getPaymentHistory = async (studentId = null) => {
  try {
    const endpoint = studentId
      ? `/payments/history?studentId=${studentId}`
      : "/payments/history";
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return [];
  }
};

// Make payment
export const makePayment = async (paymentData) => {
  try {
    return await apiCall("/payments/process", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

// Update payment method
export const updatePaymentMethod = async (paymentMethodData) => {
  try {
    return await apiCall("/payments/method", {
      method: "PUT",
      body: JSON.stringify(paymentMethodData),
    });
  } catch (error) {
    console.error("Error updating payment method:", error);
    throw error;
  }
};

// Get outstanding fees
export const getOutstandingFees = async (studentId = null) => {
  try {
    const endpoint = studentId
      ? `/fees/outstanding?studentId=${studentId}`
      : "/fees/outstanding";
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching outstanding fees:", error);
    return [];
  }
};

// ========================= NEW: ADMIN USER MANAGEMENT =========================

// Create new user (Admin)
export const createUser = async (userData) => {
  try {
    return await apiCall("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Update user (Admin)
export const updateUser = async (userId, userData) => {
  try {
    return await apiCall(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Delete user (Admin)
export const deleteUser = async (userId) => {
  try {
    return await apiCall(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Bulk import users (Admin)
export const bulkImportUsers = async (usersData) => {
  try {
    return await apiCall("/admin/users/bulk-import", {
      method: "POST",
      body: JSON.stringify({ users: usersData }),
    });
  } catch (error) {
    console.error("Error bulk importing users:", error);
    throw error;
  }
};

// Get user activity logs (Admin)
export const getUserActivityLogs = async (userId = null, limit = 50) => {
  try {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    params.append("limit", limit.toString());

    return await apiCall(`/admin/activity-logs?${params.toString()}`);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
};

// ========================= NEW: ATTENDANCE MANAGEMENT =========================

// Mark attendance (Teachers)
export const markAttendance = async (attendanceData) => {
  try {
    return await apiCall("/attendance/mark", {
      method: "POST",
      body: JSON.stringify(attendanceData),
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    throw error;
  }
};

// Bulk mark attendance
export const bulkMarkAttendance = async (attendanceList) => {
  try {
    return await apiCall("/attendance/bulk-mark", {
      method: "POST",
      body: JSON.stringify({ attendance: attendanceList }),
    });
  } catch (error) {
    console.error("Error bulk marking attendance:", error);
    throw error;
  }
};

// Update attendance record
export const updateAttendance = async (attendanceId, attendanceData) => {
  try {
    return await apiCall(`/attendance/${attendanceId}`, {
      method: "PUT",
      body: JSON.stringify(attendanceData),
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    throw error;
  }
};

// ========================= NEW: SYSTEM SETTINGS & ADMIN TOOLS =========================

// Get system settings (Admin)
export const getSystemSettings = async () => {
  try {
    return await apiCall("/admin/settings");
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return {};
  }
};

// Update system settings (Admin)
export const updateSystemSettings = async (settings) => {
  try {
    return await apiCall("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  } catch (error) {
    console.error("Error updating system settings:", error);
    throw error;
  }
};

// Export data (Admin)
export const exportData = async (dataType, format = "csv") => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/export/${dataType}?format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataType}_export_${new Date().toISOString().split("T")[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, message: "Export completed successfully" };
  } catch (error) {
    console.error("Error exporting data:", error);
    throw error;
  }
};

// Backup database (Admin)
export const backupDatabase = async () => {
  try {
    return await apiCall("/admin/backup", {
      method: "POST",
    });
  } catch (error) {
    console.error("Error backing up database:", error);
    throw error;
  }
};

// ========================= NEW: REAL-TIME NOTIFICATIONS =========================

// Get notifications
export const getNotifications = async (limit = 20, unreadOnly = false) => {
  try {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (unreadOnly) params.append("unreadOnly", "true");

    return await apiCall(`/notifications?${params.toString()}`);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

// Mark notification as read
export const markNotificationRead = async (notificationId) => {
  try {
    return await apiCall(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async () => {
  try {
    return await apiCall("/notifications/mark-all-read", {
      method: "PUT",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

// ========================= NEW: ANNOUNCEMENTS MANAGEMENT =========================

// Get announcements
export const getAnnouncements = async (role = null) => {
  try {
    const endpoint = role ? `/announcements?role=${role}` : "/announcements";
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
};

// Create announcement (Admin/Teachers)
export const createAnnouncement = async (announcementData) => {
  try {
    return await apiCall("/announcements", {
      method: "POST",
      body: JSON.stringify(announcementData),
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    throw error;
  }
};

// Update announcement
export const updateAnnouncement = async (announcementId, announcementData) => {
  try {
    return await apiCall(`/announcements/${announcementId}`, {
      method: "PUT",
      body: JSON.stringify(announcementData),
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    throw error;
  }
};

// Delete announcement
export const deleteAnnouncement = async (announcementId) => {
  try {
    return await apiCall(`/announcements/${announcementId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    throw error;
  }
};

// ========================= UTILITY FUNCTIONS =========================

// Generic file upload
export const uploadFile = async (file, uploadType = "general") => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadType", uploadType);

    return await apiCall("/files/upload", {
      method: "POST",
      headers: {},
      body: formData,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Search functionality
export const searchGlobal = async (query, filters = {}) => {
  try {
    const params = new URLSearchParams();
    params.append("q", query);

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });

    return await apiCall(`/search?${params.toString()}`);
  } catch (error) {
    console.error("Error performing search:", error);
    return [];
  }
};

// Health check
export const checkApiHealth = async () => {
  try {
    return await fetch(`${API_BASE_URL}/health`);
  } catch (error) {
    console.error("Error checking API health:", error);
    return { status: "error", message: "API unreachable" };
  }
};
