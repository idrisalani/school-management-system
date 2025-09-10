// @ts-nocheck
// client/src/features/teacher/TeacherDashboard.jsx - Enhanced with Assignment & Class Management
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  getTeacherDashboardData,
  getUserDisplayName,
} from "../../services/dashboardApi.js";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import TeacherProfile from "./TeacherProfile";

// Assignment Management Integration
import AssignmentManagementSuite from "./assignments/Suite/AssignmentManagementSuite";
import { AssignmentProvider } from "./assignments/context/AssignmentContext";
import { GradingProvider } from "./assignments/context/GradingContext";
//import AssignmentSystem from "./assignments/AssignmentSystem";

// Class Management Integration
import ClassManagement from "./ClassManagement";
//import AssignmentManagement from "./components/AssignmentManagement";

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
  ClipboardList: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
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
  BookOpen: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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
  User: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  Settings: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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
  ChevronDown: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  ),
  Plus: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
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

// Enhanced Tab Navigation Component
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: "dashboard",
      name: "Teaching Dashboard",
      icon: Icons.Home,
    },
    {
      id: "assignments",
      name: "Assignment Management",
      icon: Icons.ClipboardList,
    },
    {
      id: "classes",
      name: "Class Management",
      icon: Icons.Users,
    },
    {
      id: "profile",
      name: "Profile & Settings",
      icon: Icons.User,
    },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
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

// User Menu Dropdown Component
const UserMenuDropdown = ({
  isOpen,
  setIsOpen,
  user,
  onProfileClick,
  onLogout,
  isLoggingOut,
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
          <Icons.GraduationCap className="h-5 w-5 text-green-600" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {getUserDisplayName(user)}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <Icons.ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {getUserDisplayName(user)}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <p className="text-xs text-green-600 font-medium">Teacher</p>
            </div>

            <button
              onClick={() => {
                onProfileClick();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Icons.User className="h-4 w-4 mr-3" />
              Profile & Settings
            </button>

            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              disabled={isLoggingOut}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50"
            >
              <Icons.Settings className="h-4 w-4 mr-3" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Assignment Quick Actions Card Component
const AssignmentQuickActions = ({
  onCreateAssignment,
  onViewGrading,
  onManageAssignments,
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Icons.ClipboardList className="h-5 w-5" />
        <span>Assignment Actions</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <button
          onClick={onCreateAssignment}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.Plus className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Create Assignment</p>
              <p className="text-sm text-gray-500">Start new assignment</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </button>

        <button
          onClick={onViewGrading}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.ClipboardList className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Grade Submissions</p>
              <p className="text-sm text-gray-500">Review and grade work</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </button>

        <button
          onClick={onManageAssignments}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.BookOpen className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Manage All</p>
              <p className="text-sm text-gray-500">View all assignments</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </button>
      </div>
    </CardContent>
  </Card>
);

// Quick Settings Card Component
const QuickSettingsCard = ({ onProfileClick, onManageClasses }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Icons.Settings className="h-5 w-5" />
        <span>Quick Settings</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <button
          onClick={onProfileClick}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.User className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Profile Settings</p>
              <p className="text-sm text-gray-500">Update your profile</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </button>

        <button
          onClick={onManageClasses}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Class Management</p>
              <p className="text-sm text-gray-500">Manage classes</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </button>
      </div>
    </CardContent>
  </Card>
);

// Stats Card Component
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

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const logoutButtonRef = useRef(null);
  const isLoggingOutRef = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Navigation state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // State for real data
  const [dashboardData, setDashboardData] = useState({
    totalStudents: "0",
    totalClasses: "0",
    activeAssignments: "0",
    pendingGrades: "0",
    averageGrade: "N/A",
    attendanceRate: "0%",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = useCallback(
    async (e) => {
      e?.preventDefault();

      if (isLoggingOutRef.current || isLoggingOut) {
        console.log("Logout blocked - already in progress");
        return;
      }

      isLoggingOutRef.current = true;
      setIsLoggingOut(true);

      if (logoutButtonRef.current) {
        logoutButtonRef.current.disabled = true;
        logoutButtonRef.current.textContent = "Logging out...";
      }

      try {
        await logout();
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout failed:", error);
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

  // Navigation handlers
  const handleProfileClick = () => setActiveTab("profile");
  const handleCreateAssignment = () => setActiveTab("assignments");
  const handleViewGrading = () => setActiveTab("assignments");
  const handleManageAssignments = () => setActiveTab("assignments");
  const handleManageClasses = () => setActiveTab("classes");

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

        // Enhanced fallback data with assignment info
        setDashboardData({
          totalStudents: "85",
          totalClasses: "6",
          activeAssignments: "12",
          pendingGrades: "23",
          averageGrade: "B+",
          attendanceRate: "94%",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherData();
  }, [user?.id]);

  // Enhanced stats with assignment data
  const stats = [
    {
      title: "Total Students",
      value: isLoading ? "..." : dashboardData.totalStudents,
      change: "+5.2%",
      trend: "up",
      IconComponent: Icons.Users,
      color: "blue",
    },
    {
      title: "Active Assignments",
      value: isLoading ? "..." : dashboardData.activeAssignments,
      change: "+2",
      trend: "up",
      IconComponent: Icons.ClipboardList,
      color: "green",
    },
    {
      title: "Pending Grades",
      value: isLoading ? "..." : dashboardData.pendingGrades,
      change: "-5",
      trend: "down",
      IconComponent: Icons.Clock,
      color: "orange",
    },
    {
      title: "Class Average",
      value: isLoading ? "..." : dashboardData.averageGrade,
      change: "+0.3",
      trend: "up",
      IconComponent: Icons.GraduationCap,
      color: "purple",
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
      {/* Enhanced Header with User Menu */}
      <div className="bg-white shadow-sm border-b px-4 sm:px-6 py-4 mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Teacher Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {getUserDisplayName(user)}! Manage your classes and
              track student progress.
            </p>
            {isLoading && (
              <p className="text-sm text-blue-600 mt-1">
                Loading your teaching data...
              </p>
            )}
          </div>

          {/* Enhanced User Menu */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <UserMenuDropdown
              isOpen={isUserMenuOpen}
              setIsOpen={setIsUserMenuOpen}
              user={user}
              onProfileClick={handleProfileClick}
              onLogout={handleLogout}
              isLoggingOut={isLoggingOut}
            />

            {/* Mobile logout button for backup */}
            <button
              ref={logoutButtonRef}
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`
                sm:hidden w-full px-4 py-2 text-sm font-medium text-white rounded-lg 
                transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                ${
                  isLoggingOut
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }
              `}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Content */}
      <div className="px-6">
        {activeTab === "dashboard" && (
          <>
            {/* Enhanced Dashboard Overview Component */}
            <div className="mb-8">
              <DashboardOverview userRole={user?.role} userId={user?.id} />
            </div>

            {/* Enhanced Teacher Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <StatsCard key={stat.title} {...stat} loading={isLoading} />
              ))}
            </div>

            {/* Enhanced Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Assignment Quick Actions */}
              <AssignmentQuickActions
                onCreateAssignment={handleCreateAssignment}
                onViewGrading={handleViewGrading}
                onManageAssignments={handleManageAssignments}
              />

              {/* Classes Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icons.BookOpen className="h-5 w-5" />
                    <span>My Classes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Icons.GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Class Management
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Manage your classes and students
                    </p>
                    <button
                      onClick={handleManageClasses}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View All Classes
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Settings */}
              <QuickSettingsCard
                onProfileClick={handleProfileClick}
                onManageClasses={handleManageClasses}
              />
            </div>

            {/* Data Source Indicator */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                {isLoading
                  ? "Loading from database..."
                  : `Data last updated: ${new Date().toLocaleString()}`}
              </p>
            </div>
          </>
        )}

        {activeTab === "assignments" && (
          <AssignmentProvider teacherId={user?.id}>
            <GradingProvider>
              <div className="space-y-6">
                <AssignmentManagementSuite />
              </div>
            </GradingProvider>
          </AssignmentProvider>
        )}

        {activeTab === "classes" && (
          <div className="space-y-6">
            <ClassManagement />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-8">
            <TeacherProfile />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
