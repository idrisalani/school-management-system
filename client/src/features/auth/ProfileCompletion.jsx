// @ts-nocheck
// ProfileCompletion Component - Database Schema Aligned
// File: /client/src/features/auth/ProfileCompletion.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ProfileCompletion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeProfile } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState(null);

  // Form data matching database schema exactly
  const [formData, setFormData] = useState({
    // Common fields (all roles)
    phone: "",
    address: "",
    date_of_birth: "", // Matches DB column name exactly
    gender: "",
    bio: "",

    // Student-specific fields
    grade_level: "", // Matches DB column name exactly
    parent_email: "", // Matches DB column name exactly
    emergency_contact: "", // Matches DB column name exactly

    // Teacher-specific fields
    department: "",
    qualifications: "",

    // Parent-specific fields
    occupation: "",
    work_phone: "",
    relationship_to_student: "",

    // Admin-specific fields
    admin_level: "",
    permissions: "",
    employee_id: "",
  });

  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (location.state?.user) {
      const userData = location.state.user;
      setUser(userData);

      const storedTempToken = localStorage.getItem("tempToken");
      if (storedTempToken) {
        setTempToken(storedTempToken);
      } else {
        console.warn(
          "No temp token found - user may need to verify email again"
        );
        navigate("/login", {
          state: {
            message:
              "Session expired. Please login or verify your email again.",
          },
        });
      }
    } else {
      navigate("/login", {
        state: {
          message: "Please verify your email to complete your profile",
        },
      });
    }
  }, [location, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validation based on user role
  const validateForm = () => {
    const newErrors = [];

    // Common field validation
    if (!formData.phone.trim()) newErrors.push("Phone number is required");
    if (!formData.address.trim()) newErrors.push("Address is required");
    if (!formData.date_of_birth) newErrors.push("Date of birth is required");
    if (!formData.gender) newErrors.push("Gender is required");

    // Phone validation
    const phoneRegex = /^[+]?[0-9\s\-()]{10,15}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.push("Please enter a valid phone number");
    }

    // Age validation
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 5 || age > 120) {
        newErrors.push(
          "Please enter a valid date of birth (age must be between 5 and 120 years)"
        );
      }
    }

    // Role-specific validation
    if (user?.role === "student") {
      if (!formData.grade_level)
        newErrors.push("Grade level is required for students");
      if (!formData.parent_email.trim())
        newErrors.push("Parent email is required for students");
      if (!formData.emergency_contact.trim())
        newErrors.push("Emergency contact is required for students");

      // Parent email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.parent_email && !emailRegex.test(formData.parent_email)) {
        newErrors.push("Please enter a valid parent email address");
      }
    }

    if (user?.role === "teacher") {
      if (!formData.department)
        newErrors.push("Department is required for teachers");
      if (!formData.qualifications.trim())
        newErrors.push("Qualifications are required for teachers");
    }

    if (user?.role === "parent") {
      if (!formData.relationship_to_student)
        newErrors.push("Relationship to student is required for parents");
      if (!formData.occupation.trim())
        newErrors.push("Occupation is required for parents");
    }

    if (user?.role === "admin") {
      if (!formData.admin_level)
        newErrors.push("Admin level is required for administrators");
      if (!formData.employee_id.trim())
        newErrors.push("Employee ID is required for administrators");
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    if (!tempToken) {
      setErrors(["Session expired. Please verify your email again."]);
      setLoading(false);
      return;
    }

    try {
      // Filter form data to only include fields relevant to the user's role
      const relevantData = { ...formData };

      // Remove irrelevant fields based on role
      if (user.role !== "student") {
        delete relevantData.grade_level;
        delete relevantData.parent_email;
        delete relevantData.emergency_contact;
      }

      if (user.role !== "teacher") {
        delete relevantData.department;
        delete relevantData.qualifications;
      }

      if (user.role !== "parent") {
        delete relevantData.occupation;
        delete relevantData.work_phone;
        delete relevantData.relationship_to_student;
      }

      if (user.role !== "admin") {
        delete relevantData.admin_level;
        delete relevantData.permissions;
        delete relevantData.employee_id;
      }

      console.log("Sending profile data:", relevantData);

      const result = await completeProfile(relevantData, tempToken);

      if (result.success) {
        alert(result.message);

        // Navigate to appropriate dashboard based on role
        switch (user.role) {
          case "student":
            navigate("/student/dashboard");
            break;
          case "teacher":
            navigate("/teacher/dashboard");
            break;
          case "parent":
            navigate("/parent/dashboard");
            break;
          case "admin":
            navigate("/admin/dashboard");
            break;
          default:
            navigate("/dashboard");
        }
      } else {
        setErrors([result.message]);
      }
    } catch (error) {
      console.error("Profile completion error:", error);
      setErrors(["Failed to complete profile. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !tempToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile completion...</p>
        </div>
      </div>
    );
  }

  const displayName =
    user?.firstName ||
    user?.first_name ||
    user?.name ||
    user?.username ||
    "User";

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "student":
        return "Student";
      case "teacher":
        return "Teacher";
      case "parent":
        return "Parent/Guardian";
      case "admin":
        return "Administrator";
      default:
        return "User";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome {displayName}! Please complete your{" "}
            {getRoleDisplayName(user.role).toLowerCase()} profile to continue.
          </p>
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800 text-center">
              ✓ Email verified successfully! Complete your profile below.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <ul className="text-sm text-red-600 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Common fields for all roles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Basic Information
            </h3>

            <input
              type="tel"
              name="phone"
              placeholder="Phone Number *"
              value={formData.phone}
              onChange={handleInputChange}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />

            <textarea
              name="address"
              placeholder="Address *"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Gender *</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>

            <textarea
              name="bio"
              placeholder="Brief bio (optional)"
              value={formData.bio}
              onChange={handleInputChange}
              rows={2}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Student-specific fields */}
          {user?.role === "student" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900">
                Student Information
              </h3>

              <select
                name="grade_level"
                value={formData.grade_level}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Grade Level *</option>
                <option value="K">Kindergarten</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={`Grade ${i + 1}`}>
                    Grade {i + 1}
                  </option>
                ))}
                <option value="Undergraduate">Undergraduate</option>
                <option value="Graduate">Graduate</option>
              </select>

              <input
                type="email"
                name="parent_email"
                placeholder="Parent/Guardian Email *"
                value={formData.parent_email}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />

              <input
                type="tel"
                name="emergency_contact"
                placeholder="Emergency Contact Number *"
                value={formData.emergency_contact}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          )}

          {/* Teacher-specific fields */}
          {user?.role === "teacher" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900">
                Teacher Information
              </h3>

              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Department *</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English Language Arts</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Physical Education">Physical Education</option>
                <option value="Art">Visual Arts</option>
                <option value="Music">Music</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Foreign Language">Foreign Language</option>
                <option value="Special Education">Special Education</option>
                <option value="Administration">Administration</option>
              </select>

              <textarea
                name="qualifications"
                placeholder="Qualifications and Certifications *"
                value={formData.qualifications}
                onChange={handleInputChange}
                rows={3}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          )}

          {/* Parent-specific fields */}
          {user?.role === "parent" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900">
                Parent/Guardian Information
              </h3>

              <select
                name="relationship_to_student"
                value={formData.relationship_to_student}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Relationship to Student *</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Guardian">Guardian</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Aunt/Uncle">Aunt/Uncle</option>
                <option value="Other">Other</option>
              </select>

              <input
                type="text"
                name="occupation"
                placeholder="Occupation *"
                value={formData.occupation}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />

              <input
                type="tel"
                name="work_phone"
                placeholder="Work Phone Number (optional)"
                value={formData.work_phone}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Admin-specific fields */}
          {user?.role === "admin" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900">
                Administrator Information
              </h3>

              <select
                name="admin_level"
                value={formData.admin_level}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Admin Level *</option>
                <option value="Super Admin">Super Admin</option>
                <option value="School Admin">School Admin</option>
                <option value="Department Head">Department Head</option>
                <option value="System Admin">System Admin</option>
                <option value="Support Staff">Support Staff</option>
              </select>

              <input
                type="text"
                name="employee_id"
                placeholder="Employee ID *"
                value={formData.employee_id}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />

              <textarea
                name="permissions"
                placeholder="Special Permissions/Notes (optional)"
                value={formData.permissions}
                onChange={handleInputChange}
                rows={2}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Completing Profile...
              </div>
            ) : (
              "Complete Profile"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletion;
