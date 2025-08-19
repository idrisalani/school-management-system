//@ts-nocheck

// client/src/features/parent/ChildrenOverview.jsx
import React, { useState, useEffect } from "react";
import {
  Users,
  User,
  GraduationCap,
  Calendar,
  TrendingUp,
  BookOpen,
  Trophy,
  Clock,
  AlertCircle,
  CheckCircle,
  Mail,
  Search,
  ArrowLeft,
} from "lucide-react";

const ChildrenOverview = ({ onBack = null }) => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Simulate loading children data
    // In a real app, this would be an API call
    setTimeout(() => {
      const mockChildren = [
        {
          id: 1,
          firstName: "Sarah",
          lastName: "Johnson",
          grade: "Grade 10",
          class: "10-A",
          age: 15,
          studentId: "STU001",
          avatar: null,
          status: "active",
          attendance: {
            rate: 96,
            present: 92,
            absent: 4,
            late: 2,
          },
          grades: {
            overall: "A-",
            gpa: 3.7,
            subjects: [
              { name: "Mathematics", grade: "A", score: 95 },
              { name: "English", grade: "A-", score: 88 },
              { name: "Science", grade: "B+", score: 87 },
              { name: "History", grade: "A", score: 92 },
              { name: "Art", grade: "A-", score: 90 },
            ],
          },
          recentActivity: [
            {
              type: "grade",
              message: "Received A on Mathematics Quiz",
              date: "2 hours ago",
            },
            {
              type: "attendance",
              message: "Present for all classes today",
              date: "5 hours ago",
            },
            {
              type: "assignment",
              message: "Submitted English Essay",
              date: "1 day ago",
            },
          ],
          upcomingEvents: [
            { title: "Math Test", date: "Tomorrow", type: "exam" },
            {
              title: "Science Fair Project Due",
              date: "Friday",
              type: "assignment",
            },
          ],
        },
        {
          id: 2,
          firstName: "Michael",
          lastName: "Johnson",
          grade: "Grade 8",
          class: "8-B",
          age: 13,
          studentId: "STU002",
          avatar: null,
          status: "active",
          attendance: {
            rate: 94,
            present: 89,
            absent: 5,
            late: 1,
          },
          grades: {
            overall: "B+",
            gpa: 3.3,
            subjects: [
              { name: "Mathematics", grade: "B+", score: 85 },
              { name: "English", grade: "B", score: 82 },
              { name: "Science", grade: "A-", score: 88 },
              { name: "History", grade: "B", score: 81 },
              { name: "PE", grade: "A", score: 95 },
            ],
          },
          recentActivity: [
            {
              type: "grade",
              message: "Received B+ on Science Lab Report",
              date: "1 day ago",
            },
            {
              type: "attendance",
              message: "Present for all classes",
              date: "1 day ago",
            },
            {
              type: "assignment",
              message: "New History assignment posted",
              date: "2 days ago",
            },
          ],
          upcomingEvents: [
            { title: "PE Sports Day", date: "Next Week", type: "event" },
            {
              title: "History Presentation",
              date: "Monday",
              type: "assignment",
            },
          ],
        },
      ];
      setChildren(mockChildren);
      setSelectedChild(mockChildren[0]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredChildren = children.filter(
    (child) =>
      `${child.firstName} ${child.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      child.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading children overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Children Overview
                </h1>
                <p className="text-sm text-gray-600">
                  Monitor your children's academic progress
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search children..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Children List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  My Children
                </h3>
                <p className="text-sm text-gray-600">
                  {children.length} students
                </p>
              </div>
              <div className="divide-y">
                {filteredChildren.map((child) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    isSelected={selectedChild?.id === child.id}
                    onClick={() => setSelectedChild(child)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Child Details */}
          <div className="lg:col-span-3">
            {selectedChild && (
              <div className="space-y-6">
                {/* Child Header */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedChild.firstName} {selectedChild.lastName}
                        </h2>
                        <p className="text-gray-600">
                          {selectedChild.grade} • {selectedChild.class}
                        </p>
                        <p className="text-sm text-gray-500">
                          Student ID: {selectedChild.studentId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <QuickStat
                    title="Overall Grade"
                    value={selectedChild.grades.overall}
                    icon={Trophy}
                    color="blue"
                  />
                  <QuickStat
                    title="GPA"
                    value={selectedChild.grades.gpa}
                    icon={TrendingUp}
                    color="green"
                  />
                  <QuickStat
                    title="Attendance"
                    value={`${selectedChild.attendance.rate}%`}
                    icon={Calendar}
                    color="purple"
                  />
                  <QuickStat
                    title="Subjects"
                    value={selectedChild.grades.subjects.length}
                    icon={BookOpen}
                    color="orange"
                  />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="border-b">
                    <nav className="flex">
                      {[
                        { id: "overview", label: "Overview" },
                        { id: "grades", label: "Grades" },
                        { id: "attendance", label: "Attendance" },
                        { id: "activity", label: "Recent Activity" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-6 py-3 text-sm font-medium border-b-2 ${
                            activeTab === tab.id
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {activeTab === "overview" && (
                      <OverviewTab child={selectedChild} />
                    )}
                    {activeTab === "grades" && (
                      <GradesTab subjects={selectedChild.grades.subjects} />
                    )}
                    {activeTab === "attendance" && (
                      <AttendanceTab attendance={selectedChild.attendance} />
                    )}
                    {activeTab === "activity" && (
                      <ActivityTab activities={selectedChild.recentActivity} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper Components
const ChildCard = ({ child, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
      isSelected ? "bg-blue-50 border-r-2 border-blue-500" : ""
    }`}
  >
    <div className="flex items-center">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
        <User className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">
          {child.firstName} {child.lastName}
        </p>
        <p className="text-sm text-gray-600">{child.grade}</p>
      </div>
    </div>
  </div>
);

const QuickStat = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const OverviewTab = ({ child }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div>
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        Upcoming Events
      </h4>
      <div className="space-y-3">
        {child.upcomingEvents.map((event, index) => (
          <div
            key={index}
            className="flex items-center p-3 bg-gray-50 rounded-lg"
          >
            <Clock className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">{event.title}</p>
              <p className="text-sm text-gray-600">{event.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div>
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        Contact Information
      </h4>
      <div className="space-y-3">
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-gray-400 mr-3" />
          <span className="text-gray-600">
            {child.firstName.toLowerCase()}.{child.lastName.toLowerCase()}
            @school.edu
          </span>
        </div>
        <div className="flex items-center">
          <GraduationCap className="h-5 w-5 text-gray-400 mr-3" />
          <span className="text-gray-600">Class {child.class}</span>
        </div>
      </div>
    </div>
  </div>
);

const GradesTab = ({ subjects }) => (
  <div className="space-y-4">
    {subjects.map((subject, index) => (
      <div
        key={index}
        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
      >
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
          <span className="font-medium text-gray-900">{subject.name}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{subject.score}%</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              subject.grade.startsWith("A")
                ? "bg-green-100 text-green-800"
                : subject.grade.startsWith("B")
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {subject.grade}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const AttendanceTab = ({ attendance }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-green-900">
          {attendance.present}
        </p>
        <p className="text-sm text-green-700">Present Days</p>
      </div>
      <div className="text-center p-4 bg-red-50 rounded-lg">
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-red-900">{attendance.absent}</p>
        <p className="text-sm text-red-700">Absent Days</p>
      </div>
      <div className="text-center p-4 bg-yellow-50 rounded-lg">
        <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-yellow-900">{attendance.late}</p>
        <p className="text-sm text-yellow-700">Late Arrivals</p>
      </div>
    </div>
    <div className="text-center">
      <p className="text-3xl font-bold text-gray-900">{attendance.rate}%</p>
      <p className="text-gray-600">Overall Attendance Rate</p>
    </div>
  </div>
);

const ActivityTab = ({ activities }) => (
  <div className="space-y-4">
    {activities.map((activity, index) => (
      <div
        key={index}
        className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
      >
        <div className="bg-blue-100 p-2 rounded-lg">
          {activity.type === "grade" && (
            <Trophy className="h-4 w-4 text-blue-600" />
          )}
          {activity.type === "attendance" && (
            <Calendar className="h-4 w-4 text-blue-600" />
          )}
          {activity.type === "assignment" && (
            <BookOpen className="h-4 w-4 text-blue-600" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-900">{activity.message}</p>
          <p className="text-xs text-gray-500">{activity.date}</p>
        </div>
      </div>
    ))}
  </div>
);

export default ChildrenOverview;
