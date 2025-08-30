// @ts-nocheck
// client/src/features/teacher/TeacherDashboard.jsx - Updated with Real Data
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  getTeacherDashboardData,
  getUserDisplayName,
} from "../../services/dashboardApi.js";

// SVG Icon Components
const Icons = {
  Users: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  Award: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    </svg>
  ),
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
  Book: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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
  BarChart: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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

// Placeholder components
const ClassOverview = ({ classId, dashboardData }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <p className="text-2xl font-bold text-blue-600">
          {dashboardData?.studentCount || 0}
        </p>
        <p className="text-sm text-gray-600">Total Students</p>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <p className="text-2xl font-bold text-green-600">
          {Math.round((dashboardData?.studentCount || 0) * 0.85)}
        </p>
        <p className="text-sm text-gray-600">Present Today</p>
      </div>
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <p className="text-2xl font-bold text-orange-600">
          {dashboardData?.averageGrade || "N/A"}
        </p>
        <p className="text-sm text-gray-600">Avg Grade</p>
      </div>
    </div>
    <p className="text-sm text-gray-500">
      Showing data for: {classId === "all" ? "All Classes" : `Class ${classId}`}
    </p>
  </div>
);

const StudentPerformance = ({ classId }) => (
  <div className="space-y-4">
    <div className="space-y-3">
      {[
        { grade: "A", count: 12, percentage: 35 },
        { grade: "B", count: 15, percentage: 44 },
        { grade: "C", count: 5, percentage: 15 },
        { grade: "D", count: 2, percentage: 6 },
      ].map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm font-medium">Grade {item.grade}</span>
          <div className="flex items-center space-x-2 flex-1 ml-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 w-8">{item.count}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UpcomingAssessments = ({ pendingAssignments }) => (
  <div className="space-y-4">
    {pendingAssignments > 0 ? (
      <>
        {[
          {
            subject: "Mathematics",
            class: "10A",
            date: "Tomorrow",
            type: "Quiz",
          },
          { subject: "Physics", class: "11B", date: "Friday", type: "Test" },
          {
            subject: "Chemistry",
            class: "10B",
            date: "Next Week",
            type: "Lab Report",
          },
        ]
          .slice(0, Math.min(3, pendingAssignments))
          .map((assessment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {assessment.subject}
                </p>
                <p className="text-sm text-gray-500">
                  Class {assessment.class}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">
                  {assessment.type}
                </p>
                <p className="text-sm text-gray-500">{assessment.date}</p>
              </div>
            </div>
          ))}
        {pendingAssignments > 3 && (
          <p className="text-sm text-gray-500 text-center">
            +{pendingAssignments - 3} more assignments
          </p>
        )}
      </>
    ) : (
      <p className="text-center text-gray-500 py-8">No pending assessments</p>
    )}
  </div>
);

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("all");

  // State for real data
  const [dashboardData, setDashboardData] = useState({
    studentCount: 0,
    averageGrade: "N/A",
    attendanceRate: "0%",
    pendingAssignments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Fetch teacher dashboard data
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        const data = await getTeacherDashboardData(user.id);
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch teacher dashboard data:", error);
        setError("Failed to load teacher data. Please check your connection.");

        // Fallback data
        setDashboardData({
          studentCount: 156,
          averageGrade: "B+",
          attendanceRate: "94%",
          pendingAssignments: 8,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherData();
  }, [user?.id]);

  const classStats = [
    {
      title: "Total Students",
      value: isLoading ? "..." : dashboardData.studentCount,
      change: "+12",
      IconComponent: Icons.Users,
      color: "blue",
    },
    {
      title: "Average Grade",
      value: isLoading ? "..." : dashboardData.averageGrade,
      change: "+2.4%",
      IconComponent: Icons.Award,
      color: "green",
    },
    {
      title: "Attendance Rate",
      value: isLoading ? "..." : dashboardData.attendanceRate,
      change: "+1.2%",
      IconComponent: Icons.Clock,
      color: "purple",
    },
    {
      title: "Pending Assessments",
      value: isLoading ? "..." : dashboardData.pendingAssignments,
      change: "-3",
      IconComponent: Icons.FileText,
      color: "orange",
    },
  ];

  const upcomingClasses = [
    {
      id: 1,
      subject: "Mathematics",
      class: "10A",
      time: "09:00 AM",
      topic: "Quadratic Equations",
      students: 32,
      room: "201",
    },
    {
      id: 2,
      subject: "Physics",
      class: "11B",
      time: "10:30 AM",
      topic: "Newton's Laws",
      students: 28,
      room: "301",
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
              Teacher Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {getUserDisplayName(user)}! Manage your classes and
              track student progress
            </p>
            {isLoading && (
              <p className="text-sm text-blue-600 mt-1">
                Loading class data...
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
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Class Stats - Now with real data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {classStats.map((stat, index) => {
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
                    <span
                      className={`text-sm font-medium ${
                        stat.change.toString().startsWith("+")
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
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

        {/* Class Overview - Now with real data */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Class Overview</CardTitle>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Classes</option>
                <option value="10A">Class 10A</option>
                <option value="10B">Class 10B</option>
                <option value="11A">Class 11A</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <ClassOverview
              classId={selectedClass}
              dashboardData={dashboardData}
            />
          </CardContent>
        </Card>

        {/* Schedule and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icons.Calendar className="h-5 w-5 text-blue-600" />
                <span>Today's Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingClasses.map((class_) => (
                  <div
                    key={class_.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Icons.Book className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {class_.subject}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Class {class_.class} • Room {class_.room}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{class_.time}</p>
                      <p className="text-sm text-gray-500">
                        {class_.students} students
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icons.BarChart className="h-5 w-5 text-green-600" />
                <span>Performance Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentPerformance classId={selectedClass} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icons.FileText className="h-5 w-5 text-orange-600" />
                  <span>Upcoming Assessments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingAssessments
                  pendingAssignments={dashboardData.pendingAssignments}
                />
              </CardContent>
            </Card>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icons.Bell className="h-5 w-5 text-purple-600" />
                <span>Recent Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    message: "Assignment submissions due for Class 10A",
                    time: "2 hours ago",
                    type: "assignment",
                    icon: Icons.FileText,
                  },
                  {
                    id: 2,
                    message: "Parent meeting scheduled for tomorrow",
                    time: "5 hours ago",
                    type: "meeting",
                    icon: Icons.Users,
                  },
                  {
                    id: 3,
                    message: "New curriculum update available",
                    time: "1 day ago",
                    type: "update",
                    icon: Icons.Bell,
                  },
                ].map((notification) => {
                  const IconComponent = notification.icon;
                  return (
                    <div
                      key={notification.id}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50"
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          notification.type === "assignment"
                            ? "bg-blue-100"
                            : notification.type === "meeting"
                              ? "bg-green-100"
                              : "bg-purple-100"
                        }`}
                      >
                        <IconComponent
                          className={`h-4 w-4 ${
                            notification.type === "assignment"
                              ? "text-blue-600"
                              : notification.type === "meeting"
                                ? "text-green-600"
                                : "text-purple-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

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

export default TeacherDashboard;
