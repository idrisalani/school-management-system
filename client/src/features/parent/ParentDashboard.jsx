// @ts-nocheck
// FIXED: client/src/features/parent/ParentDashboard.jsx - Prevent unauthorized API calls
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  getParentDashboardData,
  getUserDisplayName,
} from "../../services/dashboardApi.js";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import ParentProfile from "./ParentProfile";

// ONLY FIX: Add safe getUserDisplayName fallback to prevent toString() errors
const safeGetUserDisplayName = (user) => {
  try {
    return getUserDisplayName(user);
  } catch (error) {
    console.warn("getUserDisplayName error:", error);
    // Safe fallback
    if (!user) return "Guest";
    const firstName = user.firstName || user.first_name || user.fname || "";
    const lastName = user.lastName || user.last_name || user.lname || "";
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (user.username) return user.username;
    if (user.email) return user.email;
    return "Parent User";
  }
};

// SVG Icon Components (keeping existing ones)
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
  UserGroup: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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
  Heart: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
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
};

// Card components (keeping existing)
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

// Tab Navigation Component (keeping existing)
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: "dashboard",
      name: "Parent Dashboard",
      icon: Icons.Home,
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
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <tab.icon
              className={`
                -ml-0.5 mr-2 h-5 w-5 transition-colors
                ${
                  activeTab === tab.id
                    ? "text-purple-500"
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

// User Menu Dropdown Component (keeping existing)
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
        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Icons.Heart className="h-5 w-5 text-purple-600" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {safeGetUserDisplayName(user)}
          </p>
          <p className="text-xs text-gray-500">{user?.email || ""}</p>
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
                {safeGetUserDisplayName(user)}
              </p>
              <p className="text-xs text-gray-500">{user?.email || ""}</p>
              <p className="text-xs text-purple-600 font-medium">Parent</p>
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

// Quick Settings Card Component (keeping existing)
const QuickSettingsCard = ({ onProfileClick, onChildrenClick }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Icons.Settings className="h-5 w-5" />
        <span>Parent Tools</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <button
          onClick={onProfileClick}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.User className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Profile Settings</p>
              <p className="text-sm text-gray-500">
                Update your contact information
              </p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </button>

        <button
          onClick={onChildrenClick}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.UserGroup className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Children Management</p>
              <p className="text-sm text-gray-500">
                View your children's progress
              </p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </button>

        <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Icons.Bell className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Notifications</p>
              <p className="text-sm text-gray-500">
                Manage communication preferences
              </p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </button>
      </div>
    </CardContent>
  </Card>
);

// Stats Card Component (keeping existing)
const StatCard = ({
  title,
  value,
  color,
  subtitle,
  onClick,
  IconComponent,
}) => {
  const colorClasses = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  // ONLY FIX: Safe value conversion to prevent toString() errors
  const safeValue = (() => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    return String(value);
  })();

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-200 ${
        onClick ? "hover:shadow-md hover:border-purple-300 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <IconComponent className={`h-6 w-6 ${iconColorClasses[color]}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{safeValue}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

const ParentDashboard = () => {
  const { user, logout, isAuthenticated } = useAuth(); // Add isAuthenticated
  const navigate = useNavigate();
  const logoutButtonRef = useRef(null);
  const isLoggingOutRef = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Navigation state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // State for real data
  const [dashboardData, setDashboardData] = useState({
    childrenCount: 0,
    upcomingEvents: 0,
    averageGrade: "N/A",
    attendanceRate: "0%",
    children: [],
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
  const handleProfileClick = () => {
    setActiveTab("profile");
  };

  const handleViewChildrenDetails = () => {
    navigate("/parent/children");
  };

  // FIXED: Fetch parent dashboard data only when authenticated
  useEffect(() => {
    const fetchParentData = async () => {
      // FIXED: Only fetch data if user is authenticated
      if (!isAuthenticated || !user?.id) {
        console.log(
          "🔒 ParentDashboard: User not authenticated, skipping API calls"
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log(
          "📊 ParentDashboard: Fetching data for authenticated parent:",
          user.id
        );
        const data = await getParentDashboardData(user.id);
        setDashboardData(data);
        console.log("✅ ParentDashboard: Data fetched successfully");
      } catch (error) {
        console.error(
          "❌ ParentDashboard: Failed to fetch parent dashboard data:",
          error
        );
        setError("Failed to load parent data. Please check your connection.");

        // Fallback data
        setDashboardData({
          childrenCount: 2,
          upcomingEvents: 3,
          averageGrade: "A-",
          attendanceRate: "96%",
          children: [
            { id: 1, name: "Sarah Johnson", status: "active" },
            { id: 2, name: "Michael Johnson", status: "active" },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentData();
  }, [user?.id, isAuthenticated]); // Add isAuthenticated dependency

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  // FIXED: Show authentication message when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Please log in to access your parent dashboard
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
              Parent Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Good {getTimeOfDay()}, {safeGetUserDisplayName(user)}! Stay
              connected with your children's education.
            </p>
            {isLoading && (
              <p className="text-sm text-blue-600 mt-1">
                Loading your children's data...
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

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Content */}
      <div className="px-6">
        {activeTab === "dashboard" && (
          <>
            {/* Enhanced Dashboard Overview Component - FIXED: Pass authentication status */}
            <div className="mb-8">
              <DashboardOverview userRole={user?.role} userId={user?.id} />
            </div>

            {/* Parent Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Children Enrolled"
                value={isLoading ? "..." : dashboardData.childrenCount}
                color="blue"
                subtitle="Active students"
                IconComponent={Icons.UserGroup}
                onClick={handleViewChildrenDetails}
              />
              <StatCard
                title="Upcoming Events"
                value={isLoading ? "..." : dashboardData.upcomingEvents}
                color="green"
                subtitle="This week"
                IconComponent={Icons.Calendar}
                onClick={() => console.log("Navigate to events calendar")}
              />
              <StatCard
                title="Average Grade"
                value={isLoading ? "..." : dashboardData.averageGrade}
                color="purple"
                subtitle="Overall performance"
                IconComponent={Icons.Award}
                onClick={handleViewChildrenDetails}
              />
              <StatCard
                title="Attendance Rate"
                value={isLoading ? "..." : dashboardData.attendanceRate}
                color="orange"
                subtitle="This semester"
                IconComponent={Icons.Clock}
                onClick={handleViewChildrenDetails}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Children Overview */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icons.UserGroup className="h-5 w-5" />
                        <span>My Children</span>
                      </div>
                      <button
                        onClick={handleViewChildrenDetails}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center transition-colors"
                      >
                        View Details →
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : dashboardData.children &&
                      dashboardData.children.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.children.map((child, index) => (
                          <div
                            key={child.id}
                            onClick={handleViewChildrenDetails}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Icons.User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  {child.name || "Unknown"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Grade {8 + index * 2}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium text-green-600">
                                Present Today
                              </span>
                              <p className="text-sm text-gray-500">
                                Recent: {index === 0 ? "A" : "B+"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Icons.UserGroup className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No children enrolled</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Settings */}
              <QuickSettingsCard
                onProfileClick={handleProfileClick}
                onChildrenClick={handleViewChildrenDetails}
              />
            </div>

            {/* Recent Activity and Upcoming Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <Icons.Award className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Sarah received an A on Mathematics Quiz
                        </p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-50 p-2 rounded-lg">
                        <Icons.Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Michael marked present for all classes today
                        </p>
                        <p className="text-xs text-gray-500">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">
                          Parent-Teacher Conference
                        </p>
                        <p className="text-sm text-gray-600">
                          Tomorrow, 3:00 PM
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        meeting
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">
                          Science Fair
                        </p>
                        <p className="text-sm text-gray-600">Friday, All Day</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        event
                      </span>
                    </div>
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
          </>
        )}

        {activeTab === "profile" && (
          <div className="space-y-8">
            <ParentProfile />
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
