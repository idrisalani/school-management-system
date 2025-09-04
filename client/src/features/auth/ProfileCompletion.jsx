// @ts-nocheck
// Profile Completion Component - TypeScript Fixed
// File: /client/src/features/auth/ProfileCompletion.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // ADD THIS IMPORT

const ProfileCompletion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeProfile } = useAuth(); // ADD THIS LINE

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState(null); // ADD THIS STATE

  const [formData, setFormData] = useState(
    /** @type {any} */ ({
      phone: "",
      address: "",
      dateOfBirth: "", // Fixed field name to match backend
      gender: "",
      bio: "",
      // Student fields
      gradeLevel: "", // Fixed field name to match backend
      parentEmail: "", // Fixed field name to match backend
      emergencyContact: "", // Fixed field name to match backend
      // Teacher fields
      department: "",
      qualifications: "",
    })
  );

  // Initialize errors as a proper string array
  const [errors, setErrors] = useState(/** @type {string[]} */ ([]));

  useEffect(() => {
    if (location.state?.user) {
      const userData = location.state.user;
      setUser(userData);

      // Get temp token from localStorage (where EmailVerification stored it)
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
      // No user data - redirect to login
      navigate("/login", {
        state: {
          message: "Please verify your email to complete your profile",
        },
      });
    }
  }, [location, navigate]);

  /**
   * Handle input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * UPDATED: Handle form submission using AuthContext
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    if (!tempToken) {
      setErrors(["Session expired. Please verify your email again."]);
      setLoading(false);
      return;
    }

    try {
      const result = await completeProfile(formData, tempToken);

      if (result.success) {
        alert(result.message);
        navigate("/dashboard");
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

  // UPDATED: Loading state - check for both user and tempToken
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

  // Get user's display name safely with proper fallbacks
  const displayName =
    (user &&
      (user.firstName || user.first_name || user.name || user.username)) ||
    "User";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome {displayName}! Please complete your profile to continue.
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

          {/* Common fields */}
          <div className="space-y-4">
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

            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />

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
              <option value="prefer_not_to_say">Prefer not to say</option>
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
          {user && user.role === "student" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900">
                Student Information
              </h3>

              <select
                name="gradeLevel"
                value={formData.gradeLevel}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Grade Level *</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Grade {i + 1}
                  </option>
                ))}
              </select>

              <input
                type="email"
                name="parentEmail"
                placeholder="Parent/Guardian Email *"
                value={formData.parentEmail}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />

              <input
                type="tel"
                name="emergencyContact"
                placeholder="Emergency Contact Number *"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          )}

          {/* Teacher-specific fields */}
          {user && user.role === "teacher" && (
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
                <option value="English">English</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Physical Education">Physical Education</option>
                <option value="Art">Art</option>
                <option value="Music">Music</option>
                <option value="Computer Science">Computer Science</option>
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
