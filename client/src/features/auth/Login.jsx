// @ts-nocheck

import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useAuth } from "../../contexts/AuthContext.jsx"; // ADD THIS IMPORT

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // USE AuthContext instead of local state for auth
  const {
    login: authLogin,
    isAuthenticated,
    user,
    isLoading: authLoading,
    error: authError,
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email"); // "email" or "username"
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // REDIRECT FUNCTION - Defined before useEffect to avoid "use-before-define" error
  const redirectToDashboard = useCallback(
    (userRole) => {
      console.log("🎯 Redirecting to dashboard for role:", userRole);

      switch (userRole) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "teacher":
          navigate("/teacher/dashboard", { replace: true });
          break;
        case "student":
          navigate("/student/dashboard", { replace: true });
          break;
        case "parent":
          navigate("/parent/dashboard", { replace: true });
          break;
        default:
          navigate("/dashboard", { replace: true });
      }
    },
    [navigate]
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("🔄 User already authenticated, redirecting to:", user.role);
      redirectToDashboard(user.role);
    }
  }, [isAuthenticated, user, redirectToDashboard]);

  // Handle success message from registration redirect
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state?.email) {
        setFormData((prev) => ({ ...prev, email: location.state.email }));
        setLoginMethod("email");
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Test API connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("🔍 Testing backend connection...");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/v1/health`
        );
        const data = await response.json();

        if (response.ok && data.status === "success") {
          setConnectionStatus("connected");
          console.log("✅ Backend connection verified:", data);
        } else {
          setConnectionStatus("failed");
          console.error("❌ Backend health check failed:", data);
        }
      } catch (error) {
        setConnectionStatus("failed");
        console.error("❌ Backend connection failed:", error.message);
      }
    };

    checkConnection();
  }, []);

  // Load remembered credentials
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const rememberedUsername = localStorage.getItem("rememberedUsername");

    if (rememberedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
      setLoginMethod("email");
    } else if (rememberedUsername) {
      setFormData((prev) => ({
        ...prev,
        username: rememberedUsername,
        rememberMe: true,
      }));
      setLoginMethod("username");
    }
  }, []);

  /**
   * Handle going back to previous page or landing page
   */
  const handleGoBack = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      navigate(-1); // Go back to previous page
    } else {
      // If no history, go to landing page
      navigate("/");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear errors when user starts typing
    if (error || authError) {
      setError("");
    }
  };

  // UPDATED SUBMIT HANDLER TO USE AuthContext
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      // Test connection first if not already connected
      if (connectionStatus !== "connected") {
        console.log("🔍 Testing connection before login...");
        const healthResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/api/v1/health`
        );
        if (!healthResponse.ok) {
          throw new Error("Server is not responding");
        }
      }

      // Prepare login credentials for AuthContext
      const credentials = {
        password: formData.password,
      };

      // Add email or username based on login method
      if (loginMethod === "email") {
        if (!formData.email.trim()) {
          throw new Error("Email is required");
        }
        credentials.email = formData.email.toLowerCase().trim();
      } else {
        if (!formData.username.trim()) {
          throw new Error("Username is required");
        }
        // For username login, we'll use email field in AuthContext but pass username
        credentials.email = formData.username.trim(); // AuthContext expects 'email' field
      }

      console.log("🚀 Calling AuthContext login with:", {
        method: loginMethod,
        identifier:
          loginMethod === "email" ? credentials.email : formData.username,
      });

      // CALL AuthContext login function instead of direct API
      const userData = await authLogin(credentials);

      console.log("✅ AuthContext login successful:", userData);

      // Handle remember me functionality
      if (formData.rememberMe) {
        if (loginMethod === "email") {
          localStorage.setItem("rememberedEmail", formData.email);
          localStorage.removeItem("rememberedUsername");
        } else {
          localStorage.setItem("rememberedUsername", formData.username);
          localStorage.removeItem("rememberedEmail");
        }
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedUsername");
      }

      // Redirect will happen automatically via useEffect, but we can also trigger it here
      setTimeout(() => {
        redirectToDashboard(userData.role);
      }, 100);
    } catch (err) {
      console.error("❌ Login error:", err);

      // Handle different types of errors
      let errorMessage = "";

      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("fetch")
      ) {
        errorMessage =
          "Network error - please check your connection and try again";
      } else if (err.message.includes("CORS")) {
        errorMessage = "Connection error - please contact support";
      } else if (
        err.message.includes("Invalid") ||
        err.message.includes("401")
      ) {
        errorMessage = "Invalid email/username or password";
      } else {
        errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const switchLoginMethod = () => {
    setLoginMethod((prev) => (prev === "email" ? "username" : "email"));
    setError(""); // Clear any existing errors
    setSuccessMessage(""); // Clear success messages
  };

  // Combine loading states
  const isFormLoading = isLoading || authLoading;

  // Combine error states
  const displayError = error || authError;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Connection Status Indicator */}
      {connectionStatus && (
        <div
          className={`fixed top-4 right-4 z-50 p-3 rounded-lg text-sm max-w-sm ${
            connectionStatus === "connected"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {connectionStatus === "connected"
            ? "✅ Connected to server"
            : "❌ Server connection failed - please refresh and try again"}
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 relative">
          {/* Back Button */}
          <button
            onClick={handleGoBack}
            disabled={isFormLoading}
            className="absolute left-0 top-0 p-2 text-gray-400 hover:text-gray-600 
              transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center group"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-5 w-5 group-hover:transform group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="ml-1 text-sm hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-2 rounded-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome Back
          </CardTitle>
          <p className="text-gray-600 text-center">
            Sign in to access your account
          </p>
        </CardHeader>
        <CardContent>
          {/* Alternative Back Link for Mobile */}
          <div className="mb-4 sm:hidden">
            <button
              onClick={handleGoBack}
              disabled={isFormLoading}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 
                transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to previous page
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {displayError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login Method Toggle */}
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 p-1 rounded-lg flex">
                <button
                  type="button"
                  onClick={() => setLoginMethod("email")}
                  disabled={isFormLoading}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    loginMethod === "email"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  } ${isFormLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod("username")}
                  disabled={isFormLoading}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    loginMethod === "username"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  } ${isFormLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Username
                </button>
              </div>
            </div>

            {/* Email or Username Field */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor={loginMethod}
              >
                {loginMethod === "email" ? "Email Address" : "Username"}
              </label>
              <div className="relative">
                {loginMethod === "email" ? (
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                ) : (
                  <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                )}
                <input
                  id={loginMethod}
                  name={loginMethod}
                  type={loginMethod === "email" ? "email" : "text"}
                  value={
                    loginMethod === "email" ? formData.email : formData.username
                  }
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50"
                  placeholder={
                    loginMethod === "email"
                      ? "Enter your email"
                      : "Enter your username"
                  }
                  required
                  disabled={isFormLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50"
                  placeholder="Enter your password"
                  required
                  disabled={isFormLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  disabled={isFormLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  disabled={isFormLoading}
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-sm text-gray-600"
                >
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                disabled={isFormLoading || connectionStatus === "failed"}
              >
                {isFormLoading ? "Signing in..." : "Sign in"}
              </button>

              {/* Cancel/Back Button */}
              <button
                type="button"
                onClick={handleGoBack}
                disabled={isFormLoading}
                className="w-full flex justify-center items-center py-2 px-4 border 
                  border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 
                  bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel & Go Back
              </button>
            </div>

            {/* Alternative Login Method */}
            <div className="text-center">
              <button
                type="button"
                onClick={switchLoginMethod}
                className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isFormLoading}
              >
                Sign in with {loginMethod === "email" ? "username" : "email"}{" "}
                instead
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </Link>
            </div>
          </form>

          {/* Quick Test Users (Development Only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="text-sm text-gray-600">
                <h3 className="font-medium text-gray-900 mb-2">
                  Debug Info (Dev Only):
                </h3>
                <div className="space-y-1 text-xs">
                  <p>
                    • Auth State:{" "}
                    {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                  </p>
                  <p>• User Role: {user?.role || "None"}</p>
                  <p>• Loading: {isFormLoading ? "Yes" : "No"}</p>
                  <p>• Error: {displayError || "None"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
