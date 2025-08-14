// @ts-nocheck

// client/src/features/student/StudentDashboard.jsx
import React from "react";
import {
  Clock,
  Calendar,
  Award,
  Bell,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import UpcomingAssignments from "./components/UpcomingAssignments";
import AttendanceOverview from "./components/AttendanceOverview";
import GradesChart from "./components/GradesChart";
import TimeTable from "./components/TimeTable";

const StudentDashboard = () => {
  const quickStats = [
    {
      title: "Attendance",
      value: "92%",
      icon: Clock,
      trend: "up",
      trendValue: "+2.5%",
      color: "blue",
    },
    {
      title: "Average Grade",
      value: "A-",
      icon: Award,
      trend: "up",
      trendValue: "+3.2%",
      color: "green",
    },
    {
      title: "Assignments",
      value: "8/10",
      icon: FileText,
      trend: "down",
      trendValue: "-1",
      color: "orange",
    },
    {
      title: "Activities",
      value: "5",
      icon: Calendar,
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
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grades Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
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
              <Clock className="h-5 w-5" />
              <span>Attendance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceOverview />
          </CardContent>
        </Card>
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Assignments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
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
                <Bell className="h-5 w-5" />
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
                  {notification.priority === "high" ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Bell className="h-5 w-5 text-gray-500" />
                  )}
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
            <Calendar className="h-5 w-5" />
            <span>Today's Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
