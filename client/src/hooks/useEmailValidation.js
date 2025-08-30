// Email Validation Hook - JavaScript Version
// File: /client/src/hooks/useEmailValidation.js

import { useState, useCallback } from "react";

/**
 * Custom hook for email validation and existence checking
 * @returns {object} Hook returns with email status and validation functions
 */
export const useEmailValidation = () => {
  /** @type {[{isChecking: boolean, exists: boolean | null, verified: boolean | null, error: string | null}, function]} */
  const [emailStatus, setEmailStatus] = useState({
    isChecking: false,
    exists: null,
    verified: null,
    error: null,
  });

  /**
   * Check if email exists in the database
   * @param {string} email - Email address to check
   * @returns {Promise<object>} Email existence data
   */
  const checkEmail = useCallback(async (email) => {
    if (!email || !email.includes("@")) {
      setEmailStatus({
        isChecking: false,
        exists: null,
        verified: null,
        error: "Invalid email format",
      });
      return;
    }

    setEmailStatus((prev) => ({
      ...prev,
      isChecking: true,
      error: null,
    }));

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/auth/check-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check email");
      }

      const data = await response.json();

      setEmailStatus({
        isChecking: false,
        exists: data.data.exists,
        verified: data.data.verified,
        error: null,
      });

      return data.data;
    } catch (error) {
      console.error("Email validation error:", error);
      setEmailStatus({
        isChecking: false,
        exists: null,
        verified: null,
        error: error.message || "Failed to check email",
      });
      throw error;
    }
  }, []);

  /**
   * Reset email validation status
   */
  const resetEmailStatus = useCallback(() => {
    setEmailStatus({
      isChecking: false,
      exists: null,
      verified: null,
      error: null,
    });
  }, []);

  return {
    emailStatus,
    checkEmail,
    resetEmailStatus,
  };
};
