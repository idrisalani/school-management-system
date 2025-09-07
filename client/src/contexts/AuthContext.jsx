// @ts-nocheck
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import PropTypes from "prop-types";

/**
 * @typedef {object} User
 * @property {string} id - User's unique identifier
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} role - User's role in the system
 * @property {string} [username] - User's username
 * @property {string} [firstName] - User's first name
 * @property {string} [lastName] - User's last name
 * @property {boolean} [isVerified] - Whether user's email is verified
 * @property {boolean} [profileCompleted] - Whether user's profile is completed
 */

/**
 * @typedef {object} LoginResponse
 * @property {string} status - Response status ("success" | "error")
 * @property {string} [message] - Response message
 * @property {object} data - Response data object
 * @property {User} data.user - User data
 * @property {string} data.accessToken - Access token
 * @property {string} data.refreshToken - Refresh token
 * @property {number} data.expiresIn - Token expiration time
 */

/**
 * @typedef {object} VerifyResponse
 * @property {string} status - Response status
 * @property {boolean} authenticated - Whether user is authenticated
 * @property {User} user - User data
 */

/**
 * @typedef {object} LoginCredentials
 * @property {string} email - User's email address for authentication
 * @property {string} password - User's password for authentication
 */

/**
 * @typedef {object} AuthContextType
 * @property {User|null} user - Currently authenticated user
 * @property {boolean} isAuthenticated - Whether a user is currently authenticated
 * @property {boolean} isLoading - Whether an authentication operation is in progress
 * @property {string|null} error - Current authentication error message
 * @property {(credentials: LoginCredentials) => Promise<User>} login - Function to authenticate user
 * @property {() => Promise<void>} logout - Function to log out current user
 * @property {() => Promise<void>} checkAuth - Function to verify authentication status
 * @property {() => void} clearError - Function to clear current error
 * @property {() => Promise<string|null>} refreshToken - Function to refresh access token
 * @property {(profileData: object, tempToken: string) => Promise<{success: boolean, message: string, user?: object}>} completeProfile - Function to complete user profile
 */

/**
 * @type {AuthContextType}
 */
const defaultContext = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async () => {
    throw new Error("AuthContext not initialized");
  },
  logout: async () => {
    throw new Error("AuthContext not initialized");
  },
  checkAuth: async () => {
    throw new Error("AuthContext not initialized");
  },
  clearError: () => {
    throw new Error("AuthContext not initialized");
  },
  refreshToken: async () => {
    throw new Error("AuthContext not initialized");
  },
};

const AuthContext = createContext(defaultContext);

/**
 * Authentication Provider Component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to be wrapped
 * @returns {React.ReactElement} The provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(/** @type {User|null} */ (null));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(/** @type {string|null} */ (null));

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Logout function - defined before refreshToken to avoid dependency issues
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      console.log("🚀 AuthContext: Logging out user");

      const accessToken =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (accessToken) {
        try {
          // Only call logout API if we have a token
          await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });
          console.log("✅ AuthContext: Logout API call successful");
        } catch (logoutError) {
          console.warn(
            "⚠️ AuthContext: Logout API call failed (continuing anyway):",
            logoutError
          );
          // Continue with logout even if API call fails
        }
      }
    } catch (error) {
      console.error("❌ AuthContext: Logout error:", error);
    } finally {
      // Always clean up local state and storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token"); // Backward compatibility
      localStorage.removeItem("user");
      localStorage.removeItem("rememberedEmail");
      localStorage.removeItem("rememberedUsername");

      setUser(null);
      setError(null);
      setIsLoading(false);

      console.log("✅ AuthContext: Logout cleanup complete");
    }
  }, []);

  /**
   * Token refresh function
   * @returns {Promise<string|null>}
   */
  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) return null;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/auth/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken: refresh }),
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "success" && data.data) {
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("token", accessToken); // Backward compatibility
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        return accessToken;
      } else {
        // Refresh failed, logout user
        await logout();
        return null;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      await logout();
      return null;
    }
  }, [logout]);

  /**
   * Login function with FIXED response handling for production backend
   * @param {LoginCredentials} credentials
   * @returns {Promise<User>}
   */
  const login = useCallback(
    /** @type {(credentials: LoginCredentials) => Promise<User>} */ async (
      credentials
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!credentials.email || !credentials.password) {
          throw new Error("Email and password are required");
        }

        console.log("🚀 AuthContext: Attempting login with:", {
          email: credentials.email,
          hasPassword: !!credentials.password,
        });

        // Direct API call to match backend response format
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/v1/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          }
        );

        // Parse JSON response
        const data = await response.json();

        console.log("✅ AuthContext: Login API response:", data);

        // Handle HTTP errors first
        if (!response.ok) {
          const errorMessage =
            data.message || `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        }

        // Handle the actual backend response format
        if (data.status === "success" && data.data) {
          const { user: userData, accessToken, refreshToken } = data.data;

          if (!userData) {
            throw new Error("User data not received from server");
          }

          if (!accessToken) {
            throw new Error("Authentication token not received from server");
          }

          // Store both tokens with correct names
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken || "");
          localStorage.setItem("token", accessToken); // Keep backward compatibility
          localStorage.setItem("user", JSON.stringify(userData));

          setUser(userData);

          console.log("✅ AuthContext: Login successful for user:", {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            username: userData.username,
          });

          return userData;
        } else {
          throw new Error(
            data.message || "Login failed - invalid response format"
          );
        }
      } catch (err) {
        console.error("❌ AuthContext: Login error:", err);

        let message = "An unknown error occurred during login";

        if (err instanceof Error) {
          message = err.message;
        } else if (err?.response?.data?.message) {
          message = err.response.data.message;
        } else if (typeof err === "string") {
          message = err;
        }

        // Handle specific error cases with better messages
        if (
          message.includes("Invalid credentials") ||
          message.includes("401")
        ) {
          message = "Invalid email or password. Please try again.";
        } else if (
          message.includes("verify your email") ||
          message.includes("403")
        ) {
          message = "Please verify your email address before logging in.";
        } else if (message.includes("429")) {
          message = "Too many login attempts. Please try again later.";
        } else if (
          message.includes("Failed to fetch") ||
          message.includes("Network")
        ) {
          message =
            "Network error. Please check your connection and try again.";
        } else if (message.includes("account is locked")) {
          message = "Account is temporarily locked. Please try again later.";
        }

        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Complete user profile after email verification
   * @param {Object} profileData - Profile completion data
   * @param {string} tempToken - Temporary token for profile completion
   * @returns {Promise<{success: boolean, message: string, user?: Object}>}
   */
  const completeProfile = useCallback(async (profileData, tempToken) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔄 AuthContext: Completing profile");

      // Direct API call with temp token
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/auth/complete-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tempToken}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();

      console.log("✅ AuthContext: Profile completion response:", data);

      if (response.ok && data.status === "success" && data.data) {
        const { user: userData, token } = data.data;

        if (!userData || !token) {
          throw new Error(
            "Profile completion response missing user data or token"
          );
        }

        // Store the new access token and user data
        localStorage.setItem("accessToken", token);
        localStorage.setItem("token", token); // Backward compatibility
        localStorage.setItem("user", JSON.stringify(userData));

        // Clean up temp token
        localStorage.removeItem("tempToken");

        setUser(userData);

        console.log(
          "✅ AuthContext: Profile completed successfully for user:",
          {
            id: userData.id,
            email: userData.email,
            role: userData.role,
          }
        );

        return {
          success: true,
          message: data.message || "Profile completed successfully!",
          user: userData,
        };
      } else {
        throw new Error(data.message || "Profile completion failed");
      }
    } catch (err) {
      console.error("❌ AuthContext: Profile completion error:", err);

      let message = "Failed to complete profile. Please try again.";

      if (err instanceof Error) {
        message = err.message;
      } else if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (typeof err === "string") {
        message = err;
      }

      // Handle specific error cases
      if (message.includes("401") || message.includes("Invalid token")) {
        message = "Session expired. Please verify your email again.";
        // Clean up invalid temp token
        localStorage.removeItem("tempToken");
      } else if (
        message.includes("validation") ||
        message.includes("required")
      ) {
        message = "Please fill in all required fields correctly.";
      }

      setError(message);

      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Helper function to verify authentication with backend
   * @param {string} accessToken
   */
  const verifyWithBackend = useCallback(async (accessToken) => {
    try {
      setIsLoading(true);

      console.log("🔍 AuthContext: Verifying authentication with backend");

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/auth/verify-auth`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      console.log("✅ AuthContext: Verify API response:", data);

      // Handle backend verify response structure
      if (
        response.ok &&
        data.status === "success" &&
        data.authenticated &&
        data.user
      ) {
        const userData = data.user;
        setUser(userData);

        // Update stored user data
        localStorage.setItem("user", JSON.stringify(userData));

        console.log("✅ AuthContext: Authentication verified for user:", {
          id: userData.id,
          email: userData.email,
          role: userData.role,
        });
      } else {
        throw new Error("Authentication verification failed");
      }
    } catch (err) {
      console.warn("⚠️ AuthContext: Authentication verification failed:", err);

      // Clean up invalid authentication
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);

      // Don't set error for expected auth failures
      if (!err?.message?.includes("401") && !err?.message?.includes("403")) {
        console.error(
          "❌ AuthContext: Unexpected error during auth verification:",
          err
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * FIXED: Only verify auth when token exists and don't make unnecessary API calls
   * @returns {Promise<void>}
   */
  const checkAuth = useCallback(async () => {
    const accessToken =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    // If no token exists, user is not authenticated - no API call needed
    if (!accessToken) {
      console.log("🔍 AuthContext: No token found, user not authenticated");
      setUser(null);
      return;
    }

    // If we have a stored user and token, use it initially (fast startup)
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log("🔄 AuthContext: Using stored user data");
        setUser(userData);

        // Optionally verify with backend in background (don't await)
        verifyWithBackend(accessToken);
        return;
      } catch (parseError) {
        console.error("❌ AuthContext: Failed to parse stored user data");
        // Continue to backend verification
      }
    }

    // Only make API call if we have a token but no valid stored user
    await verifyWithBackend(accessToken);
  }, [verifyWithBackend]);

  // FIXED: Initialize authentication more carefully
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (mounted) {
        console.log("🚀 AuthContext: Initializing authentication");

        // Quick check: if no token exists, don't make any API calls
        const hasToken =
          localStorage.getItem("accessToken") || localStorage.getItem("token");

        if (!hasToken) {
          console.log(
            "🔍 AuthContext: No token found during init, skipping auth check"
          );
          setUser(null);
          return;
        }

        // Only check auth if we have a token
        await checkAuth();
        console.log("✅ AuthContext: Authentication initialization complete");
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  /** @type {AuthContextType} */
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
    refreshToken,
    completeProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook for accessing authentication context
 * @returns {AuthContextType} The authentication context
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
