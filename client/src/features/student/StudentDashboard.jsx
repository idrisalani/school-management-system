// @ts-nocheck
// client/src/features/student/StudentDashboard.jsx - Updated with Real Data and Fixed Layout
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  getStudentDashboardData,
  getUserDisplayName,
} from "../../services/dashboardApi.js";
import DashboardOverview from "../../components/dashboard/DashboardOverview";

// SVG Icon Components
const Icons = {
  Clock: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Award: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 003.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    </svg>
  ),
  FileText: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  Calendar: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  Bell: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
  AlertTriangle: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
};

// Simple Card components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => (
  <div className="px-4 py-5 border-b border-gray-200">{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg leading-6 font-medium text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`px-4 py-5 ${className}`}>{children}</div>
);

// Simple placeholder components with text icons
const GradesChart = () => (
  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <div className="text-4xl mb-4">📊</div>
      <p className="text-gray-500">Grade Performance Chart</p>
      <p className="text-sm text-gray-400 mt-2">Coming Soon</p>
    </div>
  </div>
);

const AttendanceOverview = ({ attendancePercentage }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-900">This Month</span>
      <span className="text-2xl font-bold text-green-600">
        {attendancePercentage}
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-green-600 h-2 rounded-full"
        style={{ width: attendancePercentage }}
      ></div>
    </div>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-gray-500">Present Days</p>
        <p className="font-semibold">
          {Math.round(parseInt(attendancePercentage) * 0.18) || 18}
        </p>
      </div>
      <div>
        <p className="text-gray-500">Absent Days</p>
        <p className="font-semibold">
          {Math.round((100 - parseInt(attendancePercentage)) * 0.02) || 2}
        </p>
      </div>
    </div>
  </div>
);

const UpcomingAssignments = () => (
  <div className="space-y-4">
    {[
      {
        subject: "Mathematics",
        title: "Algebra Practice",
        due: "Tomorrow",
        priority: "high",
      },
      {
        subject: "Science",
        title: "Lab Report",
        due: "3 days",
        priority: "medium",
      },
      {
        subject: "English",
        title: "Essay Writing",
        due: "1 week",
        priority: "low",
      },
    ].map((assignment, index) => (
      <div
        key={index}
        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
      >
        <div>
          <p className="font-medium text-gray-900">{assignment.title}</p>
          <p className="text-sm text-gray-500">{assignment.subject}</p>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-medium ${
              assignment.priority === "high"
                ? "text-red-600"
                : assignment.priority === "medium"
                  ? "text-yellow-600"
                  : "text-green-600"
            }`}
          >
            Due {assignment.due}
          </p>
        </div>
      </div>
    ))}
  </div>
);

const TimeTable = () => (
  <div className="space-y-3">
    {[
      {
        time: "9:00 AM",
        subject: "Mathematics",
        room: "Room 101",
        status: "current",
      },
      {
        time: "10:30 AM",
        subject: "Science",
        room: "Lab A",
        status: "upcoming",
      },
      {
        time: "12:00 PM",
        subject: "English",
        room: "Room 205",
        status: "upcoming",
      },
      {
        time: "2:00 PM",
        subject: "History",
        room: "Room 301",
        status: "upcoming",
      },
    ].map((class_item, index) => (
      <div
        key={index}
        className={`flex items-center justify-between p-3 rounded-lg ${
          class_item.status === "current"
            ? "bg-blue-50 border border-blue-200"
            : "bg-gray-50"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              class_item.status === "current" ? "bg-blue-500" : "bg-gray-300"
            }`}
          ></div>
          <div>
            <p className="font-medium text-gray-900">{class_item.subject}</p>
            <p className="text-sm text-gray-500">{class_item.room}</p>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600">{class_item.time}</p>
      </div>
    ))}
  </div>
);

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const logoutButtonRef = useRef(null);
  const isLoggingOutRef = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State for real data
  const [dashboardData, setDashboardData] = useState({
    attendance: "0%",
    averageGrade: "N/A",
    assignments: "0/0",
    activities: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = useCallback(
    async (e) => {
      e?.preventDefault();

      // Prevent multiple logout attempts
      if (isLoggingOutRef.current || isLoggingOut) {
        console.log("Logout blocked - already in progress");
        return;
      }

      // Set flags immediately
      isLoggingOutRef.current = true;
      setIsLoggingOut(true);

      // Disable button immediately
      if (logoutButtonRef.current) {
        logoutButtonRef.current.disabled = true;
        logoutButtonRef.current.textContent = "Logging out...";
      }

      try {
        await logout();
        // Force immediate redirect without React Router
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout failed:", error);
        // Reset on error
        setIsLoggingOut(false);
        isLoggingOutRef.current = false;

        if (logoutButtonRef.current) {
          logoutButtonRef.current.disabled = false;
          logoutButtonRef.current.textContent = "Logout";
        }
      }
    },
    [logout, isLoggingOut]
  );

  // Fetch student dashboard data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        const data = await getStudentDashboardData(user.id);
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch student dashboard data:", error);
        setError("Failed to load student data. Please check your connection.");

        // Fallback data
        setDashboardData({
          attendance: "92%",
          averageGrade: "A-",
          assignments: "8/10",
          activities: 5,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [user?.id]);

  const quickStats = [
    {
      title: "Attendance",
      value: isLoading ? "..." : dashboardData.attendance,
      IconComponent: Icons.Clock,
      trend: "up",
      trendValue: "+2.5%",
      color: "blue",
    },
    {
      title: "Average Grade",
      value: isLoading ? "..." : dashboardData.averageGrade,
      IconComponent: Icons.Award,
      trend: "up",
      trendValue: "+3.2%",
      color: "green",
    },
    {
      title: "Assignments",
      value: isLoading ? "..." : dashboardData.assignments,
      IconComponent: Icons.FileText,
      trend: "down",
      trendValue: "-1",
      color: "orange",
    },
    {
      title: "Activities",
      value: isLoading ? "..." : dashboardData.activities,
      IconComponent: Icons.Calendar,
      trend: "up",
      trendValue: "+2",
      color: "purple",
    },
  ];

  const notifications = [
    {
      id: 1,
      type: "assignment",
      message: "Math homework due tomorrow",
      time: "2 hours ago",
      priority: "high",
    },
    {
      id: 2,
      type: "grade",
      message: "New grade posted for Science",
      time: "5 hours ago",
      priority: "medium",
    },
  ];

  // Error state
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Icons.AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logout */}
      <div className="bg-white shadow-sm border-b px-6 py-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Student Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {getUserDisplayName(user)}!
            </p>
            {isLoading && (
              <p className="text-sm text-blue-600 mt-1">
                Loading your academic data...
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {getUserDisplayName(user)}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              ref={logoutButtonRef}
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`
                px-4 py-2 text-sm font-medium text-white rounded-lg 
                transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                ${
                  isLoggingOut
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }
              `}
              style={{
                userSelect: "none",
                touchAction: "manipulation",
              }}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>

      {/* FIXED: Moved DashboardOverview into the main content area with proper spacing */}
      <div className="p-6">
        {/* Enhanced Dashboard Overview Component - Now properly positioned */}
        <div className="mb-8">
          <DashboardOverview userRole={user?.role} userId={user?.id} />
        </div>

        {/* Quick Stats - Now with real data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.IconComponent;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                      <IconComponent
                        className={`h-6 w-6 text-${stat.color}-600`}
                      />
                    </div>
                    <div
                      className={`flex items-center space-x-1 text-sm ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <span>{stat.trendValue}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </h3>
                    <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Grades Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🏆</span>
                <span>Grade Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GradesChart />
            </CardContent>
          </Card>

          {/* Attendance Overview - Now with real data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🕒</span>
                <span>Attendance Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceOverview
                attendancePercentage={dashboardData.attendance}
              />
            </CardContent>
          </Card>
        </div>

        {/* Lower Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Assignments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📄</span>
                  <span>Upcoming Assignments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingAssignments />
              </CardContent>
            </Card>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>🔔</span>
                  <span>Notifications</span>
                </div>
                <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                  {notifications.length} new
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg ${
                      notification.priority === "high"
                        ? "bg-red-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <span className="text-red-500">
                      {notification.priority === "high" ? "⚠️" : "🔔"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timetable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📅</span>
              <span>Today's Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeTable />
          </CardContent>
        </Card>

        {/* Data Source Indicator */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {isLoading
              ? "Loading from database..."
              : `Data last updated: ${new Date().toLocaleString()}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
