// @ts-nocheck

// client/src/components/demo/DemoWrapper.jsx
// Enhanced version with beautiful UX and interactive features

import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import ModalRoleSelector from "./ModalRoleSelector";

const DemoWrapper = () => {
  const { role } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ stats: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    if (role) {
      setStats(getInitialStats(role));
    }
  }, [role]);

  // Notification system
  const showNotification = (message, type = "success") => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Mock action handlers with realistic delays
  const handleAction = async (actionType, actionData) => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    switch (actionType) {
      case "create_assignment":
        setStats((prev) => ({
          ...prev,
          stats: prev.stats.map((stat) =>
            stat.label === "Assignments Due" || stat.label === "Pending Grades"
              ? { ...stat, value: String(parseInt(stat.value) + 1) }
              : stat
          ),
        }));
        showNotification(
          `Assignment "${actionData.assignmentTitle || "New Assignment"}" created successfully!`
        );
        break;

      case "grade_assignment":
        setStats((prev) => ({
          ...prev,
          stats: prev.stats.map((stat) =>
            stat.label === "Pending Grades"
              ? {
                  ...stat,
                  value: String(Math.max(0, parseInt(stat.value) - 1)),
                }
              : stat
          ),
        }));
        showNotification("Assignment graded and returned to student!");
        break;

      case "mark_attendance":
        showNotification("Attendance marked for all students in class!");
        break;

      case "send_announcement":
        showNotification("Announcement sent to all students and parents!");
        break;

      case "pay_fees":
        setStats((prev) => ({
          ...prev,
          stats: prev.stats.map((stat) =>
            stat.label === "Outstanding Fees" ? { ...stat, value: "$0" } : stat
          ),
        }));
        showNotification(
          "Payment processed successfully! Receipt sent to email."
        );
        break;

      case "view_grades":
        showNotification("Opening detailed grade report...", "info");
        break;

      case "enroll_student":
        setStats((prev) => ({
          ...prev,
          stats: prev.stats.map((stat) =>
            stat.label === "Total Students"
              ? {
                  ...stat,
                  value: String(parseInt(stat.value.replace(",", "")) + 1),
                }
              : stat
          ),
        }));
        showNotification("New student enrolled successfully!");
        break;

      default:
        showNotification(
          `${actionData.action || "Action"} completed successfully!`
        );
    }

    setIsLoading(false);
  };

  // Handle role switching from modal
  const handleRoleSwitch = (newRole) => {
    // Clear demo state and navigate to new role
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("demo_mode");
      sessionStorage.removeItem("demo_role");
      sessionStorage.removeItem("demo_user");
    }

    // Navigate to new role demo
    window.location.href = `/demo/${newRole}`;
  };

  // Basic validation
  if (!role) {
    return <Navigate to="/demo" replace />;
  }

  const validRoles = ["admin", "teacher", "student", "parent"];
  if (!validRoles.includes(role)) {
    return <Navigate to="/demo" replace />;
  }

  const demoContent = getDemoContent(role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Demo Mode Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                  🎭 DEMO MODE
                </span>
                <span className="text-blue-100">|</span>
                <span className="text-sm font-medium">
                  Exploring as:{" "}
                  <span className="font-bold text-blue-100">
                    {role.toUpperCase()}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowRoleModal(true)}
                className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Switch Role
              </button>
              <button
                onClick={() => {
                  // Clear demo state and go home
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("demo_mode");
                    sessionStorage.removeItem("demo_role");
                    sessionStorage.removeItem("demo_user");
                  }
                  window.location.href = "/";
                }}
                className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Exit Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification System */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 animate-slide-in ${
              notification.type === "success"
                ? "bg-green-100 border border-green-400 text-green-700"
                : notification.type === "error"
                  ? "bg-red-100 border border-red-400 text-red-700"
                  : "bg-blue-100 border border-blue-400 text-blue-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {demoContent.title}
          </h1>
          <p className="text-lg text-gray-600">
            This is a fully functional demo with realistic sample data. Try the
            interactive features below!
          </p>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.stats?.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {stat.label}
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              <div className="h-1 bg-gray-100 rounded">
                <div
                  className={`h-1 rounded ${getProgressColor(index)} transition-all duration-500`}
                  style={{ width: `${getProgressWidth(stat.value)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getQuickActions(role).map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action.type, action)}
                disabled={isLoading}
                className={`p-4 text-center rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-md ${action.color} ${
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:opacity-90"
                }`}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs opacity-80">{action.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Recent Activities */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">📋</span>
              Recent Activities
            </h2>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              {demoContent.recentActivities.map((activity, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{activity}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeAgo(index)} • Demo Activity
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    New
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Demo Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <p className="text-blue-700 font-medium mb-2">
              🎭 You're in Demo Mode
            </p>
            <p className="text-blue-600 text-sm">
              All interactions are simulated with sample data. No real data is
              affected.
              <br />
              Try the interactive buttons above to see how the system responds!
            </p>
          </div>
        </div>
      </div>

      {/* Modal Role Selector */}
      <ModalRoleSelector
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onRoleSelect={handleRoleSwitch}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 font-medium">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getInitialStats(role) {
  const data = getDemoContent(role);
  return { stats: data.stats };
}

function getDemoContent(role) {
  switch (role) {
    case "admin":
      return {
        title: "Admin Dashboard - Demo Mode",
        stats: [
          { label: "Total Students", value: "1,247" },
          { label: "Total Teachers", value: "89" },
          { label: "Total Classes", value: "156" },
          { label: "Monthly Revenue", value: "$45,670" },
        ],
        recentActivities: [
          "New student John Doe enrolled in Computer Science",
          "Teacher Sarah Johnson updated Math 101 curriculum",
          "Payment received from student ID: 12345",
          "New announcement posted for all students",
        ],
      };

    case "teacher":
      return {
        title: "Teacher Dashboard - Demo Mode",
        stats: [
          { label: "My Classes", value: "6" },
          { label: "Total Students", value: "156" },
          { label: "Pending Grades", value: "23" },
          { label: "Assignments Due", value: "8" },
        ],
        recentActivities: [
          "Assignment 'React Basics' submitted by 15 students",
          "Quiz 'JavaScript Fundamentals' graded",
          "New student enrolled in Web Development class",
          "Parent meeting scheduled for tomorrow",
        ],
      };

    case "student":
      return {
        title: "Student Dashboard - Demo Mode",
        stats: [
          { label: "Current GPA", value: "3.7" },
          { label: "Enrolled Classes", value: "5" },
          { label: "Completed Assignments", value: "24" },
          { label: "Attendance Rate", value: "94%" },
        ],
        recentActivities: [
          "Grade updated for Mathematics Quiz: A-",
          "New assignment posted in Computer Science",
          "Attendance marked for today's classes",
          "Library book 'React Patterns' due in 3 days",
        ],
      };

    case "parent":
      return {
        title: "Parent Dashboard - Demo Mode",
        stats: [
          { label: "Children", value: "2" },
          { label: "Average GPA", value: "3.5" },
          { label: "Attendance Rate", value: "92%" },
          { label: "Outstanding Fees", value: "$320" },
        ],
        recentActivities: [
          "Emma's grade updated in Mathematics: B+",
          "John's attendance marked for today",
          "Parent-teacher meeting scheduled for next week",
          "School fee payment reminder sent",
        ],
      };

    default:
      return { title: "Unknown Role", stats: [], recentActivities: [] };
  }
}

function getQuickActions(role) {
  switch (role) {
    case "admin":
      return [
        {
          title: "Enroll Student",
          subtitle: "Add new student",
          icon: "👥",
          color: "bg-blue-50 hover:bg-blue-100 text-blue-700",
          type: "enroll_student",
        },
        {
          title: "View Reports",
          subtitle: "Analytics & insights",
          icon: "📊",
          color: "bg-green-50 hover:bg-green-100 text-green-700",
          type: "view_reports",
          action: "Generate Report",
        },
        {
          title: "Send Announcement",
          subtitle: "Broadcast message",
          icon: "📢",
          color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
          type: "send_announcement",
        },
        {
          title: "System Settings",
          subtitle: "Configure system",
          icon: "⚙️",
          color: "bg-orange-50 hover:bg-orange-100 text-orange-700",
          type: "system_settings",
          action: "Update Settings",
        },
      ];

    case "teacher":
      return [
        {
          title: "Create Assignment",
          subtitle: "New homework",
          icon: "📝",
          color: "bg-blue-50 hover:bg-blue-100 text-blue-700",
          type: "create_assignment",
          assignmentTitle: "React Fundamentals Quiz",
        },
        {
          title: "Grade Assignment",
          subtitle: "Review submissions",
          icon: "✅",
          color: "bg-green-50 hover:bg-green-100 text-green-700",
          type: "grade_assignment",
        },
        {
          title: "Mark Attendance",
          subtitle: "Today's classes",
          icon: "📅",
          color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
          type: "mark_attendance",
        },
        {
          title: "Message Parents",
          subtitle: "Send updates",
          icon: "💬",
          color: "bg-orange-50 hover:bg-orange-100 text-orange-700",
          type: "message_parents",
          action: "Send Message",
        },
      ];

    case "student":
      return [
        {
          title: "View Grades",
          subtitle: "Current GPA: 3.7",
          icon: "📊",
          color: "bg-blue-50 hover:bg-blue-100 text-blue-700",
          type: "view_grades",
        },
        {
          title: "Submit Assignment",
          subtitle: "3 due soon",
          icon: "📤",
          color: "bg-green-50 hover:bg-green-100 text-green-700",
          type: "submit_assignment",
          action: "Submit Work",
        },
        {
          title: "Class Schedule",
          subtitle: "Today's classes",
          icon: "🕒",
          color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
          type: "view_schedule",
          action: "View Schedule",
        },
        {
          title: "Library",
          subtitle: "Digital resources",
          icon: "📚",
          color: "bg-orange-50 hover:bg-orange-100 text-orange-700",
          type: "access_library",
          action: "Browse Library",
        },
      ];

    case "parent":
      return [
        {
          title: "Pay Fees",
          subtitle: "Outstanding: $320",
          icon: "💳",
          color: "bg-blue-50 hover:bg-blue-100 text-blue-700",
          type: "pay_fees",
        },
        {
          title: "Schedule Meeting",
          subtitle: "Parent-teacher conference",
          icon: "👥",
          color: "bg-green-50 hover:bg-green-100 text-green-700",
          type: "schedule_meeting",
          action: "Book Meeting",
        },
        {
          title: "View Report Cards",
          subtitle: "Academic progress",
          icon: "📋",
          color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
          type: "view_reports",
          action: "Download Reports",
        },
        {
          title: "Contact Teacher",
          subtitle: "Send message",
          icon: "✉️",
          color: "bg-orange-50 hover:bg-orange-100 text-orange-700",
          type: "contact_teacher",
          action: "Send Message",
        },
      ];

    default:
      return [];
  }
}

function getProgressColor(index) {
  const colors = [
    "bg-blue-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-orange-400",
  ];
  return colors[index % colors.length];
}

function getProgressWidth(value) {
  const numValue = parseInt(value.replace(/[^0-9]/g, ""));
  return Math.min(100, Math.max(10, (numValue % 100) + 20));
}

function getTimeAgo(index) {
  const times = ["2 mins ago", "15 mins ago", "1 hour ago", "3 hours ago"];
  return times[index % times.length];
}

export default DemoWrapper;
