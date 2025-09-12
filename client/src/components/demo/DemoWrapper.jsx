// @ts-nocheck

// client/src/components/demo/DemoWrapper.jsx
import React, { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useDemo } from "../../contexts/DemoContext";
import { useAuth } from "../../contexts/AuthContext";

console.log("🚀 DemoWrapper component loaded");

export const DemoWrapper = () => {
  const { role } = useParams();
  const { isDemoMode, demoUser, enterDemoMode } = useDemo();
  const { setUser } = useAuth();

  console.log("🎯 DemoWrapper rendering with:", {
    role,
    isDemoMode,
    demoUser: !!demoUser,
  });

  // Set demo user as authenticated user for the session
  useEffect(() => {
    console.log("🔄 useEffect 1:", { role, isDemoMode });
    if (role && !isDemoMode) {
      console.log("🚀 Entering demo mode for role:", role);
      enterDemoMode(role);
    }
  }, [role, isDemoMode, enterDemoMode]);

  useEffect(() => {
    console.log("🔄 useEffect 2:", { demoUser: !!demoUser, isDemoMode });
    if (demoUser && isDemoMode) {
      console.log("👤 Setting demo user as authenticated user");
      setUser(demoUser);
    }
  }, [demoUser, isDemoMode, setUser]);

  console.log("🎲 Current state:", {
    role,
    isDemoMode,
    hasDemoUser: !!demoUser,
  });

  if (!role || !["admin", "teacher", "student", "parent"].includes(role)) {
    console.log("❌ Invalid role, redirecting to home");
    return <Navigate to="/" replace />;
  }

  if (!isDemoMode || !demoUser) {
    console.log("⏳ Loading demo environment...", {
      isDemoMode,
      hasDemoUser: !!demoUser,
    });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">
          Loading demo environment for {role}...
        </div>
      </div>
    );
  }

  console.log("✅ Rendering dashboard for role:", role);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Debug Info */}
      <div className="bg-yellow-100 border border-yellow-400 p-4 rounded mb-6">
        <h2 className="font-bold text-lg">DEBUG INFO:</h2>
        <p>Role: {role}</p>
        <p>Demo Mode: {isDemoMode ? "YES" : "NO"}</p>
        <p>
          Demo User:{" "}
          {demoUser
            ? `${demoUser.first_name} ${demoUser.last_name} (${demoUser.role})`
            : "NONE"}
        </p>
        <p>URL: {window.location.pathname}</p>
      </div>

      {/* Demo Mode Indicator */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 text-blue-400">ℹ️</div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Demo Mode Active:</span> You are
                viewing the {role} dashboard with sample data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Role-Specific Content */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        {role === "admin" && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Admin Dashboard
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Total Students</h3>
                <p className="text-3xl font-bold">2,847</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Total Teachers</h3>
                <p className="text-3xl font-bold">156</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Attendance Rate</h3>
                <p className="text-3xl font-bold">92.8%</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Revenue</h3>
                <p className="text-3xl font-bold">$485K</p>
              </div>
            </div>
          </div>
        )}

        {role === "teacher" && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Teacher Dashboard
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">My Students</h3>
                <p className="text-3xl font-bold">89</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Pending Grades</h3>
                <p className="text-3xl font-bold">12</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Average Grade</h3>
                <p className="text-3xl font-bold">B+</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-2xl font-bold mb-4">My Classes</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Mathematics 10A</span>
                  <span className="text-sm text-gray-600">28 students</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Algebra II</span>
                  <span className="text-sm text-gray-600">32 students</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {role === "student" && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Student Dashboard
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Current GPA</h3>
                <p className="text-3xl font-bold">3.7</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Attendance</h3>
                <p className="text-3xl font-bold">96%</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Assignments Due</h3>
                <p className="text-3xl font-bold">3</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-2xl font-bold mb-4">Recent Grades</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Mathematics Quiz</span>
                  <span className="font-bold text-green-600">A-</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">English Essay</span>
                  <span className="font-bold text-blue-600">B+</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {role === "parent" && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Parent Dashboard
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-pink-100 to-pink-200 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Emma Smith - Grade 9</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>GPA:</span>
                    <span className="font-bold text-green-600">3.8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attendance:</span>
                    <span className="font-bold text-blue-600">95%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Liam Smith - Grade 7</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>GPA:</span>
                    <span className="font-bold text-green-600">3.6</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attendance:</span>
                    <span className="font-bold text-blue-600">93%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exit Demo Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
};
