// @ts-nocheck
// server/src/services/user.service.js - NO Missing Fields Version
import bcrypt from "bcryptjs";
import { withRequestContext } from "../config/database.js";
import logger from "../utils/logger.js";

const userLogger = logger.child({ module: "user-service" });

// Helper function to safely convert to string
const toSafeString = (value, defaultValue = "") => {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
};

// Helper function to safely convert to number then string (for SQL params)
const toSafeNumberString = (value, defaultValue = 0) => {
  const num = Number(value);
  return String(isNaN(num) ? defaultValue : num);
};

export class UserService {
  constructor(db) {
    this.db = db;
  }

  // FIXED: Removed student_id, employee_id, department_id parameters
  async createUser({
    email,
    password,
    firstName,
    lastName,
    role = "student",
    phone,
    address,
  }) {
    try {
      // Check if user exists
      const existingUser = await this.db.query(
        "SELECT id FROM users WHERE email = $1",
        [toSafeString(email).toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }

      // Generate username
      const username = await this.generateUniqueUsername(firstName, lastName);

      // Hash password
      const hashedPassword = await bcrypt.hash(toSafeString(password), 12);

      // FIXED: Only use fields that exist in database schema
      const result = await this.db.query(
        `
        INSERT INTO users (
          email, password, username, name, first_name, last_name, 
          role, phone, address, status, is_verified, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', false, CURRENT_TIMESTAMP)
        RETURNING id, email, username, name, first_name, last_name, role, phone, created_at
      `,
        [
          toSafeString(email).toLowerCase(),
          hashedPassword,
          toSafeString(username),
          `${toSafeString(firstName)} ${toSafeString(lastName)}`, // Computed name
          toSafeString(firstName),
          toSafeString(lastName),
          toSafeString(role),
          phone ? toSafeString(phone) : null,
          address ? toSafeString(address) : null,
        ]
      );

      const user = result.rows[0];

      userLogger.info("User created successfully", {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return user;
    } catch (error) {
      userLogger.error("Failed to create user", {
        error: error.message,
        email: toSafeString(email),
      });
      throw error;
    }
  }

  async generateUniqueUsername(firstName, lastName) {
    const baseUsername = `${toSafeString(firstName)}.${toSafeString(lastName)}`
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "");
    let username = baseUsername;
    let counter = 1;

    while (await this.usernameExists(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }

  async usernameExists(username) {
    const result = await this.db.query(
      "SELECT 1 FROM users WHERE username = $1",
      [toSafeString(username)]
    );
    return result.rows.length > 0;
  }

  async getUserById(userId) {
    // FIXED: Only select fields that exist in database
    const result = await this.db.query(
      `
      SELECT 
        id, email, username, name, first_name, last_name,
        role, phone, address, status, is_verified, 
        last_login, created_at, updated_at
      FROM users 
      WHERE id = $1 AND status != 'inactive'
    `,
      [toSafeString(userId)]
    );

    if (result.rows.length === 0) {
      throw new Error("USER_NOT_FOUND");
    }

    return result.rows[0];
  }

  async getUserByEmail(email) {
    const result = await this.db.query(
      `
      SELECT 
        id, email, username, name, first_name, last_name,
        role, phone, address, status, password, 
        created_at, updated_at
      FROM users 
      WHERE email = $1 AND status != 'inactive'
    `,
      [toSafeString(email).toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error("USER_NOT_FOUND");
    }

    return result.rows[0];
  }

  async updateUser(userId, updates) {
    const fieldMapping = {
      firstName: "first_name",
      lastName: "last_name",
      first_name: "first_name",
      last_name: "last_name",
      phone: "phone",
      address: "address",
    };

    const setClause = [];
    const values = [];
    let paramCount = 0;

    for (const [field, value] of Object.entries(updates)) {
      const dbField = fieldMapping[field] || field;
      if (fieldMapping[field] && value !== undefined) {
        paramCount++;
        setClause.push(`${dbField} = $${paramCount}`);
        values.push(toSafeString(value));
      }
    }

    // Update computed name field if first_name or last_name changed
    if (
      updates.firstName ||
      updates.lastName ||
      updates.first_name ||
      updates.last_name
    ) {
      paramCount++;
      setClause.push(`name = CONCAT(first_name, ' ', last_name)`);
    }

    if (setClause.length === 0) {
      throw new Error("NO_VALID_FIELDS_TO_UPDATE");
    }

    paramCount++;
    values.push(toSafeString(userId));

    const result = await this.db.query(
      `
      UPDATE users SET ${setClause.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND status != 'inactive'
      RETURNING id, email, username, name, first_name, last_name, 
                role, phone, address, updated_at
    `,
      values
    );

    if (result.rows.length === 0) {
      throw new Error("USER_NOT_FOUND");
    }

    userLogger.info("User updated successfully", {
      userId: toSafeString(userId),
      fields: Object.keys(updates),
    });
    return result.rows[0];
  }

  async updateLastLogin(userId) {
    await this.db.query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [toSafeString(userId)]
    );
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await this.db.query(
      "SELECT password FROM users WHERE id = $1 AND status != 'inactive'",
      [toSafeString(userId)]
    );

    if (user.rows.length === 0) {
      throw new Error("USER_NOT_FOUND");
    }

    // Verify old password
    const isValid = await bcrypt.compare(
      toSafeString(oldPassword),
      user.rows[0].password
    );
    if (!isValid) {
      throw new Error("INVALID_OLD_PASSWORD");
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(toSafeString(newPassword), 12);

    // Update password
    await this.db.query(
      `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [hashedNewPassword, toSafeString(userId)]
    );

    userLogger.info("Password changed successfully", {
      userId: toSafeString(userId),
    });
  }

  async searchUsers(query = "", role = null, limit = 20, offset = 0) {
    const safeQuery = toSafeString(query);
    const safeRole = role ? toSafeString(role) : null;
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const safeOffset = Math.max(0, Number(offset) || 0);

    let sql = `
      SELECT 
        id, email, username, name, first_name, last_name, 
        role, phone, status, is_verified, created_at
      FROM users 
      WHERE status != 'inactive' AND (
        name ILIKE $1 OR 
        email ILIKE $1 OR 
        username ILIKE $1 OR
        CONCAT(first_name, ' ', last_name) ILIKE $1
      )
    `;

    const params = [`%${safeQuery}%`];
    let paramCount = 1;

    if (safeRole) {
      paramCount++;
      sql += ` AND role = $${paramCount}`;
      params.push(safeRole);
    }

    paramCount++;
    sql += ` ORDER BY first_name, last_name LIMIT $${paramCount}`;
    params.push(toSafeNumberString(safeLimit));

    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(toSafeNumberString(safeOffset));

    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async getUserStats(userId) {
    const user = await this.getUserById(userId);

    if (user.role === "student") {
      return await this.getStudentStats(userId);
    } else if (user.role === "teacher") {
      return await this.getTeacherStats(userId);
    } else {
      return await this.getAdminStats();
    }
  }

  async getStudentStats(studentId) {
    const stats = await this.db.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM enrollments WHERE student_id = $1 AND status = 'active') as enrolled_classes,
        (SELECT COUNT(*) FROM assignments a 
         JOIN classes c ON a.class_id = c.id 
         JOIN enrollments e ON c.id = e.class_id 
         WHERE e.student_id = $1 AND a.status = 'active') as total_assignments,
        (SELECT COUNT(*) FROM grades WHERE student_id = $1) as graded_assignments,
        (SELECT COALESCE(AVG(percentage), 0) FROM grades WHERE student_id = $1) as average_grade,
        (SELECT COUNT(*) FROM attendance WHERE student_id = $1 AND status = 'present') as days_present,
        (SELECT COUNT(*) FROM attendance WHERE student_id = $1 AND status = 'absent') as days_absent
    `,
      [toSafeString(studentId)]
    );

    const result = stats.rows[0];
    const totalDays =
      parseInt(result.days_present) + parseInt(result.days_absent);
    const attendanceRate =
      totalDays > 0
        ? ((parseInt(result.days_present) / totalDays) * 100).toFixed(1)
        : 0;

    return {
      enrolled_classes: parseInt(result.enrolled_classes),
      total_assignments: parseInt(result.total_assignments),
      graded_assignments: parseInt(result.graded_assignments),
      average_grade: parseFloat(result.average_grade).toFixed(1),
      days_present: parseInt(result.days_present),
      days_absent: parseInt(result.days_absent),
      attendance_rate: parseFloat(attendanceRate),
    };
  }

  async getTeacherStats(teacherId) {
    const stats = await this.db.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM classes WHERE teacher_id = $1 AND status = 'active') as classes_teaching,
        (SELECT COUNT(DISTINCT e.student_id) FROM enrollments e 
         JOIN classes c ON e.class_id = c.id 
         WHERE c.teacher_id = $1 AND e.status = 'active') as total_students,
        (SELECT COUNT(*) FROM assignments WHERE teacher_id = $1 AND status = 'active') as assignments_created,
        (SELECT COUNT(*) FROM grades g 
         JOIN assignments a ON g.assignment_id = a.id 
         WHERE a.teacher_id = $1) as grades_given
    `,
      [toSafeString(teacherId)]
    );

    const result = stats.rows[0];
    return {
      classes_teaching: parseInt(result.classes_teaching),
      total_students: parseInt(result.total_students),
      assignments_created: parseInt(result.assignments_created),
      grades_given: parseInt(result.grades_given),
    };
  }

  async getAdminStats() {
    const stats = await this.db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student' AND status = 'active') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status = 'active') as total_teachers,
        (SELECT COUNT(*) FROM classes WHERE status = 'active') as total_classes,
        (SELECT COUNT(*) FROM assignments WHERE status = 'active') as total_assignments,
        (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as total_enrollments
    `);

    const result = stats.rows[0];
    return {
      total_students: parseInt(result.total_students),
      total_teachers: parseInt(result.total_teachers),
      total_classes: parseInt(result.total_classes),
      total_assignments: parseInt(result.total_assignments),
      total_enrollments: parseInt(result.total_enrollments),
    };
  }

  async deactivateUser(userId) {
    const result = await this.db.query(
      `
      UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND status != 'inactive'
      RETURNING id, email, username, name, first_name, last_name, status, updated_at
    `,
      [toSafeString(userId)]
    );

    if (result.rows.length === 0) {
      throw new Error("USER_NOT_FOUND");
    }

    userLogger.info("User deactivated", { userId: toSafeString(userId) });
    return result.rows[0];
  }
}

// Factory function for dependency injection
export const createUserService = (req) => {
  const db = withRequestContext(req);
  return new UserService(db);
};
