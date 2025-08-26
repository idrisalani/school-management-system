// client/src/features/parent/ParentDashboard.jsx
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
  Mail: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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
  Edit: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
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
  Student: ({ className = "h-6 w-6", color = "currentColor" }) => (
    <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
};

// Updated StatCard with proper SVG icons
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

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-200 ${
        onClick ? "hover:shadow-md hover:border-blue-300 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <IconComponent className={`h-6 w-6 ${iconColorClasses[color]}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

const ChildCard = ({
  name,
  grade,
  status,
  statusColor,
  recentGrade,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
  >
    <div className="flex items-center">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
        <Icons.Student className="h-5 w-5 text-blue-600" />
      </div>
      <div className="ml-3">
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-sm text-gray-600">{grade}</p>
      </div>
    </div>
    <div className="text-right">
      <span
        className={`text-sm font-medium ${
          statusColor === "green" ? "text-green-600" : "text-red-600"
        }`}
      >
        {status}
      </span>
      <p className="text-sm text-gray-500">Recent: {recentGrade}</p>
    </div>
  </div>
);

const ActivityItem = ({ type, message, time }) => {
  const getIcon = (type) => {
    switch (type) {
      case "grade":
        return Icons.Award;
      case "attendance":
        return Icons.Clock;
      case "assignment":
        return Icons.FileText;
      default:
        return Icons.Bell;
    }
  };

  const IconComponent = getIcon(type);

  return (
    <div className="flex items-start space-x-3">
      <div className="bg-blue-50 p-2 rounded-lg">
        <IconComponent className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{message}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
};

const EventItem = ({ title, date, type }) => (
  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
    <div>
      <p className="font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{date}</p>
    </div>
    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
      {type}
    </span>
  </div>
);

const ActionButton = ({ title, IconComponent, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
  >
    <div className="p-2 bg-gray-100 rounded-lg mb-2">
      <IconComponent className="h-5 w-5 text-gray-600" />
    </div>
    <span className="text-sm font-medium text-gray-900">{title}</span>
  </button>
);

const QuickNavButton = ({ label, IconComponent, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
  >
    <div className="mr-2 p-1 bg-blue-100 rounded">
      <IconComponent className="h-4 w-4 text-blue-600" />
    </div>
    {label}
  </button>
);

const ResourceCard = ({
  title,
  description,
  IconComponent,
  action,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
  >
    <div className="flex items-center mb-2">
      <div className="mr-2 p-1 bg-blue-100 rounded">
        <IconComponent className="h-5 w-5 text-blue-600" />
      </div>
      <h4 className="font-medium text-gray-900">{title}</h4>
    </div>
    <p className="text-sm text-gray-600 mb-3">{description}</p>
    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
      {action} →
    </button>
  </div>
);

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);

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
    return "Parent";
  };

  useEffect(() => {
    // Simulate loading time for dashboard initialization
    const initializeDashboard = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLoading(false);
    };

    initializeDashboard();
  }, []);

  const handleViewChildrenDetails = () => {
    alert("Children details would open here");
  };

  const handleViewProfile = () => {
    alert("Profile would open here");
  };

  const handleResourceAction = (resourceType) => {
    switch (resourceType) {
      case "calendar":
        alert("Academic calendar will open here");
        break;
      case "messages":
        alert("Communication hub will open here");
        break;
      case "handbook":
        alert("Student handbook will download here");
        break;
      default:
        alert("Feature coming soon!");
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              Parent Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {getUserDisplayName()}!
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

      <div className="px-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Good {getTimeOfDay()}, {getUserDisplayName()}!
              </h2>
              <p className="text-gray-600">
                Here's what's happening with your child's education today.
              </p>
            </div>
            <div className="hidden md:flex space-x-3">
              <QuickNavButton
                label="My Children"
                IconComponent={Icons.UserGroup}
                onClick={handleViewChildrenDetails}
              />
              <QuickNavButton
                label="Profile"
                IconComponent={Icons.Edit}
                onClick={handleViewProfile}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats - Updated with proper SVG icons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Children Enrolled"
            value="2"
            color="blue"
            subtitle="Active students"
            IconComponent={Icons.UserGroup}
            onClick={handleViewChildrenDetails}
          />
          <StatCard
            title="Upcoming Events"
            value="3"
            color="green"
            subtitle="This week"
            IconComponent={Icons.Calendar}
            onClick={() => alert("Events calendar will open here")}
          />
          <StatCard
            title="Average Grade"
            value="A-"
            color="purple"
            subtitle="Overall performance"
            IconComponent={Icons.Award}
            onClick={handleViewChildrenDetails}
          />
          <StatCard
            title="Attendance Rate"
            value="96%"
            color="orange"
            subtitle="This semester"
            IconComponent={Icons.Clock}
            onClick={handleViewChildrenDetails}
          />
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Children Overview */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                My Children
              </h3>
              <button
                onClick={handleViewChildrenDetails}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center transition-colors"
              >
                View Details →
              </button>
            </div>
            <div className="space-y-4">
              <ChildCard
                name="Sarah Johnson"
                grade="Grade 10"
                status="Present Today"
                statusColor="green"
                recentGrade="A"
                onClick={handleViewChildrenDetails}
              />
              <ChildCard
                name="Michael Johnson"
                grade="Grade 8"
                status="Present Today"
                statusColor="green"
                recentGrade="B+"
                onClick={handleViewChildrenDetails}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              <ActivityItem
                type="grade"
                message="Sarah received an A on Mathematics Quiz"
                time="2 hours ago"
              />
              <ActivityItem
                type="attendance"
                message="Michael marked present for all classes today"
                time="5 hours ago"
              />
              <ActivityItem
                type="assignment"
                message="New assignment posted in Sarah's English class"
                time="1 day ago"
              />
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upcoming Events
            </h3>
            <div className="space-y-4">
              <EventItem
                title="Parent-Teacher Conference"
                date="Tomorrow, 3:00 PM"
                type="meeting"
              />
              <EventItem
                title="Science Fair"
                date="Friday, All Day"
                type="event"
              />
              <EventItem
                title="Report Cards Available"
                date="Next Monday"
                type="grade"
              />
            </div>
          </div>

          {/* Quick Actions - Updated with SVG icons */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ActionButton
                title="View Grades"
                IconComponent={Icons.Award}
                onClick={handleViewChildrenDetails}
              />
              <ActionButton
                title="Check Attendance"
                IconComponent={Icons.Clock}
                onClick={handleViewChildrenDetails}
              />
              <ActionButton
                title="Messages"
                IconComponent={Icons.Mail}
                onClick={() => alert("Messages will open here")}
              />
              <ActionButton
                title="Settings"
                IconComponent={Icons.Settings}
                onClick={handleViewProfile}
              />
            </div>

            {showQuickActions && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <ActionButton
                    title="Academic Report"
                    IconComponent={Icons.ClipboardList}
                    onClick={handleViewChildrenDetails}
                  />
                  <ActionButton
                    title="Payment History"
                    IconComponent={Icons.CreditCard}
                    onClick={() => alert("Payment history will open here")}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showQuickActions ? "Show Less" : "Show More Actions"}
            </button>
          </div>
        </div>

        {/* Parent Resources - Updated with SVG icons */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Parent Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResourceCard
              title="Academic Calendar"
              description="View important school dates and events"
              IconComponent={Icons.Calendar}
              action="View Calendar"
              onClick={() => handleResourceAction("calendar")}
            />
            <ResourceCard
              title="Communication Hub"
              description="Messages from teachers and school administration"
              IconComponent={Icons.Mail}
              action="Check Messages"
              onClick={() => handleResourceAction("messages")}
            />
            <ResourceCard
              title="Student Handbook"
              description="School policies and guidelines"
              IconComponent={Icons.FileText}
              action="Download PDF"
              onClick={() => handleResourceAction("handbook")}
            />
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800">Debug Info:</h4>
            <p className="text-sm text-yellow-700">User Email: {user?.email}</p>
            <p className="text-sm text-yellow-700">
              User Role: {user?.role || "Not set"}
            </p>
            <p className="text-sm text-yellow-700">
              Full Name: {user?.name || "Not set"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
