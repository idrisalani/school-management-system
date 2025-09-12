// @ts-nocheck

// client/src/components/demo/DemoWrapper.jsx
import React, { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useDemo } from "../../contexts/DemoContext";
import { useAuth } from "../../contexts/AuthContext";
import { DemoModeIndicator } from "./DemoModeIndicator";

// Import your existing dashboard components
import StudentDashboard from "../../features/student/StudentDashboard";
import TeacherDashboard from "../../features/teacher/TeacherDashboard";
import AdminDashboard from "../../features/admin/AdminDashboard";

// You'll need to create a ParentDashboard component
const ParentDashboard = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Parent Dashboard</h2>
    <p>Parent dashboard content here...</p>
  </div>
);

export const DemoWrapper = () => {
  const { role } = useParams();
  const { isDemoMode, demoUser, enterDemoMode } = useDemo();
  const { setUser } = useAuth(); // Removed unused 'user' variable

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
