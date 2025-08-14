// @ts-nocheck
// client\src\services\user.service.js
import { useApiService } from "./api";

class UserService {
  constructor(api) {
    this.api = api;
  }

  /**
   * Retrieves a list of users with optional filtering
   * @param {object} params Query parameters for filtering users
   * @returns {Promise<object>} Paginated list of users
   */
  async getUsers(params = {}) {
    try {
      return await this.api.users.getAll(params);
    } catch (error) {
      throw new Error("Failed to fetch users: " + error.message);
    }
  }

  /**
   * Retrieves a specific user by ID
   * @param {string} userId User ID
   * @returns {Promise<object>} User data
   */
  async getUserById(userId) {
    try {
      return await this.api.users.getById(userId);
    } catch (error) {
      throw new Error("Failed to fetch user: " + error.message);
    }
  }

  /**
   * Creates a new user
   * @param {object} userData User data
   * @returns {Promise<object>} Created user data
   */
  async createUser(userData) {
    try {
      // Validate required fields
      const requiredFields = ["email", "name", "role"];
      requiredFields.forEach((field) => {
        if (!userData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      });

      return await this.api.users.create(userData);
    } catch (error) {
      throw new Error("Failed to create user: " + error.message);
    }
  }

  /**
   * Updates an existing user
   * @param {string} userId User ID
   * @param {object} userData Updated user data
   * @returns {Promise<object>} Updated user data
   */
  async updateUser(userId, userData) {
    try {
      return await this.api.users.update(userId, userData);
    } catch (error) {
      throw new Error("Failed to update user: " + error.message);
    }
  }

  /**
   * Deletes a user
   * @param {string} userId User ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      await this.api.users.delete(userId);
    } catch (error) {
      throw new Error("Failed to delete user: " + error.message);
    }
  }

  /**
   * Updates a user's role
   * @param {string} userId User ID
   * @param {string} roleId New role ID
   * @returns {Promise<object>} Updated user data
   */
  async updateUserRole(userId, roleId) {
    try {
      return await this.api.users.updateRole(userId, { roleId });
    } catch (error) {
      throw new Error("Failed to update user role: " + error.message);
    }
  }

  /**
   * Retrieves available roles
   * @returns {Promise<Array>} List of available roles
   */
  async getRoles() {
    try {
      return await this.api.users.getRoles();
    } catch (error) {
      throw new Error("Failed to fetch roles: " + error.message);
    }
  }

  /**
   * Retrieves teachers
   * @param {object} params Query parameters
   * @returns {Promise<Array>} List of teachers
   */
  async getTeachers(params = {}) {
    try {
      return await this.api.users.getAll({ ...params, role: "teacher" });
    } catch (error) {
      throw new Error("Failed to fetch teachers: " + error.message);
    }
  }

  /**
   * Retrieves students
   * @param {object} params Query parameters
   * @returns {Promise<Array>} List of students
   */
  async getStudents(params = {}) {
    try {
      return await this.api.users.getAll({ ...params, role: "student" });
    } catch (error) {
      throw new Error("Failed to fetch students: " + error.message);
    }
  }

  /**
   * Retrieves parents
   * @param {object} params Query parameters
   * @returns {Promise<Array>} List of parents
   */
  async getParents(params = {}) {
    try {
      return await this.api.users.getAll({ ...params, role: "parent" });
    } catch (error) {
      throw new Error("Failed to fetch parents: " + error.message);
    }
  }

  /**
   * Links a student to a parent
   * @param {string} parentId Parent ID
   * @param {string} studentId Student ID
   * @returns {Promise<object>} Updated parent data
   */
  async linkStudentToParent(parentId, studentId) {
    try {
      return await this.api.users.update(parentId, {
        linkedStudents: { add: [studentId] },
      });
    } catch (error) {
      throw new Error("Failed to link student to parent: " + error.message);
    }
  }

  /**
   * Unlinks a student from a parent
   * @param {string} parentId Parent ID
   * @param {string} studentId Student ID
   * @returns {Promise<object>} Updated parent data
   */
  async unlinkStudentFromParent(parentId, studentId) {
    try {
      return await this.api.users.update(parentId, {
        linkedStudents: { remove: [studentId] },
      });
    } catch (error) {
      throw new Error("Failed to unlink student from parent: " + error.message);
    }
  }

  /**
   * Bulk imports users from CSV
   * @param {File} file CSV file
   * @returns {Promise<object>} Import results
   */
  async bulkImportUsers(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      return await this.api.users.bulkImport(formData);
    } catch (error) {
      throw new Error("Failed to import users: " + error.message);
    }
  }

  /**
   * Exports users to CSV
   * @param {object} params Export parameters
   * @returns {Promise<Blob>} CSV file blob
   */
  async exportUsers(params = {}) {
    try {
      return await this.api.users.export(params);
    } catch (error) {
      throw new Error("Failed to export users: " + error.message);
    }
  }

  /**
   * Validates user data
   * @param {object} userData User data to validate
   * @returns {object} Validation results
   */
  validateUserData(userData) {
    const errors = {};

    // Email validation
    if (!userData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = "Invalid email format";
    }

    // Name validation
    if (!userData.name) {
      errors.name = "Name is required";
    } else if (userData.name.length < 2) {
      errors.name = "Name must be at least 2 characters long";
    }

    // Role validation
    if (!userData.role) {
      errors.role = "Role is required";
    }

    // Phone validation (if provided)
    if (userData.phone && !/^\+?[\d\s-]{10,}$/.test(userData.phone)) {
      errors.phone = "Invalid phone number format";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

// Hook to use the user service
export const useUserService = () => {
  const api = useApiService();
  return new UserService(api);
};

export default UserService;
