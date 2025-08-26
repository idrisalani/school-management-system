// client/src/features/parent/ParentDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

// Simplified components without external dependencies
const StatCard = ({ title, value, color, subtitle, onClick }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
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
          <span className="text-sm font-bold">
            {title === "Children Enrolled"
              ? "USER"
              : title === "Upcoming Events"
                ? "CAL"
                : title === "Average Grade"
                  ? "GRAD"
                  : "BOOK"}
          </span>
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
        <span className="text-xs font-bold text-blue-600">STU</span>
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

const ActivityItem = ({ type, message, time }) => (
  <div className="flex items-start space-x-3">
    <div className="bg-blue-50 p-2 rounded-lg">
      <span className="text-xs font-bold text-blue-600">
        {type === "grade"
          ? "GRD"
          : type === "attendance"
            ? "ATT"
            : type === "assignment"
              ? "ASG"
              : "NOT"}
      </span>
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-900">{message}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  </div>
);

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

const ActionButton = ({ title, iconType, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
  >
    <span className="text-xs font-bold text-gray-600 mb-2 px-2 py-1 bg-gray-100 rounded">
      {iconType}
    </span>
    <span className="text-sm font-medium text-gray-900">{title}</span>
  </button>
);

const QuickNavButton = ({ label, iconType, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
  >
    <span className="text-xs font-bold mr-2 px-1 py-1 bg-blue-100 text-blue-600 rounded">
      {iconType}
    </span>
    {label}
  </button>
);

const ResourceCard = ({ title, description, iconType, action, onClick }) => (
  <div
    onClick={onClick}
    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
  >
    <div className="flex items-center mb-2">
      <span className="text-xs font-bold text-blue-600 mr-2 px-2 py-1 bg-blue-100 rounded">
        {iconType}
      </span>
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
                iconType="KIDS"
                onClick={handleViewChildrenDetails}
              />
              <QuickNavButton
                label="Profile"
                iconType="EDIT"
                onClick={handleViewProfile}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Children Enrolled"
            value="2"
            color="blue"
            subtitle="Active students"
            onClick={handleViewChildrenDetails}
          />
          <StatCard
            title="Upcoming Events"
            value="3"
            color="green"
            subtitle="This week"
            onClick={() => alert("Events calendar will open here")}
          />
          <StatCard
            title="Average Grade"
            value="A-"
            color="purple"
            subtitle="Overall performance"
            onClick={handleViewChildrenDetails}
          />
          <StatCard
            title="Attendance Rate"
            value="96%"
            color="orange"
            subtitle="This semester"
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

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ActionButton
                title="View Grades"
                iconType="GRD"
                onClick={handleViewChildrenDetails}
              />
              <ActionButton
                title="Check Attendance"
                iconType="ATT"
                onClick={handleViewChildrenDetails}
              />
              <ActionButton
                title="Messages"
                iconType="MSG"
                onClick={() => alert("Messages will open here")}
              />
              <ActionButton
                title="Settings"
                iconType="SET"
                onClick={handleViewProfile}
              />
            </div>

            {showQuickActions && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <ActionButton
                    title="Academic Report"
                    iconType="RPT"
                    onClick={handleViewChildrenDetails}
                  />
                  <ActionButton
                    title="Payment History"
                    iconType="PAY"
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

        {/* Parent Resources */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Parent Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResourceCard
              title="Academic Calendar"
              description="View important school dates and events"
              iconType="CAL"
              action="View Calendar"
              onClick={() => handleResourceAction("calendar")}
            />
            <ResourceCard
              title="Communication Hub"
              description="Messages from teachers and school administration"
              iconType="MSG"
              action="Check Messages"
              onClick={() => handleResourceAction("messages")}
            />
            <ResourceCard
              title="Student Handbook"
              description="School policies and guidelines"
              iconType="DOC"
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
