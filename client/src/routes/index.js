// @ts-check
import React from "react";
import { Routes, Route, Navigate, useParams, Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../contexts/AuthContext.jsx";
import ConnectionTest from "../components/tests/ConnectionTest.jsx";

// Import feature components
import Login from "../features/auth/Login.jsx";
import Register from "../features/auth/Register.jsx";
import AdminDashboard from "../features/admin/AdminDashboard.jsx";
import TeacherDashboard from "../features/teacher/TeacherDashboard.jsx";
import StudentDashboard from "../features/student/StudentDashboard.jsx";

// Import parent components - UPDATED TO USE INDEX EXPORTS
import {
  ParentDashboard,
  ParentProfile,
  ChildrenOverview,
} from "../features/parent/index.js";

import UserProfile from "../components/users/UserProfile.jsx";
import LandingPage from "../features/landing/LandingPage.jsx";

// Import other public pages
import Demo from "../features/public/Demo.jsx";
import Privacy from "../features/public/Privacy.jsx";
import Terms from "../features/public/Terms.jsx";
import Contact from "../features/public/Contact.jsx";

const UserProfileWrapper = () => {
  const { id } = useParams();
  if (!id) return <Navigate to="/dashboard" replace />;
  return <UserProfile userId={id} />;
};

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Simple Layout Replacement - bypasses MainLayout
const SimpleLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
};

// Parent Routes Handler - NEW COMPONENT
const ParentRoutesHandler = () => {
  return (
    <Routes>
      <Route index element={<ParentDashboard />} />
      <Route path="dashboard" element={<ParentDashboard />} />
      <Route path="profile" element={<ParentProfile />} />
      <Route path="children" element={<ChildrenOverview />} />
      <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
    </Routes>
  );
};

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();
  const userRole = user?.role || "";

  const getDashboardRoute = () => {
    return `/${userRole}/dashboard`;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : (
            <LandingPage />
          )
        }
      />

      {/* Authentication Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : (
            <Register />
          )
        }
      />

      {/* Other Public Routes */}
      <Route path="/demo" element={<Demo />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />

      {/* Public Catch-all Route - Redirects to landing page */}
      <Route path="/unauthorized" element={<Navigate to="/" replace />} />

      {/* Protected Routes - MODIFIED TO BYPASS MainLayout */}
      <Route
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SimpleLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            userRole === "admin" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />

        {/* Teacher routes */}
        <Route
          path="/teacher/*"
          element={
            userRole === "teacher" ? (
              <TeacherDashboard />
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />

        {/* Student routes */}
        <Route
          path="/student/*"
          element={
            userRole === "student" ? (
              <StudentDashboard />
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />

        {/* Parent routes - UPDATED WITH SUB-ROUTING */}
        <Route
          path="/parent/*"
          element={
            userRole === "parent" ? (
              <ParentRoutesHandler />
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />

        {/* Common routes */}
        <Route path="/users/:id" element={<UserProfileWrapper />} />

        {/* Protected Routes Catch-all */}
        <Route
          path="/dashboard/*"
          element={<Navigate to={getDashboardRoute()} replace />}
        />
      </Route>

      {/* Global Catch-all - Redirects to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/test-connection" element={<ConnectionTest />} />
    </Routes>
  );
};

ProtectedRoute.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default AppRoutes;
