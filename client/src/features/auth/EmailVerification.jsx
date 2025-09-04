// Email Verification Frontend Component
// @ts-nocheck
// File: /client/src/features/auth/EmailVerification.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import api from "../../services/api";

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationState, setVerificationState] = useState({
    status: "verifying", // 'verifying', 'success', 'error', 'already_verified'
    message: "",
    user: null,
    nextStep: null,
    tempToken: null,
  });

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationState({
          status: "error",
          message: "Invalid verification link",
          user: null,
          nextStep: null,
          tempToken: null,
        });
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);

        if (response.data.status === "success") {
          const { user, nextStep } = response.data.data;

          setVerificationState({
            status: "success",
            message: response.data.message,
            user,
            nextStep,
            tempToken: response.data.data.tempToken || null,
          });

          // Store temporary token if provided
          if (response.data.data.tempToken) {
            localStorage.setItem("tempToken", response.data.data.tempToken);
          }
        } else {
          setVerificationState({
            status: "error",
            message: response.data.message,
            user: null,
            nextStep: response.data.redirect,
            tempToken: null,
          });
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Verification failed";
        const redirect = error.response?.data?.redirect;

        setVerificationState({
          status: error.response?.status === 400 ? "already_verified" : "error",
          message: errorMessage,
          user: null,
          nextStep: redirect,
          tempToken: null,
        });
      }
    };

    verifyEmail();
  }, [token]);

  // UPDATE your EmailVerification.jsx handleContinue function with debugging:

  const handleContinue = () => {
    const { nextStep, user, tempToken } = verificationState;

    // ADD DEBUG LOGGING
    console.log("🔍 EmailVerification Debug:", {
      nextStep,
      hasUser: !!user,
      hasTempToken: !!tempToken,
      userProfileCompleted: user?.profile_completed,
      verificationState: verificationState,
    });

    if (nextStep === "complete_profile" || nextStep === "complete-profile") {
      // Store temp token in localStorage
      if (tempToken) {
        localStorage.setItem("tempToken", tempToken);
        console.log("✅ Temp token stored in localStorage");
      } else {
        console.warn("⚠️ No temp token provided for profile completion");
      }

      // Navigate to profile completion with user data
      navigate("/complete-profile", {
        state: { user },
        replace: true,
      });
      console.log("🚀 Navigating to profile completion");
    } else if (nextStep === "login") {
      console.log("🔄 Redirecting to login");
      navigate("/login", { replace: true });
    } else {
      console.log("🏠 Defaulting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  };

  const handleResendVerification = async () => {
    try {
      // This would need the user's email - you might need to collect it
      const email = prompt("Please enter your email address:");
      if (!email) return;

      await api.post("/auth/resend-verification", { email });
      alert("Verification email sent successfully");
    } catch (error) {
      alert("Failed to resend verification email");
    }
  };

  const renderVerificationStatus = () => {
    switch (verificationState.status) {
      case "verifying":
        return (
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying your email...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address.
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Welcome {verificationState.user?.first_name}!{" "}
              {verificationState.message}
            </p>

            {verificationState.nextStep === "complete_profile" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">
                  Next Step: Complete Your Profile
                </h3>
                <p className="text-sm text-blue-700">
                  To access all features, please complete your profile
                  information.
                </p>
              </div>
            )}

            <button
              onClick={handleContinue}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        );

      case "already_verified":
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Already Verified
            </h2>
            <p className="text-gray-600 mb-6">{verificationState.message}</p>

            <div className="space-y-3">
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Go to Login
              </Link>

              {verificationState.nextStep === "/complete-profile" && (
                <Link
                  to="/complete-profile"
                  className="block px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50"
                >
                  Complete Profile
                </Link>
              )}
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">{verificationState.message}</p>

            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                <Mail className="mr-2 h-5 w-5" />
                Resend Verification Email
              </button>

              <Link
                to="/register"
                className="block px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Back to Registration
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Email Verification
            </h1>
          </div>

          {/* Status Content */}
          {renderVerificationStatus()}

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Having trouble?{" "}
              <Link to="/contact" className="text-blue-600 hover:text-blue-500">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
