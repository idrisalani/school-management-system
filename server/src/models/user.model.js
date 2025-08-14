// @ts-nocheck

// server/src/models/user.model.js - PostgreSQL User Model
import { query, withTransaction } from "../config/database";
import bcrypt from "bcryptjs";

/**
 * PostgreSQL User Model
 * Replaces Mongoose User model with PostgreSQL queries
 */
class User {
  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null
   */
  static async findByEmail(email) {
    const result = await query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    return result.rows[0] || null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Object|null} User object or null
   */
  static async findByUsername(username) {
    const result = await query("SELECT * FROM users WHERE username = $1", [
      username.toLowerCase(),
    ]);
    return result.rows[0] || null;
  }

  /**
   * Find user by email or username
   * @param {string} identifier - Email or username
   * @returns {Object|null} User object or null
   */
  static async findByEmailOrUsername(identifier) {
    const result = await query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [identifier.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Object|null} User object or null
   */
  static async findById(id) {
    const result = await query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Object} Created user
   */
  static async create(userData) {
    const {
      username,
      firstName,
      lastName,
      email,
      passwordHash,
      role = "student",
      phone = null,
      dateOfBirth = null,
      address = null,
      emergencyContact = null,
      preferences = {
        theme: "light",
        language: "en",
        notifications: { email: true, sms: false, push: true },
      },
    } = userData;

    const result = await query(
      `
      INSERT INTO users (
        username, first_name, last_name, email, password_hash, role,
        phone, date_of_birth, address, emergency_contact, preferences,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `,
      [
        username,
        firstName,
        lastName,
        email.toLowerCase(),
        passwordHash,
        role,
        phone,
        dateOfBirth,
        address,
        emergencyContact,
        JSON.stringify(preferences),
      ]
    );

    return result.rows[0];
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated user
   */
  static async findByIdAndUpdate(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.keys(updateData).forEach((key) => {
      if (
        key === "preferences" ||
        key === "address" ||
        key === "emergencyContact"
      ) {
        fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
        values.push(JSON.stringify(updateData[key]));
      } else {
        fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
        values.push(updateData[key]);
      }
      paramCount++;
    });

    if (fields.length === 0) return null;

    values.push(id); // Add ID as last parameter
    const result = await query(
      `
      UPDATE users 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID
   * @returns {boolean} Success status
   */
  static async findByIdAndDelete(id) {
    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [
      id,
    ]);
    return result.rowCount > 0;
  }

  /**
   * Find users by role
   * @param {string} role - User role
   * @returns {Array} Array of users
   */
  static async findByRole(role) {
    const result = await query(
      "SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC",
      [role]
    );
    return result.rows;
  }

  /**
   * Find active users
   * @param {string} role - Optional role filter
   * @returns {Array} Array of active users
   */
  static async findActiveUsers(role = null) {
    const queryText = role
      ? "SELECT * FROM users WHERE status = $1 AND role = $2 ORDER BY created_at DESC"
      : "SELECT * FROM users WHERE status = $1 ORDER BY created_at DESC";

    const params = role ? ["active", role] : ["active"];
    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Find verified users
   * @returns {Array} Array of verified users
   */
  static async findVerifiedUsers() {
    const result = await query(
      "SELECT * FROM users WHERE is_verified = true AND status = $1 ORDER BY created_at DESC",
      ["active"]
    );
    return result.rows;
  }

  /**
   * Count users by role
   * @returns {Array} Array of role counts
   */
  static async countByRole() {
    const result = await query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE status != 'inactive'
      GROUP BY role
      ORDER BY role
    `);
    return result.rows;
  }

  /**
   * Get active students in class
   * @param {string} classId - Class ID
   * @returns {Array} Array of students
   */
  static async getActiveStudentsInClass(classId) {
    const result = await query(
      `
      SELECT u.*, c.name as class_name, c.grade_level
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      JOIN classes c ON e.class_id = c.id
      WHERE u.role = 'student' 
        AND u.status = 'active' 
        AND e.class_id = $1 
        AND e.status = 'active'
      ORDER BY u.last_name, u.first_name
    `,
      [classId]
    );
    return result.rows;
  }

  /**
   * Get teachers for class
   * @param {string} classId - Class ID
   * @returns {Array} Array of teachers
   */
  static async getTeachersForClass(classId) {
    const result = await query(
      `
      SELECT u.*, c.name as class_name, c.subject
      FROM users u
      JOIN classes c ON u.id = c.teacher_id
      WHERE u.role = 'teacher' 
        AND u.status = 'active' 
        AND c.id = $1
      ORDER BY u.last_name, u.first_name
    `,
      [classId]
    );
    return result.rows;
  }

  /**
   * Verify password
   * @param {string} candidatePassword - Password to verify
   * @param {string} hashedPassword - Hashed password from database
   * @returns {boolean} Password match result
   */
  static async correctPassword(candidatePassword, hashedPassword) {
    if (!candidatePassword || !hashedPassword) return false;
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  /**
   * Update last login
   * @param {string} userId - User ID
   * @returns {Object|null} Updated user
   */
  static async updateLastLogin(userId) {
    const result = await query(
      `
      UPDATE users 
      SET last_login_at = NOW(), login_attempts = 0, locked_until = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Increment login attempts
   * @param {string} userId - User ID
   * @returns {Object|null} Updated user
   */
  static async incrementLoginAttempts(userId) {
    const result = await query(
      `
      UPDATE users 
      SET login_attempts = COALESCE(login_attempts, 0) + 1,
          locked_until = CASE 
            WHEN COALESCE(login_attempts, 0) + 1 >= 5 THEN NOW() + INTERVAL '2 hours'
            ELSE locked_until
          END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Reset login attempts
   * @param {string} userId - User ID
   * @returns {Object|null} Updated user
   */
  static async resetLoginAttempts(userId) {
    const result = await query(
      `
      UPDATE users 
      SET login_attempts = 0, locked_until = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Check if account is locked
   * @param {Object} user - User object
   * @returns {boolean} Lock status
   */
  static isLocked(user) {
    return user.locked_until && new Date(user.locked_until) > new Date();
  }

  /**
   * Search users
   * @param {Object} searchParams - Search parameters
   * @returns {Array} Array of users
   */
  static async search(searchParams) {
    const {
      query: searchQuery,
      role,
      status,
      limit = 50,
      offset = 0,
    } = searchParams;

    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (searchQuery) {
      whereClause += ` AND (
        first_name ILIKE $${paramCount} OR 
        last_name ILIKE $${paramCount} OR 
        username ILIKE $${paramCount} OR 
        email ILIKE $${paramCount}
      )`;
      params.push(`%${searchQuery}%`);
      paramCount++;
    }

    if (role) {
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    whereClause += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${
      paramCount + 1
    }`;
    params.push(limit, offset);

    const result = await query(
      `
      SELECT id, username, first_name, last_name, email, role, status, 
             is_verified, last_login_at, created_at
      FROM users 
      ${whereClause}
    `,
      params
    );

    return result.rows;
  }

  /**
   * Convert camelCase to snake_case
   * @param {string} str - String to convert
   * @returns {string} Converted string
   */
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case to camelCase
   * @param {string} str - String to convert
   * @returns {string} Converted string
   */
  static snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Format user object for API response
   * @param {Object} user - Raw user object from database
   * @returns {Object} Formatted user object
   */
  static formatUser(user) {
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: user.is_verified,
      phone: user.phone,
      dateOfBirth: user.date_of_birth,
      address: user.address,
      emergencyContact: user.emergency_contact,
      preferences: user.preferences,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}

export default User;
