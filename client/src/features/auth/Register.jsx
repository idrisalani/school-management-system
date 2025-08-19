// @ts-nocheck

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
  Loader2,
  CheckCircle,
  Info,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import RegistrationErrorBoundary from "./RegistrationErrorBoundary";

/**
 * @typedef {object} RegisterData
 * @property {string} username - User's username (firstName + lastName)
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} email - User's email address
 * @property {string} password - User's password
 * @property {string} role - User's role in the system
 */

/**
 * @typedef {('student' | 'teacher' | 'parent')} UserRole
 */

/**
 * @typedef {object} FormData
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} email - User's email address
 * @property {string} password - User's password
 * @property {string} confirmPassword - Password confirmation input
 * @property {UserRole} role - User's role in the system
 * @property {boolean} acceptTerms - Whether user accepted terms and conditions
 */

/**
 * @typedef {{[key: string]: string}} FormErrors
 */

const ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  PARENT: "parent",
};

/**
 * @type {FormData}
 */
const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: ROLES.STUDENT,
  acceptTerms: false,
};

/**
 * @typedef {object} PasswordRequirement
 * @property {RegExp} test - Regular expression to test password against
 * @property {string} text - Description of the requirement
 */

/**
 * Password strength indicator component
 * @param {object} props - Component properties
 * @param {number} props.strength - Password strength score
 * @returns {React.JSX.Element} The rendered component
 */
const PasswordStrengthIndicator = ({ strength }) => {
  const getStrengthWidth = () => {
    if (strength >= 4) return "w-full bg-green-500";
    if (strength >= 3) return "w-3/4 bg-yellow-500";
    if (strength >= 2) return "w-1/2 bg-orange-500";
    if (strength >= 1) return "w-1/4 bg-red-500";
    return "w-0";
  };

  const getStrengthText = () => {
    if (strength >= 4) return "Very Strong";
    if (strength >= 3) return "Strong";
    if (strength >= 2) return "Fair";
    if (strength >= 1) return "Weak";
    return "";
  };

  return (
    <div className="mt-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStrengthWidth()}`}
        />
      </div>
      {strength > 0 && (
        <p className="text-xs mt-1 text-gray-600">
          Password strength: {getStrengthText()}
        </p>
      )}
    </div>
  );
};

PasswordStrengthIndicator.propTypes = {
  strength: PropTypes.number.isRequired,
};

/**
 * Register component
 * @returns {React.JSX.Element} The rendered component
 */
const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState("");

  /** @type {[FormData, React.Dispatch<React.SetStateAction<FormData>>]} */
  const [formData, setFormData] = useState(initialFormData);

  /** @type {[FormErrors, React.Dispatch<React.SetStateAction<FormErrors>>]} */
  const [errors, setErrors] = useState(/** @type {FormErrors} */ ({}));

  // Form persistence effects
  useEffect(() => {
    const savedForm = localStorage.getItem("registrationForm");
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        setFormData((prev) => ({
          ...prev,
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          email: parsed.email || "",
          role: parsed.role || ROLES.STUDENT,
        }));
      } catch (err) {
        console.error("Error loading saved form:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (formData.firstName || formData.lastName || formData.email) {
      localStorage.setItem(
        "registrationForm",
        JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
        })
      );
    }
  }, [formData.firstName, formData.lastName, formData.email, formData.role]);

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

  /**
   * Handle going back to previous page
   */
  const handleGoBack = () => {
    // Clear any form data if going back
    localStorage.removeItem("registrationForm");

    // Check if there's a previous page in history
    if (window.history.length > 1) {
      navigate(-1); // Go back to previous page
    } else {
      // If no history, go to login page or home page
      navigate("/login");
    }
  };

  /**
   * Handle form input changes
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - Change event
   */
  const handleChange = (e) => {
    const target = e.target;
    const name = target.name;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      const strength = calculatePasswordStrength(String(value));
      setPasswordStrength(strength);
    }

    // Clear error for the field being edited
    if (name in errors) {
      setErrors((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([key]) => key !== name))
      );
    }
  };

  /** @type {Array<{value: UserRole, label: string}>} */
  const roles = [
    { value: ROLES.STUDENT, label: "Student" },
    { value: ROLES.TEACHER, label: "Teacher" },
    { value: ROLES.PARENT, label: "Parent" },
  ];

  /**
   * Calculate password strength
   * @param {string} password - Password to check
   * @returns {number} Strength score (0-5)
   */
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  /**
   * Validate password against requirements
   * @param {string} password - Password to validate
   * @returns {boolean} Whether password is valid
   */
  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  /** @type {PasswordRequirement[]} */
  const passwordRequirements = [
    { test: /.{8,}/, text: "At least 8 characters" },
    { test: /[A-Z]/, text: "One uppercase letter" },
    { test: /[a-z]/, text: "One lowercase letter" },
    { test: /[0-9]/, text: "One number" },
    { test: /[^A-Za-z0-9]/, text: "One special character" },
  ];

  /**
   * Check password against requirements
   * @param {string} password - Password to validate
   * @returns {Array<PasswordRequirement & { met: boolean }>} requirements with met status
   */
  const checkPasswordStrength = (password) => {
    return passwordRequirements.map((req) => ({
      ...req,
      met: req.test.test(password),
    }));
  };

  /**
   * Validate form data
   * @returns {boolean} Whether form is valid
   */
  const validateForm = () => {
    /** @type {FormErrors} */
    const newErrors = {};

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password =
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character";
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * @param {React.FormEvent} e - Form event
   */
  // 🔧 UPDATE this section in your Register.jsx file
  // Find the handleSubmit function and update the registrationData object:
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Test connection first
      if (connectionStatus !== "connected") {
        console.log("🔍 Testing connection before registration...");
        const healthResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/api/v1/health`
        );
        if (!healthResponse.ok) {
          throw new Error("Server is not responding");
        }
      }

      // Create username as firstname.lastname (NEW FORMAT)
      const username = `${formData.firstName.trim().toLowerCase()}.${formData.lastName.trim().toLowerCase()}`;

      // Prepare registration data for PostgreSQL backend
      /** @type {RegisterData} */
      const registrationData = {
        username: username, // NEW: john.smith format
        firstName: formData.firstName.trim(), // John
        lastName: formData.lastName.trim(), // Smith
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
      };

      console.log("🚀 Submitting registration:", {
        username: registrationData.username, // NEW: Show the john.smith format
        email: registrationData.email,
        role: registrationData.role,
      });

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(registrationData),
        }
      );

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error - please try again later");
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle specific PostgreSQL/backend errors
        if (response.status === 409) {
          if (data.message?.includes("email")) {
            setErrors((prev) => ({
              ...prev,
              email: "Email address is already registered",
            }));
          } else if (data.message?.includes("name combination")) {
            setErrors((prev) => ({
              ...prev,
              firstName:
                "This name combination is already taken. Please try a different name.",
            }));
          } else {
            setErrors((prev) => ({
              ...prev,
              submit: data.message || "User already exists",
            }));
          }
        } else if (response.status === 400) {
          // Handle validation errors from express-validator
          if (data.errors && Array.isArray(data.errors)) {
            const validationErrors = {};
            data.errors.forEach((error) => {
              const field = error.path || error.param;
              if (field) {
                validationErrors[field] = error.msg || error.message;
              }
            });
            setErrors((prev) => ({ ...prev, ...validationErrors }));
          } else {
            setErrors((prev) => ({
              ...prev,
              submit: data.message || "Invalid registration data",
            }));
          }
        } else {
          setErrors((prev) => ({
            ...prev,
            submit: data.message || "Registration failed",
          }));
        }
        return;
      }

      console.log("✅ Registration successful:", data);
      console.log("🎯 New username created:", data.data?.user?.username);

      // Store token if provided in the new response format
      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      // FIXED: Store email before resetting form data
      setRegisteredEmail(formData.email); // Store the email before reset

      // Success - clear saved form data and show success
      localStorage.removeItem("registrationForm");
      setFormData(initialFormData); // Reset form data
      setShowSuccessModal(true); // Show modal
    } catch (error) {
      console.error("❌ Registration error:", error);

      // Handle different types of errors
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("fetch")
      ) {
        setErrors({
          submit: "Network error - please check your connection and try again",
        });
      } else if (error.message.includes("CORS")) {
        setErrors({ submit: "Connection error - please contact support" });
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to register";
        setErrors((prev) => ({ ...prev, submit: errorMessage }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle keyboard navigation
   * @param {React.KeyboardEvent<HTMLElement>} e - Keyboard event
   */
  const handleKeyPress = (e) => {
    if (
      e.key === "Enter" &&
      e.target instanceof HTMLInputElement &&
      e.target.type !== "submit"
    ) {
      e.preventDefault();
      const currentTarget = e.target;
      const form = currentTarget.closest("form");
      if (form) {
        const inputs = Array.from(form.elements);
        const index = inputs.indexOf(currentTarget);
        const nextInput = inputs[index + 1];
        if (nextInput instanceof HTMLElement) {
          nextInput.focus();
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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

      <Card className="max-w-md w-full">
        <CardHeader className="text-center relative">
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

          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="mt-2 text-sm text-gray-600">
            Sign up to get started with our School Management System
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className={`
                      block w-full pl-10 pr-3 py-2 border rounded-lg
                      ${
                        errors.firstName
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      }
                      ${isLoading ? "bg-gray-100" : ""}
                    `}
                    placeholder="First Name"
                    required
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className={`
                      block w-full pl-10 pr-3 py-2 border rounded-lg
                      ${
                        errors.lastName
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      }
                      ${isLoading ? "bg-gray-100" : ""}
                    `}
                    placeholder="Last Name"
                    required
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className={`
                    block w-full pl-10 pr-3 py-2 border rounded-lg
                    ${
                      errors.email
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }
                    ${isLoading ? "bg-gray-100" : ""}
                  `}
                  placeholder="Email Address"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                I am a
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
                className={`
                  mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg
                  ${isLoading ? "bg-gray-100" : ""}
                `}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className={`
                      block w-full pl-10 pr-10 py-2 border rounded-lg
                      ${
                        errors.password
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      }
                      ${isLoading ? "bg-gray-100" : ""}
                    `}
                    placeholder="Create Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <PasswordStrengthIndicator strength={passwordStrength} />
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Password requirements:
                  </p>
                  {checkPasswordStrength(formData.password).map(
                    (req, index) => (
                      <div key={index} className="flex items-center text-sm">
                        {req.met ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <Info className="h-4 w-4 text-gray-400 mr-2" />
                        )}
                        <span
                          className={
                            req.met ? "text-green-700" : "text-gray-500"
                          }
                        >
                          {req.text}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className={`
                      block w-full pl-10 pr-10 py-2 border rounded-lg
                      ${
                        errors.confirmPassword
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      }
                      ${isLoading ? "bg-gray-100" : ""}
                    `}
                    placeholder="Confirm Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="flex items-center">
                <input
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <span className="ml-2 text-sm text-gray-600">
                  I accept the{" "}
                  <Link
                    to="/terms"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.acceptTerms}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-lg bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="ml-3 text-sm text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || connectionStatus === "failed"}
                className={`
                  w-full flex justify-center items-center py-2 px-4 border border-transparent 
                  rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>

              {/* Cancel/Back Button */}
              <button
                type="button"
                onClick={handleGoBack}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border 
                  border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 
                  bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel & Go Back
              </button>
            </div>

            {/* Sign In Link */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          {/* Additional Information */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-600">
              <h3 className="font-medium text-gray-900">What happens next?</h3>
              <ul className="mt-4 space-y-3 list-disc list-inside">
                <li>You&apos;ll receive a verification email</li>
                <li>Complete your profile information</li>
                <li>Get access to your dashboard</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
              Registration Successful!
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Please check your email at {registeredEmail} to verify your
              account.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setRegisteredEmail(""); // Clear registered email
                navigate("/login", {
                  state: {
                    message: "Registration successful! Please sign in.",
                    email: registeredEmail,
                  },
                });
              }}
              className="w-full flex justify-center items-center py-2 px-4 border 
          border-transparent rounded-lg shadow-sm text-sm font-medium 
          text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const RegisterWithBoundary = () => (
  <RegistrationErrorBoundary>
    <Register />
  </RegistrationErrorBoundary>
);

export default RegisterWithBoundary;
