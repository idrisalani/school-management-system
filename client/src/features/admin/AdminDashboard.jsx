// src/features/admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

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
  GraduationCap: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
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
  CreditCard: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  ),
  TrendingUp: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
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

// Updated StatsCard component with proper icon rendering
const StatsCard = ({
  title,
  value,
  change,
  trend,
  IconComponent,
  color,
  loading,
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          <IconComponent className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div
          className={`flex items-center space-x-1 text-sm ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          <span>{change}</span>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-3xl font-semibold">
          {loading ? "Loading..." : value}
        </p>
      </div>
    </CardContent>
  </Card>
);

// Simple AttendanceChart component
const AttendanceChart = () => (
  <div className="h-64 space-y-4">
    <div className="text-center mb-4">
      <h4 className="text-lg font-medium">Weekly Attendance</h4>
    </div>
    <div className="space-y-3">
      {[
        { day: "Monday", rate: 95 },
        { day: "Tuesday", rate: 92 },
        { day: "Wednesday", rate: 88 },
        { day: "Thursday", rate: 94 },
        { day: "Friday", rate: 90 },
      ].map((day, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">{day.day}</span>
          <div className="flex items-center space-x-2 flex-1 ml-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${day.rate}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-900 w-12">
              {day.rate}%
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Simple PerformanceChart component
const PerformanceChart = () => (
  <div className="h-64 space-y-4">
    <div className="text-center mb-4">
      <h4 className="text-lg font-medium">Grade Distribution</h4>
    </div>
    <div className="space-y-3">
      {[
        { grade: "A", count: 45, color: "green" },
        { grade: "B", count: 32, color: "blue" },
        { grade: "C", count: 18, color: "yellow" },
        { grade: "D", count: 8, color: "orange" },
        { grade: "F", count: 3, color: "red" },
      ].map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Grade {item.grade}
          </span>
          <div className="flex items-center space-x-2 flex-1 ml-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`bg-${item.color}-500 h-2 rounded-full`}
                style={{ width: `${(item.count / 106) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-900 w-12">
              {item.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Simple RecentActivity component
const RecentActivity = () => (
  <div className="space-y-4">
    {[
      {
        id: 1,
        user: "John Smith",
        action: "submitted assignment",
        subject: "Mathematics",
        time: "2 minutes ago",
        type: "assignment",
      },
      {
        id: 2,
        user: "Sarah Johnson",
        action: "marked attendance",
        subject: "Class 10A",
        time: "5 minutes ago",
        type: "attendance",
      },
      {
        id: 3,
        user: "Mike Wilson",
        action: "graded test",
        subject: "Science",
        time: "12 minutes ago",
        type: "grading",
      },
      {
        id: 4,
        user: "Emily Davis",
        action: "created assignment",
        subject: "English",
        time: "1 hour ago",
        type: "assignment",
      },
      {
        id: 5,
        user: "David Brown",
        action: "updated profile",
        subject: "Personal Info",
        time: "2 hours ago",
        type: "profile",
      },
    ].map((activity) => (
      <div
        key={activity.id}
        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
      >
        <div
          className={`w-3 h-3 rounded-full ${
            activity.type === "assignment"
              ? "bg-blue-500"
              : activity.type === "attendance"
                ? "bg-green-500"
                : activity.type === "grading"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
          }`}
        ></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            <span className="font-semibold">{activity.user}</span>{" "}
            {activity.action}
          </p>
          <p className="text-sm text-gray-500">{activity.subject}</p>
        </div>
        <div className="text-sm text-gray-500">{activity.time}</div>
      </div>
    ))}
  </div>
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    studentCount: "",
    teacherCount: "",
    averageAttendance: "",
    revenue: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Extract user name properly
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.name) {
      return user.name;
    }
    if (user?.username) {
      return user.username;
    }
    return "Admin";
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Simulate API call with timeout
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data since API might not exist
        const mockData = {
          studentCount: "2,856",
          teacherCount: "145",
          averageAttendance: "92.8%",
          revenue: "$42,850",
        };

        setDashboardData(mockData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);

        // Fallback data
        setDashboardData({
          studentCount: "2,856",
          teacherCount: "145",
          averageAttendance: "92.8%",
          revenue: "$42,850",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Updated stats with proper IconComponent usage
  const stats = [
    {
      title: "Total Students",
      value: isLoading ? "..." : dashboardData.studentCount || "2,856",
      change: "+12.5%",
      trend: "up",
      IconComponent: Icons.Users,
      color: "blue",
    },
    {
      title: "Total Teachers",
      value: isLoading ? "..." : dashboardData.teacherCount || "145",
      change: "+4.3%",
      trend: "up",
      IconComponent: Icons.GraduationCap,
      color: "green",
    },
    {
      title: "Average Attendance",
      value: isLoading ? "..." : dashboardData.averageAttendance || "92.8%",
      change: "-2.1%",
      trend: "down",
      IconComponent: Icons.Clock,
      color: "orange",
    },
    {
      title: "Revenue",
      value: isLoading ? "..." : dashboardData.revenue || "$42,850",
      change: "+8.7%",
      trend: "up",
      IconComponent: Icons.CreditCard,
      color: "purple",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logout */}
      <div className="bg-white shadow-sm border-b px-6 py-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {getUserDisplayName()}! School Management System
              Overview
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {getUserDisplayName()}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} loading={isLoading} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceChart />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
