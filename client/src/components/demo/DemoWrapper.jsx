// @ts-nocheck

// client/src/components/demo/DemoWrapper.jsx
import React, { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useDemo } from "../../contexts/DemoContext";
import { useAuth } from "../../contexts/AuthContext";

// Demo Mode Indicator Component
const DemoModeIndicator = () => {
  const { isDemoMode, exitDemoMode, resetDemoData, getDemoMessage } = useDemo();

  if (!isDemoMode) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-5 w-5 text-blue-400">ℹ️</div>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Demo Mode:</span> {getDemoMessage()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetDemoData}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Reset Demo
          </button>
          <button
            onClick={exitDemoMode}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Exit Demo
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple Dashboard Components (you can replace these with your actual dashboards)
const AdminDashboard = () => (
  <div className="p-6">
    <h2 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Total Students</h3>
        <p className="text-3xl font-bold text-blue-600">2,847</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Total Teachers</h3>
        <p className="text-3xl font-bold text-green-600">156</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Attendance Rate</h3>
        <p className="text-3xl font-bold text-purple-600">92.8%</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Monthly Revenue</h3>
        <p className="text-3xl font-bold text-orange-600">$485,200</p>
      </div>
    </div>

    <div className="mt-8 bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Recent Activities</h3>
      <div className="space-y-3">
        <div className="flex items-center p-3 bg-gray-50 rounded">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
          <span>New teacher Sarah Johnson registered</span>
        </div>
        <div className="flex items-center p-3 bg-gray-50 rounded">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
          <span>Grade 10A attendance report generated</span>
        </div>
        <div className="flex items-center p-3 bg-gray-50 rounded">
          <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
          <span>Monthly financial report completed</span>
        </div>
      </div>
    </div>
  </div>
);

const TeacherDashboard = () => (
  <div className="p-6">
    <h2 className="text-3xl font-bold text-gray-900 mb-6">Teacher Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">My Students</h3>
        <p className="text-3xl font-bold text-blue-600">89</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Pending Assignments</h3>
        <p className="text-3xl font-bold text-orange-600">12</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Average Grade</h3>
        <p className="text-3xl font-bold text-green-600">B+</p>
      </div>
    </div>

    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">My Classes</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">Mathematics 10A</span>
            <span className="text-sm text-gray-600">28 students</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">Algebra II</span>
            <span className="text-sm text-gray-600">32 students</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">Geometry</span>
            <span className="text-sm text-gray-600">29 students</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Recent Assignments</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">Quadratic Equations</span>
            <span className="text-sm text-blue-600">Due Tomorrow</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">Linear Functions Quiz</span>
            <span className="text-sm text-green-600">Completed</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">Geometry Proofs</span>
            <span className="text-sm text-orange-600">In Progress</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StudentDashboard = () => (
  <div className="p-6">
    <h2 className="text-3xl font-bold text-gray-900 mb-6">Student Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Attendance Rate</h3>
        <p className="text-3xl font-bold text-green-600">96%</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Current GPA</h3>
        <p className="text-3xl font-bold text-blue-600">3.7</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Assignments Due</h3>
        <p className="text-3xl font-bold text-orange-600">3</p>
      </div>
    </div>

    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">My Courses</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">Mathematics</span>
            <span className="text-sm font-semibold text-green-600">A-</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">English Literature</span>
            <span className="text-sm font-semibold text-blue-600">B+</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">Science</span>
            <span className="text-sm font-semibold text-green-600">A</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">History</span>
            <span className="text-sm font-semibold text-blue-600">B</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Upcoming Assignments</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-red-50 rounded">
            <span className="font-medium">Math Homework #15</span>
            <span className="text-sm text-red-600">Due Tomorrow</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
            <span className="font-medium">History Essay</span>
            <span className="text-sm text-yellow-600">Due Friday</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
            <span className="font-medium">Science Lab Report</span>
            <span className="text-sm text-blue-600">Due Next Week</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ParentDashboard = () => (
  <div className="p-6">
    <h2 className="text-3xl font-bold text-gray-900 mb-6">Parent Dashboard</h2>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Emma Smith - Grade 9</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Overall GPA:</span>
            <span className="font-semibold text-green-600">3.8</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Attendance Rate:</span>
            <span className="font-semibold text-blue-600">95%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Assignments Due:</span>
            <span className="font-semibold text-orange-600">2</span>
          </div>
        </div>

        <h4 className="font-semibold mt-4 mb-2">Recent Grades:</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Mathematics Quiz</span>
            <span className="font-medium">A-</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>English Essay</span>
            <span className="font-medium">B+</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Science Lab</span>
            <span className="font-medium">A</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Liam Smith - Grade 7</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Overall GPA:</span>
            <span className="font-semibold text-green-600">3.6</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Attendance Rate:</span>
            <span className="font-semibold text-blue-600">93%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Assignments Due:</span>
            <span className="font-semibold text-orange-600">1</span>
          </div>
        </div>

        <h4 className="font-semibold mt-4 mb-2">Recent Grades:</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>History Project</span>
            <span className="font-medium">A</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Math Test</span>
            <span className="font-medium">B</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Reading Assignment</span>
            <span className="font-medium">B+</span>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-6 bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Upcoming Events</h3>
      <div className="space-y-3">
        <div className="flex items-center p-3 bg-blue-50 rounded">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
          <span>Parent-Teacher Conference - Emma (Tomorrow 3:00 PM)</span>
        </div>
        <div className="flex items-center p-3 bg-green-50 rounded">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
          <span>Science Fair - Liam (Friday 6:00 PM)</span>
        </div>
        <div className="flex items-center p-3 bg-purple-50 rounded">
          <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
          <span>School Holiday - MLK Day (Next Monday)</span>
        </div>
      </div>
    </div>
  </div>
);

export const DemoWrapper = () => {
  const { role } = useParams();
  const { isDemoMode, demoUser, enterDemoMode } = useDemo();
  const { setUser } = useAuth();

  // Set demo user as authenticated user for the session
  useEffect(() => {
    if (role && !isDemoMode) {
      enterDemoMode(role);
    }
  }, [role, isDemoMode, enterDemoMode]);

  useEffect(() => {
    if (demoUser && isDemoMode) {
      // Temporarily set demo user as authenticated user
      setUser(demoUser);
    }
  }, [demoUser, isDemoMode, setUser]);

  if (!role || !["admin", "teacher", "student", "parent"].includes(role)) {
    return <Navigate to="/" replace />;
  }

  if (!isDemoMode || !demoUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading demo environment...</div>
      </div>
    );
  }

  const getDashboardComponent = () => {
    switch (role) {
      case "admin":
        return <AdminDashboard />;
      case "teacher":
        return <TeacherDashboard />;
      case "student":
        return <StudentDashboard />;
      case "parent":
        return <ParentDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoModeIndicator />
      {getDashboardComponent()}
    </div>
  );
};
