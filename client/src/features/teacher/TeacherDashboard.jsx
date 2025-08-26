// client/src/features/teacher/TeacherDashboard.jsx
import React, { useState } from "react";
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

// Placeholder components
const ClassOverview = ({ classId }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <p className="text-2xl font-bold text-blue-600">32</p>
        <p className="text-sm text-gray-600">Total Students</p>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <p className="text-2xl font-bold text-green-600">28</p>
        <p className="text-sm text-gray-600">Present Today</p>
      </div>
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <p className="text-2xl font-bold text-orange-600">B+</p>
        <p className="text-sm text-gray-600">Avg Grade</p>
      </div>
    </div>
    <p className="text-sm text-gray-500">
      Showing data for: {classId === "all" ? "All Classes" : `Class ${classId}`}
    </p>
  </div>
);

const StudentPerformance = ({ classId }) => (
  <div className="space-y-4">
    <div className="space-y-3">
      {[
        { grade: "A", count: 12, percentage: 35 },
        { grade: "B", count: 15, percentage: 44 },
        { grade: "C", count: 5, percentage: 15 },
        { grade: "D", count: 2, percentage: 6 },
      ].map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm font-medium">Grade {item.grade}</span>
          <div className="flex items-center space-x-2 flex-1 ml-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 w-8">{item.count}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UpcomingAssessments = () => (
  <div className="space-y-4">
    {[
      { subject: "Mathematics", class: "10A", date: "Tomorrow", type: "Quiz" },
      { subject: "Physics", class: "11B", date: "Friday", type: "Test" },
      {
        subject: "Chemistry",
        class: "10B",
        date: "Next Week",
        type: "Lab Report",
      },
    ].map((assessment, index) => (
      <div
        key={index}
        className="flex items-center justify-between p-3 border rounded-lg"
      >
        <div>
          <p className="font-medium text-gray-900">{assessment.subject}</p>
          <p className="text-sm text-gray-500">Class {assessment.class}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-blue-600">{assessment.type}</p>
          <p className="text-sm text-gray-500">{assessment.date}</p>
        </div>
      </div>
    ))}
  </div>
);

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("all");

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
    return "Teacher";
  };

  const classStats = [
    {
      title: "Total Students",
      value: 156,
      change: "+12",
      iconText: "USERS",
      color: "blue",
    },
    {
      title: "Average Grade",
      value: "B+",
      change: "+2.4%",
      iconText: "GRADE",
      color: "green",
    },
    {
      title: "Attendance Rate",
      value: "94%",
      change: "+1.2%",
      iconText: "TIME",
      color: "purple",
    },
    {
      title: "Pending Assessments",
      value: 8,
      change: "-3",
      iconText: "DOCS",
      color: "orange",
    },
  ];

  const upcomingClasses = [
    {
      id: 1,
      subject: "Mathematics",
      class: "10A",
      time: "09:00 AM",
      topic: "Quadratic Equations",
      students: 32,
      room: "201",
    },
    {
      id: 2,
      subject: "Physics",
      class: "11B",
      time: "10:30 AM",
      topic: "Newton's Laws",
      students: 28,
      room: "301",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logout */}
      <div className="bg-white shadow-sm border-b px-6 py-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Teacher Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {getUserDisplayName()}! Manage your classes and
              track student progress
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
        {/* Class Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {classStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}
                  >
                    <span className="text-sm font-medium">{stat.iconText}</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      stat.change.toString().startsWith("+")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
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

        {/* Class Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Class Overview</CardTitle>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Classes</option>
                <option value="10A">Class 10A</option>
                <option value="10B">Class 10B</option>
                <option value="11A">Class 11A</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <ClassOverview classId={selectedClass} />
          </CardContent>
        </Card>

        {/* Schedule and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-sm font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  CAL
                </span>
                <span>Today's Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingClasses.map((class_) => (
                  <div
                    key={class_.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <span className="text-sm font-medium">BOOK</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {class_.subject}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Class {class_.class} • Room {class_.room}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{class_.time}</p>
                      <p className="text-sm text-gray-500">
                        {class_.students} students
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-sm font-bold bg-green-100 text-green-600 px-2 py-1 rounded">
                  CHART
                </span>
                <span>Performance Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentPerformance classId={selectedClass} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-sm font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded">
                    DOCS
                  </span>
                  <span>Upcoming Assessments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingAssessments />
              </CardContent>
            </Card>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-sm font-bold bg-purple-100 text-purple-600 px-2 py-1 rounded">
                  BELL
                </span>
                <span>Recent Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    message: "Assignment submissions due for Class 10A",
                    time: "2 hours ago",
                    type: "assignment",
                  },
                  {
                    id: 2,
                    message: "Parent meeting scheduled for tomorrow",
                    time: "5 hours ago",
                    type: "meeting",
                  },
                  {
                    id: 3,
                    message: "New curriculum update available",
                    time: "1 day ago",
                    type: "update",
                  },
                ].map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        notification.type === "assignment"
                          ? "bg-blue-100 text-blue-600"
                          : notification.type === "meeting"
                            ? "bg-green-100 text-green-600"
                            : "bg-purple-100 text-purple-600"
                      }`}
                    >
                      <span className="text-xs font-bold">
                        {notification.type === "assignment"
                          ? "DOC"
                          : notification.type === "meeting"
                            ? "MTG"
                            : "UPD"}
                      </span>
                    </div>
                    <div>
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
      </div>
    </div>
  );
};

export default TeacherDashboard;
