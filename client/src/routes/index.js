// @ts-nocheck
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useParams, Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../contexts/AuthContext.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

// Auth components - Keep immediate loading for faster login
import Login from "../features/auth/Login.jsx";
import Register from "../features/auth/Register.jsx";
import ForgotPassword from "../features/auth/ForgotPassword.jsx";
import ResetPassword from "../features/auth/ResetPassword.jsx";
import EmailVerification from "../features/auth/EmailVerification.jsx";
import ProfileCompletion from "../features/auth/ProfileCompletion.jsx";

// Performance optimization: Lazy load components
const ConnectionTest = lazy(
  () => import("../components/tests/ConnectionTest.jsx")
);

// Dashboard components - Lazy load for better initial performance
const AdminDashboard = lazy(
  () => import("../features/admin/AdminDashboard.jsx")
);
const TeacherDashboard = lazy(
  () => import("../features/teacher/TeacherDashboard.jsx")
);
const StudentDashboard = lazy(
  () => import("../features/student/StudentDashboard.jsx")
);

// Profile components - NEW: Add the missing profile components
const TeacherProfile = lazy(
  () => import("../features/teacher/TeacherProfile.jsx")
);
const StudentProfile = lazy(
  () => import("../features/student/StudentProfile.jsx")
);

// Parent components - Lazy load with existing index structure
const ParentDashboard = lazy(
  () => import("../features/parent/ParentDashboard.jsx")
);
const ParentProfile = lazy(
  () => import("../features/parent/ParentProfile.jsx")
);
const ChildrenOverview = lazy(
  () => import("../features/parent/ChildrenOverview.jsx")
);

// Other components
const UserProfile = lazy(() => import("../components/users/UserProfile.jsx"));
const LandingPage = lazy(() => import("../features/landing/LandingPage.jsx"));
const Demo = lazy(() => import("../features/public/Demo.jsx"));
const Privacy = lazy(() => import("../features/public/Privacy.jsx"));
const Terms = lazy(() => import("../features/public/Terms.jsx"));
const Contact = lazy(() => import("../features/public/Contact.jsx"));

// Enhanced Loading Component
const SuspenseWrapper = ({ children, fallback = null }) => (
  <Suspense
    fallback={
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )
    }
  >
    {children}
  </Suspense>
);

// User Profile Wrapper - Enhanced with error handling
const UserProfileWrapper = () => {
  const { id } = useParams();
  if (!id) return <Navigate to="/dashboard" replace />;

  return (
    <SuspenseWrapper>
      <UserProfile userId={id} />
    </SuspenseWrapper>
  );
};

// Enhanced Protected Route with better role checking
const ProtectedRoute = ({ isAuthenticated, allowedRoles = [], children }) => {
  const { user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, check user role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Simple Layout - Keep your existing implementation
const SimpleLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
};

// Enhanced Teacher Routes Handler - NEW: Add profile routing
const TeacherRoutesHandler = () => {
  return (
    <SuspenseWrapper>
      <Routes>
        <Route index element={<TeacherDashboard />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="profile" element={<TeacherProfile />} />
        <Route
          path="*"
          element={<Navigate to="/teacher/dashboard" replace />}
        />
      </Routes>
    </SuspenseWrapper>
  );
};

// Enhanced Student Routes Handler - NEW: Add profile routing
const StudentRoutesHandler = () => {
  return (
    <SuspenseWrapper>
      <Routes>
        <Route index element={<StudentDashboard />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route
          path="*"
          element={<Navigate to="/student/dashboard" replace />}
        />
      </Routes>
    </SuspenseWrapper>
  );
};

// Enhanced Parent Routes Handler - Keep your working implementation but add lazy loading
const ParentRoutesHandler = () => {
  return (
    <SuspenseWrapper>
      <Routes>
        <Route index element={<ParentDashboard />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="profile" element={<ParentProfile />} />
        <Route path="children" element={<ChildrenOverview />} />
        <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
      </Routes>
    </SuspenseWrapper>
  );
};

// Enhanced Admin Routes Handler - NEW: Add for consistency
const AdminRoutesHandler = () => {
  return (
    <SuspenseWrapper>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        {/* TODO: Add AdminProfile route when component is created */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </SuspenseWrapper>
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
      {/* Public Routes - Keep your existing structure */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : (
            <SuspenseWrapper>
              <LandingPage />
            </SuspenseWrapper>
          )
        }
      />

      {/* Authentication Routes - Keep immediate loading for performance */}
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

      {/* Email Verification Routes - Keep your existing structure */}
      <Route path="/verify-email/:token" element={<EmailVerification />} />
      <Route path="/complete-profile" element={<ProfileCompletion />} />

      {/* Password Reset Routes - Keep your existing structure */}
      <Route
        path="/forgot-password"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : (
            <ForgotPassword />
          )
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : (
            <ResetPassword />
          )
        }
      />

      {/* Other Public Routes - Add lazy loading */}
      <Route
        path="/demo"
        element={
          <SuspenseWrapper>
            <Demo />
          </SuspenseWrapper>
        }
      />
      <Route
        path="/privacy"
        element={
          <SuspenseWrapper>
            <Privacy />
          </SuspenseWrapper>
        }
      />
      <Route
        path="/terms"
        element={
          <SuspenseWrapper>
            <Terms />
          </SuspenseWrapper>
        }
      />
      <Route
        path="/contact"
        element={
          <SuspenseWrapper>
            <Contact />
          </SuspenseWrapper>
        }
      />

      {/* Public Catch-all Route - Keep your existing */}
      <Route path="/unauthorized" element={<Navigate to="/" replace />} />

      {/* Protected Routes - Enhanced with better role checking */}
      <Route
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SimpleLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin routes - Enhanced with sub-routing */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={["admin"]}
            >
              <AdminRoutesHandler />
            </ProtectedRoute>
          }
        />

        {/* Teacher routes - Enhanced with profile routing */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={["teacher"]}
            >
              <TeacherRoutesHandler />
            </ProtectedRoute>
          }
        />

        {/* Student routes - Enhanced with profile routing */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={["student"]}
            >
              <StudentRoutesHandler />
            </ProtectedRoute>
          }
        />

        {/* Parent routes - Keep your working implementation with enhancements */}
        <Route
          path="/parent/*"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={["parent"]}
            >
              <ParentRoutesHandler />
            </ProtectedRoute>
          }
        />

        {/* Common routes - Add lazy loading */}
        <Route path="/users/:id" element={<UserProfileWrapper />} />

        {/* Protected Routes Catch-all */}
        <Route
          path="/dashboard/*"
          element={<Navigate to={getDashboardRoute()} replace />}
        />
      </Route>

      {/* Test Connection Route - Keep your existing */}
      <Route
        path="/test-connection"
        element={
          <SuspenseWrapper>
            <ConnectionTest />
          </SuspenseWrapper>
        }
      />

      {/* Global Catch-all - Keep your existing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Enhanced PropTypes
ProtectedRoute.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
};

SuspenseWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

export default AppRoutes;

// Navigation utilities - Fixed TypeScript issues
export const NavigationUtils = {
  getDashboardRoute: (userRole) => {
    switch (userRole) {
      case "admin":
        return "/admin/dashboard";
      case "teacher":
        return "/teacher/dashboard";
      case "student":
        return "/student/dashboard";
      case "parent":
        return "/parent/dashboard";
      default:
        return "/";
    }
  },

  getProfileRoute: (userRole) => {
    switch (userRole) {
      case "teacher":
        return "/teacher/profile";
      case "student":
        return "/student/profile";
      case "parent":
        return "/parent/profile";
      default:
        return "/";
    }
  },

  canAccessRoute: (userRole, routePath) => {
    switch (userRole) {
      case "admin":
        return routePath.startsWith("/admin");
      case "teacher":
        return routePath.startsWith("/teacher");
      case "student":
        return routePath.startsWith("/student");
      case "parent":
        return routePath.startsWith("/parent");
      default:
        return false;
    }
  },
};

// Enhanced navigation hook - Fixed TypeScript issues
export const useNavigation = () => {
  const { user } = useAuth();

  const getRouteFor = (page) => {
    const userRole = user?.role;

    if (!userRole) return "/";

    // Handle dashboard routes
    if (page === "dashboard") {
      return NavigationUtils.getDashboardRoute(userRole);
    }

    // Handle profile routes
    if (page === "profile") {
      return NavigationUtils.getProfileRoute(userRole);
    }

    // Handle parent-specific routes
    if (page === "children" && userRole === "parent") {
      return "/parent/children";
    }

    return "/";
  };

  return { getRouteFor };
};
