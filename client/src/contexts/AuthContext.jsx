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
 * @typedef {object} ApiResponse
 * @property {{user: User, token?: string}} data - Response data containing user and optional token
 */

/**
 * @typedef {object} ApiAuth
 * @property {(email: string, password: string) => Promise<ApiResponse>} login - Authenticates user with email and password
 * @property {() => Promise<void>} logout - Logs out the current user
 * @property {() => Promise<ApiResponse>} verify - Verifies the current authentication status
 */

/**
 * @typedef {object} Api
 * @property {ApiAuth} auth - Authentication-related API methods
 */

/** @type {Api} */
const typedApi = /** @type {Api} */ (api);

/**
 * @typedef {object} LoginCredentials
 * @property {string} email - User's email address for authentication
 * @property {string} password - User's password for authentication
 */

/**
 * @typedef {object} User
 * @property {string} id - User's unique identifier
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} role - User's role in the system
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
   * @param {LoginCredentials} credentials
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

        const response = await typedApi.auth.login(
          credentials.email,
          credentials.password
        );
        const userData = response.data.user;

        localStorage.setItem("token", response.data.token || "");
        localStorage.setItem("user", JSON.stringify(userData));

        setUser(userData);
        return userData;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Handles user logout
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        await typedApi.auth.logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  /**
   * Verifies current authentication status
   * @returns {Promise<void>}
   */
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await typedApi.auth.verify();
      setUser(response.data.user);
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (mounted) {
        await checkAuth();
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
