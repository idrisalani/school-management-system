// @ts-nocheck
// client\src\services\auth.service.js
import { jwtDecode } from "jwt-decode";
import { useApiService } from "./api";

class AuthService {
  constructor(api) {
    this.api = api;
    this.tokenKey = "auth_token";
    this.refreshTokenKey = "refresh_token";
  }

  /**
   * Handles user authentication
   * @param {string} email User's email
   * @param {string} password User's password
   * @returns {Promise<object>} User data
   */
  async login(email, password) {
    try {
      const response = await this.api.auth.login(email, password);
      this.setTokens(response.token, response.refreshToken);
      return this.getUserFromToken(response.token);
    } catch (error) {
      throw new Error("Authentication failed: " + error.message);
    }
  }

  /**
   * Handles user logout
   */
  async logout() {
    try {
      await this.api.auth.logout();
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Refreshes the authentication token
   * @returns {Promise<string>} New token
   */
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await this.api.auth.refresh();
      this.setTokens(response.token, response.refreshToken);
      return response.token;
    } catch (error) {
      this.clearTokens();
      throw new Error("Token refresh failed: " + error.message);
    }
  }

  /**
   * Verifies current authentication status
   * @returns {Promise<object>} User data if authenticated
   */
  async verifyAuth() {
    try {
      const token = this.getToken();
      if (!token) return null;

      // Check token expiration
      const tokenData = this.getUserFromToken(token);
      if (this.isTokenExpired(tokenData)) {
        await this.refreshToken();
      }

      const response = await this.api.auth.verify();
      return response.user;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  /**
   * Initiates password reset process
   * @param {string} email User's email
   */
  async requestPasswordReset(email) {
    await this.api.auth.requestPasswordReset(email);
  }

  /**
   * Completes password reset process
   * @param {string} token Reset token
   * @param {string} newPassword New password
   */
  async resetPassword(token, newPassword) {
    await this.api.auth.resetPassword(token, newPassword);
  }

  /**
   * Updates user profile
   * @param {string} userId User ID
   * @param {object} data Profile data
   */
  async updateProfile(userId, data) {
    await this.api.auth.updateProfile(userId, data);
  }

  /**
   * Retrieves current authentication token
   * @returns {string|null} Token
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Retrieves current refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Stores authentication tokens
   * @param {string} token Authentication token
   * @param {string} refreshToken Refresh token
   */
  setTokens(token, refreshToken) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  /**
   * Removes stored tokens
   */
  clearTokens() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Extracts user data from token
   * @param {string} token JWT token
   * @returns {object} Decoded user data
   */
  getUserFromToken(token) {
    try {
      return jwtDecode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Checks if a token is expired
   * @param {object} tokenData Decoded token data
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(tokenData) {
    if (!tokenData) return true;
    // Add 5-minute buffer for token expiration
    const bufferTime = 5 * 60 * 1000;
    return tokenData.exp * 1000 - bufferTime < Date.now();
  }

  /**
   * Validates password requirements
   * @param {string} password Password to validate
   * @returns {object} Validation result
   */
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const isValid =
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar;

    return {
      isValid,
      errors: {
        length: password.length < minLength,
        upperCase: !hasUpperCase,
        lowerCase: !hasLowerCase,
        number: !hasNumbers,
        specialChar: !hasSpecialChar,
      },
    };
  }

  /**
   * Checks if user has required permissions
   * @param {object} user User object
   * @param {string[]} requiredPermissions Required permissions
   * @returns {boolean} True if user has all required permissions
   */
  hasPermissions(user, requiredPermissions) {
    if (!user || !user.permissions) return false;
    return requiredPermissions.every((permission) =>
      user.permissions.includes(permission)
    );
  }

  /**
   * Checks if user has required role
   * @param {object} user User object
   * @param {string|string[]} roles Required role(s)
   * @returns {boolean} True if user has required role
   */
  hasRole(user, roles) {
    if (!user || !user.role) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }
}

// Hook to use the auth service
export const useAuthService = () => {
  const api = useApiService();
  return new AuthService(api);
};

export default AuthService;
