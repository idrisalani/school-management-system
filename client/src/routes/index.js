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

// Demo components - Lazy loaded
const RoleSelector = lazy(() => import("../components/demo/RoleSelector.jsx"));
const DemoWrapper = lazy(() => import("../components/demo/DemoWrapper.jsx"));

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

// Enhanced Teacher Routes Handler
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

// Enhanced Student Routes Handler
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

// Enhanced Parent Routes Handler
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

// Enhanced Admin Routes Handler
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

  const getDashboardRoute = () => {
    const userRole = user?.role || "";
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
            <SuspenseWrapper>
              <LandingPage />
            </SuspenseWrapper>
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

      {/* DEMO ROUTES - Simplified without context */}
      <Route
        path="/demo"
        element={
          <SuspenseWrapper>
            <div className="min-h-screen bg-gray-50 py-12">
              <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Experience EduManager
                  </h1>
                  <p className="text-lg text-gray-600">
                    Choose a role to explore our School Management System with
                    realistic demo data
                  </p>
                </div>
                <RoleSelector />
              </div>
            </div>
          </SuspenseWrapper>
        }
      />

      {/* DEMO ROLE ROUTES - This is the key route that was missing */}
      <Route
        path="/demo/:role"
        element={
          <SuspenseWrapper>
            <DemoWrapper />
          </SuspenseWrapper>
        }
      />

      {/* Email Verification Routes */}
      <Route path="/verify-email/:token" element={<EmailVerification />} />
      <Route path="/complete-profile" element={<ProfileCompletion />} />

      {/* Password Reset Routes */}
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

      {/* Other Public Routes */}
      <Route
        path="/demo-old"
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

      {/* Public Catch-all Route */}
      <Route path="/unauthorized" element={<Navigate to="/" replace />} />

      {/* Protected Routes */}
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
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={["admin"]}
            >
              <AdminRoutesHandler />
            </ProtectedRoute>
          }
        />

        {/* Teacher routes */}
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

        {/* Student routes */}
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

        {/* Parent routes */}
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

        {/* Common routes */}
        <Route path="/users/:id" element={<UserProfileWrapper />} />

        {/* Protected Routes Catch-all */}
        <Route
          path="/dashboard/*"
          element={<Navigate to={getDashboardRoute()} replace />}
        />
      </Route>

      {/* Test Connection Route */}
      <Route
        path="/test-connection"
        element={
          <SuspenseWrapper>
            <ConnectionTest />
          </SuspenseWrapper>
        }
      />

      {/* Global Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// PropTypes
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

// Navigation utilities - Simplified
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
};

// Simplified navigation hook
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

  return {
    getRouteFor,
    effectiveUser: user,
  };
};
