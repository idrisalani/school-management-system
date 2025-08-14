// @ts-nocheck

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email"); // "email" or "username"
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Prepare login data based on selected method
      const loginData = {
        password: formData.password,
        rememberMe: formData.rememberMe,
      };

      // Add email or username based on login method
      if (loginMethod === "email") {
        loginData.email = formData.email;
      } else {
        loginData.username = formData.username;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(loginData),
        }
      );

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error - please try again later");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Invalid credentials");
      }

      // Handle successful login
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect based on user role
        const userRole = data.user?.role || "student";
        switch (userRole) {
          case "admin":
            navigate("/admin/dashboard");
            break;
          case "teacher":
            navigate("/teacher/dashboard");
            break;
          case "student":
            navigate("/student/dashboard");
            break;
          case "parent":
            navigate("/parent/dashboard");
            break;
          default:
            navigate("/dashboard");
        }
      } else {
        throw new Error("Login successful but no token received");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const switchLoginMethod = () => {
    setLoginMethod((prev) => (prev === "email" ? "username" : "email"));
    setError(""); // Clear any existing errors
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 relative">
          {/* Back Button */}
          <button
            onClick={handleGoBack}
            disabled={isLoading}
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
              disabled={isLoading}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 
                transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to previous page
            </button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login Method Toggle */}
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 p-1 rounded-lg flex">
                <button
                  type="button"
                  onClick={() => setLoginMethod("email")}
                  disabled={isLoading}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    loginMethod === "email"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod("username")}
                  disabled={isLoading}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    loginMethod === "username"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    loginMethod === "email"
                      ? "Enter your email"
                      : "Enter your username"
                  }
                  required
                  disabled={isLoading}
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
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
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
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>

              {/* Cancel/Back Button */}
              <button
                type="button"
                onClick={handleGoBack}
                disabled={isLoading}
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
                className="text-sm text-gray-600 hover:text-gray-800 underline"
                disabled={isLoading}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
