// @ts-nocheck

// client/src/features/admin/AdminDashboard.jsx - Corrected version with proper tab navigation
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  getAdminDashboardData,
  getWeeklyAttendanceData,
  getGradeDistributionData,
  getRecentActivities,
  getUserDisplayName,
} from "../../services/dashboardApi.js";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import AnalyticsDashboard from "../../components/analytics/AnalyticsDashboard";

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
  Home: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
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
};

// Card components
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

// StatsCard component
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

// Tab Navigation Component
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: "overview",
      name: "Dashboard Overview",
      icon: Icons.Home,
      description: "Main dashboard with statistics and charts",
    },
    {
      id: "analytics",
      name: "Advanced Analytics",
      icon: Icons.BarChart,
      description: "Detailed analytics and reports",
    },
  ];

  return (
    <div className="bg-white border-b mb-6">
      <nav className="flex space-x-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              group inline-flex items-center py-4 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <tab.icon
              className={`
                -ml-0.5 mr-2 h-5 w-5 transition-colors
                ${
                  activeTab === tab.id
                    ? "text-blue-500"
                    : "text-gray-400 group-hover:text-gray-500"
                }
              `}
            />
            <span>{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const logoutButtonRef = useRef(null);
  const isLoggingOutRef = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ADD THE MISSING ACTIVE TAB STATE - THIS WAS THE MAIN ISSUE!
  const [activeTab, setActiveTab] = useState("overview");

  // State with proper type initialization
  const [dashboardData, setDashboardData] = useState({
    studentCount: "0",
    teacherCount: "0",
    averageAttendance: "0%",
    revenue: "$0",
  });

  // Properly typed state for arrays with initial values to fix TypeScript inference
  const [weeklyAttendance, setWeeklyAttendance] = useState([
    { day: "Monday", rate: 0 },
    { day: "Tuesday", rate: 0 },
    { day: "Wednesday", rate: 0 },
    { day: "Thursday", rate: 0 },
    { day: "Friday", rate: 0 },
  ]);

  const [gradeDistribution, setGradeDistribution] = useState([
    { grade: "A", count: 0, color: "green" },
    { grade: "B", count: 0, color: "blue" },
    { grade: "C", count: 0, color: "yellow" },
    { grade: "D", count: 0, color: "orange" },
    { grade: "F", count: 0, color: "red" },
  ]);

  const [recentActivities, setRecentActivities] = useState(
    [{ id: 0, user: "", action: "", subject: "", time: "", type: "" }].slice(
      0,
      0
    )
  ); // Empty array with proper type inference
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

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [adminData, attendanceData, gradesData, activitiesData] =
          await Promise.all([
            getAdminDashboardData(),
            getWeeklyAttendanceData(),
            getGradeDistributionData(),
            getRecentActivities(),
          ]);

        setDashboardData(adminData);
        setWeeklyAttendance(attendanceData);
        setGradeDistribution(gradesData);
        setRecentActivities(activitiesData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError(
          "Failed to load dashboard data. Please check your database connection."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Stats using real data
  const stats = [
    {
      title: "Total Students",
      value: isLoading ? "..." : dashboardData.studentCount,
      change: "+12.5%",
      trend: "up",
      IconComponent: Icons.Users,
      color: "blue",
    },
    {
      title: "Total Teachers",
      value: isLoading ? "..." : dashboardData.teacherCount,
      change: "+4.3%",
      trend: "up",
      IconComponent: Icons.GraduationCap,
      color: "green",
    },
    {
      title: "Average Attendance",
      value: isLoading ? "..." : dashboardData.averageAttendance,
      change: "-2.1%",
      trend: "down",
      IconComponent: Icons.Clock,
      color: "orange",
    },
    {
      title: "Revenue",
      value: isLoading ? "..." : dashboardData.revenue,
      change: "+8.7%",
      trend: "up",
      IconComponent: Icons.CreditCard,
      color: "purple",
    },
  ];

  // Updated AttendanceChart with real data
  const AttendanceChart = () => (
    <div className="h-64 space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-lg font-medium">Weekly Attendance</h4>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {weeklyAttendance.map((day, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                {day.day}
              </span>
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
      )}
    </div>
  );

  // Updated PerformanceChart with real data
  const PerformanceChart = () => (
    <div className="h-64 space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-lg font-medium">Grade Distribution</h4>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {gradeDistribution.map((item, index) => {
            const total = gradeDistribution.reduce(
              (sum, grade) => sum + grade.count,
              0
            );
            const percentage = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Grade {item.grade}
                </span>
                <div className="flex items-center space-x-2 flex-1 ml-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-${item.color}-500 h-2 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">
                    {item.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Updated RecentActivity with real data
  const RecentActivity = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : recentActivities.length > 0 ? (
        recentActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <div
              className={`w-3 h-3 rounded-full ${
                activity.type === "academic"
                  ? "bg-blue-500"
                  : activity.type === "event"
                    ? "bg-green-500"
                    : activity.type === "general"
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
        ))
      ) : (
        <p className="text-center text-gray-500 py-8">No recent activities</p>
      )}
    </div>
  );

  // Error state
  if (error) {
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4 mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {getUserDisplayName(user)}! School Management System
              Overview
            </p>
            {isLoading && (
              <p className="text-sm text-blue-600 mt-1">
                Loading real data from database...
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

      {/* Tab Navigation - FIXED PLACEMENT */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Content - PROPERLY ORGANIZED */}
      <div className="px-6">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <StatsCard key={stat.title} {...stat} loading={isLoading} />
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* Enhanced Dashboard Overview Component */}
            <DashboardOverview userRole={user?.role} userId={user?.id} />

            {/* Data Source Indicator */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                {isLoading
                  ? "Loading from database..."
                  : `Data last updated: ${new Date().toLocaleString()}`}
              </p>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* Enhanced Analytics Dashboard Component */}
            <AnalyticsDashboard userRole={user?.role} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
