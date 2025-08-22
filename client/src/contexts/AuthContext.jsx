// @ts-check
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import api from "../services/api";

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
 */

/**
 * @typedef {object} LoginResponse
 * @property {string} status - Response status ("success" | "error")
 * @property {string} [message] - Response message
 * @property {User} user - User data
 * @property {string} [accessToken] - Access token
 * @property {string} [token] - Authentication token
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
 */

/** @type {AuthContextType} */
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
   * Login function with enhanced error handling and API response compatibility
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

        const response = await api.auth.login(
          credentials.email,
          credentials.password
        );

        console.log("✅ AuthContext: Login API response:", response);

        // Handle different possible response structures
        let responseData = response;

        // If response has a data property, use that
        if (response.data) {
          responseData = response.data;
        }

        // If responseData has another data property (nested structure), use that
        if (responseData.data) {
          responseData = responseData.data;
        }

        console.log("📋 AuthContext: Processed response data:", {
          status: responseData.status,
          hasUser: !!responseData.user,
          hasToken: !!(responseData.accessToken || responseData.token),
        });

        // Check for successful response
        if (responseData.status === "success" && responseData.user) {
          const userData = responseData.user;
          const token = responseData.accessToken || responseData.token;

          if (!userData) {
            throw new Error("User data not received from server");
          }

          if (!token) {
            throw new Error("Authentication token not received from server");
          }

          // Store token and user data
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(userData));

          setUser(userData);

          console.log("✅ AuthContext: Login successful for user:", {
            id: userData.id,
            email: userData.email,
            role: userData.role,
          });

          return userData;
        } else {
          throw new Error(
            responseData.message || "Login failed - invalid response format"
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

        // Handle specific error cases
        if (
          message.includes("401") ||
          message.includes("Invalid credentials")
        ) {
          message = "Invalid email or password. Please try again.";
        } else if (message.includes("403")) {
          message = "Access denied. Please verify your email address.";
        } else if (message.includes("429")) {
          message = "Too many login attempts. Please try again later.";
        } else if (message.includes("Network") || message.includes("fetch")) {
          message =
            "Network error. Please check your connection and try again.";
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
   * Handles user logout with enhanced cleanup
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      console.log("🚀 AuthContext: Logging out user");

      const token = localStorage.getItem("token");
      if (token) {
        try {
          await api.auth.logout();
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
      localStorage.removeItem("token");
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
   * Verifies current authentication status with backend response compatibility
   * @returns {Promise<void>}
   */
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      console.log("🔍 AuthContext: No token found, user not authenticated");
      setUser(null);
      return;
    }

    try {
      setIsLoading(true);

      console.log("🔍 AuthContext: Verifying authentication with backend");

      const response = await api.auth.verify();

      console.log("✅ AuthContext: Verify API response:", response);

      // Handle different possible response structures
      let responseData = response;

      // If response has a data property, use that
      if (response.data) {
        responseData = response.data;
      }

      console.log("📋 AuthContext: Processed verify data:", {
        status: responseData.status,
        authenticated: responseData.authenticated,
        hasUser: !!responseData.user,
      });

      // Handle backend verify response structure
      if (
        responseData.status === "success" &&
        responseData.authenticated &&
        responseData.user
      ) {
        const userData = responseData.user;
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

      // If verification fails, try to use stored user data as fallback
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log("🔄 AuthContext: Using stored user data as fallback");
          setUser(userData);
          return;
        } catch (parseError) {
          console.error("❌ AuthContext: Failed to parse stored user data");
        }
      }

      // Clean up invalid authentication
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);

      // Don't set error for auth verification failures during initialization
      if (err?.response?.status !== 401) {
        console.error(
          "❌ AuthContext: Unexpected error during auth verification:",
          err
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (mounted) {
        console.log("🚀 AuthContext: Initializing authentication");
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
