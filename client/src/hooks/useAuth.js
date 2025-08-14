// @ts-check
import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import useApi from "./useApi";

/**
 * @typedef {object} User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} name - User name
 * @property {string} role - User role
 * @property {string[]} permissions - User permissions
 */

/**
 * @typedef {object} AuthContextValue
 * @property {User|null} user - Current user
 * @property {string} authStatus - Authentication status
 * @property {boolean} isLoading - Loading state
 * @property {boolean} isAuthenticated - Authentication state
 * @property {(email: string, password: string) => Promise<User>} login - Login function
 * @property {() => Promise<void>} logout - Logout function
 * @property {(requiredPermissions: string[]) => boolean} hasPermissions - Check permissions
 * @property {(roles: string|string[]) => boolean} hasRole - Check role
 * @property {() => Promise<string|null>} refreshToken - Refresh token
 */

/** @type {Record<string, string>} */
const AUTH_STATUS = {
  LOADING: "LOADING",
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
};

/**
 * @type {AuthContextValue}
 */
const defaultContextValue = {
  user: null,
  authStatus: AUTH_STATUS.LOADING,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {
    throw new Error("AuthContext not initialized");
  },
  logout: async () => {
    throw new Error("AuthContext not initialized");
  },
  hasPermissions: () => false,
  hasRole: () => false,
  refreshToken: async () => null,
};

const AuthContext = createContext(defaultContextValue);

/**
 * Authentication Provider Component
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.JSX.Element} AuthProvider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(/** @type {User|null} */ (null));
  const [authStatus, setAuthStatus] = useState(AUTH_STATUS.LOADING);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const api = useApi();
  const navigate = useNavigate();

  // Session timeout settings
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

  /**
   * Refreshes the authentication token
   * @returns {Promise<string|null>} New token or null
   */
  const refreshToken = useCallback(async () => {
    try {
      const response = await api.post("/auth/refresh", {}, { skipError: true });
      return response.token;
    } catch (error) {
      return null;
    }
  }, [api]);

  /**
   * Updates the last activity timestamp
   */
  const updateLastActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  /**
   * Logs out the current user
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {}, { skipError: true });
    } finally {
      setUser(null);
      setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
      navigate("/login");
    }
  }, [api, navigate]);

  /**
   * Checks if the session has timed out
   * @returns {boolean} Whether session has timed out
   */
  const checkSessionTimeout = useCallback(() => {
    const now = Date.now();
    if (now - lastActivity > SESSION_TIMEOUT) {
      logout();
      return true;
    }
    if (now - lastActivity > SESSION_TIMEOUT - REFRESH_THRESHOLD) {
      refreshToken();
    }
    return false;
  }, [lastActivity, refreshToken, logout, SESSION_TIMEOUT, REFRESH_THRESHOLD]);

  /**
   * Logs in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<User>} Logged in user data
   */
  const login = useCallback(
    async (email, password) => {
      try {
        const response = await api.post("/auth/login", { email, password });

        /** @type {User} */
        const userData = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          permissions: response.user.permissions,
        };

        setUser(userData);
        setAuthStatus(AUTH_STATUS.AUTHENTICATED);
        updateLastActivity();

        switch (userData.role) {
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

        return userData;
      } catch (error) {
        setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
        throw error;
      }
    },
    [api, navigate, updateLastActivity]
  );

  /**
   * Checks if user has required permissions
   * @param {string[]} requiredPermissions - Required permissions to check
   * @returns {boolean} Whether user has all required permissions
   */
  const hasPermissions = useCallback(
    (requiredPermissions) => {
      if (!user?.permissions) return false;
      return requiredPermissions.every((permission) =>
        user.permissions.includes(permission)
      );
    },
    [user]
  );

  /**
   * Checks if user has required role
   * @param {string|string[]} roles - Required role(s)
   * @returns {boolean} Whether user has required role
   */
  const hasRole = useCallback(
    (roles) => {
      if (!user?.role) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user]
  );

  /**
   * Verifies current authentication status
   * @returns {Promise<void>}
   */
  const verifyAuth = useCallback(async () => {
    try {
      const response = await api.get("/auth/verify", { skipError: true });
      if (response.user) {
        setUser(response.user);
        setAuthStatus(AUTH_STATUS.AUTHENTICATED);
      } else {
        setUser(null);
        setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
      }
    } catch (error) {
      setUser(null);
      setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
    }
  }, [api]);

  // Initialize authentication state
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Set up activity monitoring
  useEffect(() => {
    if (authStatus !== AUTH_STATUS.AUTHENTICATED) return;

    const handleActivity = () => {
      updateLastActivity();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    const intervalId = setInterval(checkSessionTimeout, 60000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      clearInterval(intervalId);
    };
  }, [authStatus, updateLastActivity, checkSessionTimeout]);

  /** @type {AuthContextValue} */
  const contextValue = {
    user,
    authStatus,
    login,
    logout,
    hasPermissions,
    hasRole,
    refreshToken,
    isLoading: authStatus === AUTH_STATUS.LOADING,
    isAuthenticated: authStatus === AUTH_STATUS.AUTHENTICATED,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook for accessing auth context
 * @returns {AuthContextValue} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
