// client/src/features/student/StudentDashboard.jsx
import React from "react";
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

// Simple placeholder components with text icons
const GradesChart = () => (
  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <div className="text-4xl mb-4">📊</div>
      <p className="text-gray-500">Grade Performance Chart</p>
      <p className="text-sm text-gray-400 mt-2">Coming Soon</p>
    </div>
  </div>
);

const AttendanceOverview = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-900">This Month</span>
      <span className="text-2xl font-bold text-green-600">92%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-green-600 h-2 rounded-full"
        style={{ width: "92%" }}
      ></div>
    </div>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-gray-500">Present Days</p>
        <p className="font-semibold">18</p>
      </div>
      <div>
        <p className="text-gray-500">Absent Days</p>
        <p className="font-semibold">2</p>
      </div>
    </div>
  </div>
);

const UpcomingAssignments = () => (
  <div className="space-y-4">
    {[
      {
        subject: "Mathematics",
        title: "Algebra Practice",
        due: "Tomorrow",
        priority: "high",
      },
      {
        subject: "Science",
        title: "Lab Report",
        due: "3 days",
        priority: "medium",
      },
      {
        subject: "English",
        title: "Essay Writing",
        due: "1 week",
        priority: "low",
      },
    ].map((assignment, index) => (
      <div
        key={index}
        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
      >
        <div>
          <p className="font-medium text-gray-900">{assignment.title}</p>
          <p className="text-sm text-gray-500">{assignment.subject}</p>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-medium ${
              assignment.priority === "high"
                ? "text-red-600"
                : assignment.priority === "medium"
                  ? "text-yellow-600"
                  : "text-green-600"
            }`}
          >
            Due {assignment.due}
          </p>
        </div>
      </div>
    ))}
  </div>
);

const TimeTable = () => (
  <div className="space-y-3">
    {[
      {
        time: "9:00 AM",
        subject: "Mathematics",
        room: "Room 101",
        status: "current",
      },
      {
        time: "10:30 AM",
        subject: "Science",
        room: "Lab A",
        status: "upcoming",
      },
      {
        time: "12:00 PM",
        subject: "English",
        room: "Room 205",
        status: "upcoming",
      },
      {
        time: "2:00 PM",
        subject: "History",
        room: "Room 301",
        status: "upcoming",
      },
    ].map((class_item, index) => (
      <div
        key={index}
        className={`flex items-center justify-between p-3 rounded-lg ${
          class_item.status === "current"
            ? "bg-blue-50 border border-blue-200"
            : "bg-gray-50"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              class_item.status === "current" ? "bg-blue-500" : "bg-gray-300"
            }`}
          ></div>
          <div>
            <p className="font-medium text-gray-900">{class_item.subject}</p>
            <p className="text-sm text-gray-500">{class_item.room}</p>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600">{class_item.time}</p>
      </div>
    ))}
  </div>
);

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    return "Student";
  };
  const quickStats = [
    {
      title: "Attendance",
      value: "92%",
      icon: "🕒",
      trend: "up",
      trendValue: "+2.5%",
      color: "blue",
    },
    {
      title: "Average Grade",
      value: "A-",
      icon: "🏆",
      trend: "up",
      trendValue: "+3.2%",
      color: "green",
    },
    {
      title: "Assignments",
      value: "8/10",
      icon: "📄",
      trend: "down",
      trendValue: "-1",
      color: "orange",
    },
    {
      title: "Activities",
      value: "5",
      icon: "📅",
      trend: "up",
      trendValue: "+2",
      color: "purple",
    },
  ];

  const notifications = [
    {
      id: 1,
      type: "assignment",
      message: "Math homework due tomorrow",
      time: "2 hours ago",
      priority: "high",
    },
    {
      id: 2,
      type: "grade",
      message: "New grade posted for Science",
      time: "5 hours ago",
      priority: "medium",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logout */}
      <div className="bg-white shadow-sm border-b px-6 py-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Student Dashboard
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

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div
                    className={`flex items-center space-x-1 text-sm ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span>{stat.trendValue}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </h3>
                  <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Grades Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🏆</span>
                <span>Grade Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GradesChart />
            </CardContent>
          </Card>

          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🕒</span>
                <span>Attendance Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceOverview />
            </CardContent>
          </Card>
        </div>

        {/* Lower Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Assignments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📄</span>
                  <span>Upcoming Assignments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingAssignments />
              </CardContent>
            </Card>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>🔔</span>
                  <span>Notifications</span>
                </div>
                <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                  {notifications.length} new
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg ${
                      notification.priority === "high"
                        ? "bg-red-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <span className="text-red-500">
                      {notification.priority === "high" ? "⚠️" : "🔔"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timetable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📅</span>
              <span>Today's Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
