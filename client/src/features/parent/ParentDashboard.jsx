//@ts-nocheck

// client/src/features/parent/ParentDashboard.jsx - Fully Integrated
import React, { useState, useEffect } from "react";
import {
  User,
  BookOpen,
  Calendar,
  TrendingUp,
  Bell,
  Settings,
  GraduationCap,
  Trophy,
  Users,
  ArrowRight,
  Edit3,
} from "lucide-react";

// Import the child components
import ParentProfile from "./ParentProfile.jsx";
import ChildrenOverview from "./ChildrenOverview.jsx";

const ParentDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard', 'profile', 'children'

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    setLoading(false);
  }, []);

  const handleViewChildrenDetails = () => {
    setCurrentView("children");
  };

  const handleViewProfile = () => {
    setCurrentView("profile");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  const handleResourceAction = (resourceType) => {
    // Future: Handle different resource actions
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

  // Render different views based on currentView state
  if (currentView === "profile") {
    return <ParentProfile onBack={handleBackToDashboard} />;
  }

  if (currentView === "children") {
    return <ChildrenOverview onBack={handleBackToDashboard} />;
  }

  // Default dashboard view
  const userName = user?.firstName || user?.name || "Parent";
  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Parent Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {userName}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <Settings className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {userName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section with Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Good {getTimeOfDay()}, {userName}!
              </h2>
              <p className="text-gray-600">
                Here's what's happening with your child's education today.
              </p>
            </div>
            {/* Quick navigation buttons */}
            <div className="hidden md:flex space-x-3">
              <QuickNavButton
                label="My Children"
                icon={Users}
                onClick={handleViewChildrenDetails}
              />
              <QuickNavButton
                label="Profile"
                icon={Edit3}
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
            icon={User}
            color="blue"
            subtitle="Active students"
            onClick={handleViewChildrenDetails}
          />
          <StatCard
            title="Upcoming Events"
            value="3"
            icon={Calendar}
            color="green"
            subtitle="This week"
          />
          <StatCard
            title="Average Grade"
            value="A-"
            icon={TrendingUp}
            color="purple"
            subtitle="Overall performance"
            onClick={handleViewChildrenDetails}
          />
          <StatCard
            title="Attendance Rate"
            value="96%"
            icon={BookOpen}
            color="orange"
            subtitle="This semester"
            onClick={handleViewChildrenDetails}
          />
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Children Overview - Enhanced */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                My Children
              </h3>
              <button
                onClick={handleViewChildrenDetails}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center transition-colors"
              >
                View Details <ArrowRight className="h-4 w-4 ml-1" />
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

          {/* Quick Actions - Enhanced */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ActionButton
                title="View Grades"
                icon={TrendingUp}
                onClick={handleViewChildrenDetails}
              />
              <ActionButton
                title="Check Attendance"
                icon={Calendar}
                onClick={handleViewChildrenDetails}
              />
              <ActionButton title="Messages" icon={Bell} />
              <ActionButton
                title="Settings"
                icon={Settings}
                onClick={handleViewProfile}
              />
            </div>

            {/* Additional Actions Toggle */}
            {showQuickActions && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <ActionButton
                    title="Academic Report"
                    icon={BookOpen}
                    onClick={handleViewChildrenDetails}
                  />
                  <ActionButton title="Payment History" icon={Trophy} />
                </div>
              </div>
            )}

            {/* Toggle button for more actions */}
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showQuickActions ? "Show Less" : "Show More Actions"}
            </button>
          </div>
        </div>

        {/* Enhanced Features Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Parent Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResourceCard
              title="Academic Calendar"
              description="View important school dates and events"
              icon={Calendar}
              action="View Calendar"
              onClick={() => handleResourceAction("calendar")}
            />
            <ResourceCard
              title="Communication Hub"
              description="Messages from teachers and school administration"
              icon={Bell}
              action="Check Messages"
              onClick={() => handleResourceAction("messages")}
            />
            <ResourceCard
              title="Student Handbook"
              description="School policies and guidelines"
              icon={BookOpen}
              action="Download PDF"
              onClick={() => handleResourceAction("handbook")}
            />
          </div>
        </div>

        {/* User Info Debug (Development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800">
              Debug Info (Dev Only):
            </h4>
            <p className="text-sm text-yellow-700">User Email: {userEmail}</p>
            <p className="text-sm text-yellow-700">
              User Role: {user?.role || "Not set"}
            </p>
            <p className="text-sm text-yellow-700">
              Full Name: {user?.name || "Not set"}
            </p>
            <p className="text-sm text-yellow-700">
              Current View: {currentView}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon: Icon, color, subtitle, onClick }) => {
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
          <Icon className="h-6 w-6" />
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
        <GraduationCap className="h-5 w-5 text-blue-600" />
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
        return Trophy;
      case "attendance":
        return Calendar;
      case "assignment":
        return BookOpen;
      default:
        return Bell;
    }
  };

  const Icon = getIcon(type);

  return (
    <div className="flex items-start space-x-3">
      <div className="bg-blue-50 p-2 rounded-lg">
        <Icon className="h-4 w-4 text-blue-600" />
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

const ActionButton = ({ title, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
  >
    <Icon className="h-6 w-6 text-gray-600 mb-2" />
    <span className="text-sm font-medium text-gray-900">{title}</span>
  </button>
);

// New Components
const QuickNavButton = ({ label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
  >
    <Icon className="h-4 w-4 mr-2" />
    {label}
  </button>
);

const ResourceCard = ({ title, description, icon: Icon, action, onClick }) => (
  <div
    onClick={onClick}
    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
  >
    <div className="flex items-center mb-2">
      <Icon className="h-5 w-5 text-blue-600 mr-2" />
      <h4 className="font-medium text-gray-900">{title}</h4>
    </div>
    <p className="text-sm text-gray-600 mb-3">{description}</p>
    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
      {action} →
    </button>
  </div>
);

// Helper function
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

export default ParentDashboard;
