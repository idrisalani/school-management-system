// @ts-nocheck

// client/src/features/teacher/TeacherDashboard.jsx
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  Users,
  Book,
  Calendar,
  FileText,
  Award,
  Clock,
  Bell,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";

// Import dashboard components
import ClassOverview from "./components/ClassOverview";
import UpcomingAssessments from "./components/UpcomingAssessments";
import StudentPerformance from "./components/StudentPerformance";
import ClassManagement from "./ClassManagement";

// Import assignment components
import AssignmentSystem from "./components/assignments/AssignmentSystem";

/**
 * Dashboard Overview component showing main teacher dashboard
 * @returns {React.ReactElement} DashboardOverview component
 */

const DashboardContent = () => {
  const [selectedClass, setSelectedClass] = useState("all");

  const classStats = [
    {
      title: "Total Students",
      value: 156,
      change: "+12",
      icon: Users,
      color: "blue",
    },
    {
      title: "Average Grade",
      value: "B+",
      change: "+2.4%",
      icon: Award,
      color: "green",
    },
    {
      title: "Attendance Rate",
      value: "94%",
      change: "+1.2%",
      icon: Clock,
      color: "purple",
    },
    {
      title: "Pending Assessments",
      value: 8,
      change: "-3",
      icon: FileText,
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
    <div className="space-y-6">
      {/* Class Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {classStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <span
                  className={`text-sm font-medium ${
                    stat.change.startsWith("+")
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
      <Card>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Today&apos;s Schedule</span>
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
                      <Book className="h-5 w-5" />
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
              <TrendingUp className="h-5 w-5" />
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
                <FileText className="h-5 w-5" />
                <span>Upcoming Assessments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingAssessments />
            </CardContent>
          </Card>
        </div>

        {/* Notifications content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
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
                    {notification.type === "assignment" ? (
                      <FileText className="h-4 w-4" />
                    ) : notification.type === "meeting" ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
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
  );
};

/**
 * Main TeacherDashboard component with routing
 * @returns {React.ReactElement} TeacherDashboard component
 */
const TeacherDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardContent />} />
        <Route path="assignments/*" element={<AssignmentSystem />} />
        <Route path="classes/*" element={<ClassManagement />} />
      </Routes>
    </div>
  );
};

export default TeacherDashboard;
