// @ts-nocheck

// client/src/components/demo/DemoWrapper.jsx
// STEP 1: Super Simple Debug Version to Isolate the Issue

import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";

console.log("🚀 DemoWrapper component loaded");

const DemoWrapper = () => {
  const { role } = useParams();
  const [debugInfo, setDebugInfo] = useState({
    role: "",
    timestamp: "",
    urlPath: "",
    search: "",
  });

  useEffect(() => {
    console.log("🎯 DemoWrapper useEffect triggered");
    console.log("📝 Role from URL:", role);

    setDebugInfo({
      role: role,
      timestamp: new Date().toISOString(),
      urlPath: window.location.pathname,
      search: window.location.search,
    });
  }, [role]);

  console.log("🔄 DemoWrapper rendering, role:", role);

  // Step 1: Basic validation
  if (!role) {
    console.log("❌ No role found, redirecting to /demo");
    return <Navigate to="/demo" replace />;
  }

  const validRoles = ["admin", "teacher", "student", "parent"];
  if (!validRoles.includes(role)) {
    console.log("❌ Invalid role:", role, "redirecting to /demo");
    return <Navigate to="/demo" replace />;
  }

  console.log("✅ Valid role found:", role);

  // Step 2: Create demo data for each role
  const getDemoContent = () => {
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
        return {
          title: "Unknown Role",
          stats: [],
          recentActivities: [],
        };
    }
  };

  const demoContent = getDemoContent();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      <div className="bg-blue-600 text-white px-4 py-2 text-center">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-white text-blue-600 px-2 py-1 rounded text-sm font-medium">
              DEMO MODE
            </span>
            <span className="text-sm">
              Exploring as: <strong>{role.toUpperCase()}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => (window.location.href = "/demo")}
              className="text-blue-100 hover:text-white text-sm underline"
            >
              Switch Role
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-50"
            >
              Exit Demo
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info Box */}
      <div className="bg-yellow-100 border border-yellow-400 p-4 mx-4 mt-4 rounded">
        <h3 className="font-bold text-yellow-800 mb-2">
          🐛 Debug Information:
        </h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>
            <strong>Role:</strong> {debugInfo.role}
          </p>
          <p>
            <strong>URL Path:</strong> {debugInfo.urlPath}
          </p>
          <p>
            <strong>Timestamp:</strong> {debugInfo.timestamp}
          </p>
          <p>
            <strong>Component Status:</strong> ✅ DemoWrapper is rendering
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {demoContent.title}
          </h1>
          <p className="text-gray-600">
            This is a fully functional demo with realistic sample data.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {demoContent.stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {stat.label}
              </h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activities
            </h2>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              {demoContent.recentActivities.map((activity, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <p className="text-gray-700">{activity}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Role-Specific Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {role === "admin" && (
              <>
                <button className="p-4 text-center bg-blue-50 hover:bg-blue-100 rounded-lg">
                  <div className="text-blue-600 font-medium">Manage Users</div>
                  <div className="text-blue-500 text-sm">View all users</div>
                </button>
                <button className="p-4 text-center bg-green-50 hover:bg-green-100 rounded-lg">
                  <div className="text-green-600 font-medium">View Reports</div>
                  <div className="text-green-500 text-sm">
                    Analytics & insights
                  </div>
                </button>
                <button className="p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-lg">
                  <div className="text-purple-600 font-medium">
                    System Settings
                  </div>
                  <div className="text-purple-500 text-sm">
                    Configure system
                  </div>
                </button>
                <button className="p-4 text-center bg-orange-50 hover:bg-orange-100 rounded-lg">
                  <div className="text-orange-600 font-medium">
                    Announcements
                  </div>
                  <div className="text-orange-500 text-sm">
                    Broadcast messages
                  </div>
                </button>
              </>
            )}

            {role === "teacher" && (
              <>
                <button className="p-4 text-center bg-blue-50 hover:bg-blue-100 rounded-lg">
                  <div className="text-blue-600 font-medium">My Classes</div>
                  <div className="text-blue-500 text-sm">View all classes</div>
                </button>
                <button className="p-4 text-center bg-green-50 hover:bg-green-100 rounded-lg">
                  <div className="text-green-600 font-medium">
                    Grade Assignments
                  </div>
                  <div className="text-green-500 text-sm">Pending: 23</div>
                </button>
                <button className="p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-lg">
                  <div className="text-purple-600 font-medium">Attendance</div>
                  <div className="text-purple-500 text-sm">Mark attendance</div>
                </button>
                <button className="p-4 text-center bg-orange-50 hover:bg-orange-100 rounded-lg">
                  <div className="text-orange-600 font-medium">
                    Create Assignment
                  </div>
                  <div className="text-orange-500 text-sm">New homework</div>
                </button>
              </>
            )}

            {role === "student" && (
              <>
                <button className="p-4 text-center bg-blue-50 hover:bg-blue-100 rounded-lg">
                  <div className="text-blue-600 font-medium">My Grades</div>
                  <div className="text-blue-500 text-sm">Current GPA: 3.7</div>
                </button>
                <button className="p-4 text-center bg-green-50 hover:bg-green-100 rounded-lg">
                  <div className="text-green-600 font-medium">Assignments</div>
                  <div className="text-green-500 text-sm">Due: 3 pending</div>
                </button>
                <button className="p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-lg">
                  <div className="text-purple-600 font-medium">Schedule</div>
                  <div className="text-purple-500 text-sm">Today's classes</div>
                </button>
                <button className="p-4 text-center bg-orange-50 hover:bg-orange-100 rounded-lg">
                  <div className="text-orange-600 font-medium">Library</div>
                  <div className="text-orange-500 text-sm">Borrowed books</div>
                </button>
              </>
            )}

            {role === "parent" && (
              <>
                <button className="p-4 text-center bg-blue-50 hover:bg-blue-100 rounded-lg">
                  <div className="text-blue-600 font-medium">
                    Children Overview
                  </div>
                  <div className="text-blue-500 text-sm">Emma & John</div>
                </button>
                <button className="p-4 text-center bg-green-50 hover:bg-green-100 rounded-lg">
                  <div className="text-green-600 font-medium">
                    Academic Reports
                  </div>
                  <div className="text-green-500 text-sm">
                    Progress tracking
                  </div>
                </button>
                <button className="p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-lg">
                  <div className="text-purple-600 font-medium">Meetings</div>
                  <div className="text-purple-500 text-sm">
                    Schedule parent-teacher
                  </div>
                </button>
                <button className="p-4 text-center bg-orange-50 hover:bg-orange-100 rounded-lg">
                  <div className="text-orange-600 font-medium">Payments</div>
                  <div className="text-orange-500 text-sm">
                    Outstanding: $320
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer with Demo Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            🎭 This is a demo environment with sample data.
            <br />
            All actions are simulated and no real data is affected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoWrapper;
