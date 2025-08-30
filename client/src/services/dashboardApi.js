// client/src/services/dashboardApi.js - Backend API calls (no direct Supabase)
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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

// Admin Dashboard API calls
export const getAdminDashboardData = async () => {
  try {
    const data = await apiCall("/dashboard/admin");
    return data;
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    // Return fallback data if API fails
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
    // Return sample data on error
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
    // Return sample data on error
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

// Additional API calls you might need
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
