// @ts-nocheck
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useParams, Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useDemo } from "../contexts/DemoContext.jsx";
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

// Profile components
const TeacherProfile = lazy(
  () => import("../features/teacher/TeacherProfile.jsx")
);
const StudentProfile = lazy(
  () => import("../features/student/StudentProfile.jsx")
);

// Parent components
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
const PageRoleSelector = lazy(
  () => import("../components/demo/PageRoleSelector.jsx")
);
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

// Demo-aware route handlers that work with existing structure
const DemoAwareRouteHandler = ({ children, fallbackRole }) => {
  const { isDemoMode, demoUser } = useDemo();
  const { user } = useAuth();

  // Use demo user when in demo mode, otherwise use real user
  const effectiveUser = isDemoMode ? demoUser : user;

  if (!effectiveUser && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }

  if (!effectiveUser && isDemoMode) {
    return <Navigate to="/demo" replace />;
  }

  return <>{children}</>;
};

// Enhanced Teacher Routes Handler - With demo awareness
const TeacherRoutesHandler = () => {
  return (
    <DemoAwareRouteHandler fallbackRole="teacher">
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
    </DemoAwareRouteHandler>
  );
};

// Enhanced Student Routes Handler - With demo awareness
const StudentRoutesHandler = () => {
  return (
    <DemoAwareRouteHandler fallbackRole="student">
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
    </DemoAwareRouteHandler>
  );
};

// Enhanced Parent Routes Handler - With demo awareness
const ParentRoutesHandler = () => {
  return (
    <DemoAwareRouteHandler fallbackRole="parent">
      <SuspenseWrapper>
        <Routes>
          <Route index element={<ParentDashboard />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="profile" element={<ParentProfile />} />
          <Route path="children" element={<ChildrenOverview />} />
          <Route
            path="*"
            element={<Navigate to="/parent/dashboard" replace />}
          />
        </Routes>
      </SuspenseWrapper>
    </DemoAwareRouteHandler>
  );
};

// Enhanced Admin Routes Handler - With demo awareness
const AdminRoutesHandler = () => {
  return (
    <DemoAwareRouteHandler fallbackRole="admin">
      <SuspenseWrapper>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route
            path="*"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Routes>
      </SuspenseWrapper>
    </DemoAwareRouteHandler>
  );
};

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();
  const { isDemoMode, demoUser } = useDemo();

  // Use demo user when in demo mode for routing decisions
  const effectiveUser = isDemoMode ? demoUser : user;
  const userRole = effectiveUser?.role || "";

  const getDashboardRoute = () => {
    return `/${userRole}/dashboard`;
  };

  return (
    <Routes>
      {/* Public Routes - Handle demo mode redirect */}
      <Route
        path="/"
        element={
          isAuthenticated || isDemoMode ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : (
            <SuspenseWrapper>
              <LandingPage />
            </SuspenseWrapper>
          )
        }
      />

      {/* Authentication Routes - Handle demo mode */}
      <Route
        path="/login"
        element={
          isAuthenticated || isDemoMode ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated || isDemoMode ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : (
            <Register />
          )
        }
      />

      {/* Demo Routes - New demo functionality */}
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
                <PageRoleSelector />
              </div>
            </div>
          </SuspenseWrapper>
        }
      />

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
          isAuthenticated || isDemoMode ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : (
            <ForgotPassword />
          )
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          isAuthenticated || isDemoMode ? (
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

      {/* Protected Routes - Enhanced with demo awareness */}
      <Route
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated || isDemoMode}>
            <SimpleLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin routes - Enhanced with demo support */}
        <Route
          path="/admin/*"
          element={
            isDemoMode ? (
              <AdminRoutesHandler />
            ) : (
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                allowedRoles={["admin"]}
              >
                <AdminRoutesHandler />
              </ProtectedRoute>
            )
          }
        />

        {/* Teacher routes - Enhanced with demo support */}
        <Route
          path="/teacher/*"
          element={
            isDemoMode ? (
              <TeacherRoutesHandler />
            ) : (
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                allowedRoles={["teacher"]}
              >
                <TeacherRoutesHandler />
              </ProtectedRoute>
            )
          }
        />

        {/* Student routes - Enhanced with demo support */}
        <Route
          path="/student/*"
          element={
            isDemoMode ? (
              <StudentRoutesHandler />
            ) : (
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                allowedRoles={["student"]}
              >
                <StudentRoutesHandler />
              </ProtectedRoute>
            )
          }
        />

        {/* Parent routes - Enhanced with demo support */}
        <Route
          path="/parent/*"
          element={
            isDemoMode ? (
              <ParentRoutesHandler />
            ) : (
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                allowedRoles={["parent"]}
              >
                <ParentRoutesHandler />
              </ProtectedRoute>
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

DemoAwareRouteHandler.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackRole: PropTypes.string,
};

export default AppRoutes;

// Navigation utilities - Enhanced with demo support
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

  getDemoRoute: (userRole) => {
    return `/demo/${userRole}`;
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

// Enhanced navigation hook - With demo support
export const useNavigation = () => {
  const { user } = useAuth();
  const { isDemoMode, demoUser } = useDemo();

  const effectiveUser = isDemoMode ? demoUser : user;

  const getRouteFor = (page) => {
    const userRole = effectiveUser?.role;

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

    // Handle demo routes
    if (page === "demo") {
      return NavigationUtils.getDemoRoute(userRole);
    }

    return "/";
  };

  return {
    getRouteFor,
    isDemoMode,
    effectiveUser,
  };
};
