// src/features/admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

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

// Simple StatsCard component
const StatsCard = ({
  title,
  value,
  change,
  trend,
  iconText,
  color,
  loading,
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
          <span className="text-sm font-medium">{iconText}</span>
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

  const stats = [
    {
      title: "Total Students",
      value: isLoading ? "..." : dashboardData.studentCount || "2,856",
      change: "+12.5%",
      trend: "up",
      iconText: "USERS",
      color: "blue",
    },
    {
      title: "Total Teachers",
      value: isLoading ? "..." : dashboardData.teacherCount || "145",
      change: "+4.3%",
      trend: "up",
      iconText: "STAFF",
      color: "green",
    },
    {
      title: "Average Attendance",
      value: isLoading ? "..." : dashboardData.averageAttendance || "92.8%",
      change: "-2.1%",
      trend: "down",
      iconText: "TIME",
      color: "orange",
    },
    {
      title: "Revenue",
      value: isLoading ? "..." : dashboardData.revenue || "$42,850",
      change: "+8.7%",
      trend: "up",
      iconText: "CASH",
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
