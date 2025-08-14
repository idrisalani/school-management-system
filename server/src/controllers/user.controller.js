// server/src/controllers/user.controller.js
import { query } from "../config/database.js";
import { validateEmail } from "../utils/validators.js";
import { createAuditLog } from "../services/audit.service.js";
import EmailService from "../services/email.service.js";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";

class UserController {
  /**
   * Get all users with filtering and pagination
   */
  async getUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        search,
        sortBy = "created_at",
        sortOrder = "desc",
      } = req.query;

      let whereClause = "WHERE 1=1";
      const queryParams = [];
      let paramCount = 0;

      // Build WHERE clause
      if (role) {
        paramCount++;
        whereClause += ` AND role = $${paramCount}`;
        queryParams.push(role);
      }

      if (search) {
        paramCount++;
        whereClause += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }

      // Calculate offset
      const offset = (page - 1) * limit;

      // Get users
      const usersQuery = `
        SELECT id, name, email, role, phone, address, created_at, updated_at
        FROM users 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(parseInt(limit), offset);

      const usersResult = await query(usersQuery, queryParams);

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await query(
        countQuery,
        queryParams.slice(0, paramCount)
      );
      const total = parseInt(countResult.rows[0].count);

      logger.info("Users retrieved successfully", {
        count: usersResult.rows.length,
        total,
        page,
        limit,
      });

      res.json({
        users: usersResult.rows,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      });
    } catch (error) {
      logger.error("Failed to retrieve users", { error });
      next(ApiError.internal("Failed to retrieve users"));
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const userQuery = `
        SELECT u.id, u.name, u.email, u.role, u.phone, u.address, u.created_at, u.updated_at,
               COALESCE(
                 json_agg(
                   DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code)
                 ) FILTER (WHERE c.id IS NOT NULL), 
                 '[]'
               ) as classes
        FROM users u
        LEFT JOIN enrollments e ON u.id = e.student_id
        LEFT JOIN classes c ON e.class_id = c.id
        WHERE u.id = $1
        GROUP BY u.id, u.name, u.email, u.role, u.phone, u.address, u.created_at, u.updated_at
      `;

      const result = await query(userQuery, [id]);

      if (result.rows.length === 0) {
        throw ApiError.notFound("User not found");
      }

      logger.info("User retrieved successfully", { userId: id });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error("Failed to retrieve user", { error, userId: req.params.id });
      next(
        error.statusCode ? error : ApiError.internal("Failed to retrieve user")
      );
    }
  }

  /**
   * Create new user
   */
  async createUser(req, res, next) {
    try {
      const { email, password, name, role, phone, address } = req.body;

      // Validate email
      if (!validateEmail(email)) {
        throw ApiError.badRequest("Invalid email format");
      }

      // Check if user exists
      const existingUserQuery = "SELECT id FROM users WHERE email = $1";
      const existingResult = await query(existingUserQuery, [email]);

      if (existingResult.rows.length > 0) {
        throw ApiError.conflict("User already exists");
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const insertQuery = `
        INSERT INTO users (email, password, name, role, phone, address)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, role, phone, address, created_at, updated_at
      `;

      const result = await query(insertQuery, [
        email,
        hashedPassword,
        name,
        role,
        phone || null,
        address || null,
      ]);

      const user = result.rows[0];

      // Send welcome email
      try {
        await EmailService.sendEmail({
          to: email,
          subject: "Welcome to School Management System",
          html: `
            <h2>Welcome ${name}!</h2>
            <p>Your account has been created successfully.</p>
            <p>Please use your email and password to login.</p>
          `,
        });
      } catch (emailError) {
        logger.error("Failed to send welcome email", {
          error: emailError,
          userEmail: email,
        });
      }

      // Create audit log
      await createAuditLog({
        action: "USER_CREATED",
        userId: req.user.id,
        details: `Created new user: ${email}`,
      });

      logger.info("User created successfully", { userEmail: email });

      res.status(201).json(user);
    } catch (error) {
      logger.error("Failed to create user", { error });
      next(
        error.statusCode ? error : ApiError.internal("Failed to create user")
      );
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, phone, address, role } = req.body;

      // Check if user exists
      const checkQuery = "SELECT id, email FROM users WHERE id = $1";
      const checkResult = await query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        throw ApiError.notFound("User not found");
      }

      // Update user
      const updateQuery = `
        UPDATE users 
        SET name = COALESCE($2, name),
            phone = COALESCE($3, phone),
            address = COALESCE($4, address),
            role = COALESCE($5, role),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, role, phone, address, created_at, updated_at
      `;

      const result = await query(updateQuery, [id, name, phone, address, role]);
      const user = result.rows[0];

      // Create audit log
      await createAuditLog({
        action: "USER_UPDATED",
        userId: req.user.id,
        details: `Updated user: ${user.email}`,
      });

      logger.info("User updated successfully", { userId: id });

      res.json(user);
    } catch (error) {
      logger.error("Failed to update user", { error, userId: req.params.id });
      next(
        error.statusCode ? error : ApiError.internal("Failed to update user")
      );
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // Check if user exists
      const checkQuery = "SELECT email FROM users WHERE id = $1";
      const checkResult = await query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      const userEmail = checkResult.rows[0].email;

      // Create audit log before deletion
      await createAuditLog({
        action: "USER_DELETED",
        userId: req.user.id,
        details: `Deleted user: ${userEmail}`,
      });

      // Delete user
      const deleteQuery = "DELETE FROM users WHERE id = $1";
      await query(deleteQuery, [id]);

      res.json({
        message: "User deleted successfully",
      });
    } catch (error) {
      logger.error("Delete user error:", error);
      next(ApiError.internal("Failed to delete user"));
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, phone, address } = req.body;

      const updateQuery = `
        UPDATE users 
        SET name = COALESCE($2, name),
            phone = COALESCE($3, phone),
            address = COALESCE($4, address),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, role, phone, address, created_at, updated_at
      `;

      const result = await query(updateQuery, [userId, name, phone, address]);

      if (result.rows.length === 0) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      // Create audit log
      await createAuditLog({
        action: "PROFILE_UPDATED",
        userId: req.user.id,
        details: "Updated profile information",
      });

      res.json(result.rows[0]);
    } catch (error) {
      logger.error("Update profile error:", error);
      next(ApiError.internal("Failed to update profile"));
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get current password
      const userQuery = "SELECT password FROM users WHERE id = $1";
      const userResult = await query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      // Verify current password
      const isMatch = await bcrypt.compare(
        currentPassword,
        userResult.rows[0].password
      );
      if (!isMatch) {
        res.status(401).json({
          message: "Current password is incorrect",
        });
        return;
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      const updateQuery = `
        UPDATE users 
        SET password = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await query(updateQuery, [userId, hashedPassword]);

      // Create audit log
      await createAuditLog({
        action: "PASSWORD_CHANGED",
        userId: req.user.id,
        details: "Changed password",
      });

      res.json({
        message: "Password changed successfully",
      });
    } catch (error) {
      logger.error("Change password error:", error);
      next(ApiError.internal("Failed to change password"));
    }
  }

  /**
   * Update username
   */
  async updateUsername(req, res, next) {
    try {
      const { username } = req.body;
      const userId = req.user.id;

      // Validate username
      if (!username || username.trim().length < 3) {
        res
          .status(400)
          .json({ message: "Username must be at least 3 characters" });
        return;
      }

      // Check if username exists (if username column exists)
      try {
        const existingQuery =
          "SELECT id FROM users WHERE username = $1 AND id != $2";
        const existingResult = await query(existingQuery, [username, userId]);

        if (existingResult.rows.length > 0) {
          res.status(400).json({ message: "Username already taken" });
          return;
        }

        // Update username
        const updateQuery = `
          UPDATE users 
          SET username = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING username
        `;
        const result = await query(updateQuery, [userId, username]);

        res.json({
          message: "Username updated successfully",
          username: result.rows[0]?.username || username,
        });
      } catch (error) {
        // If username column doesn't exist, handle gracefully
        logger.warn("Username field may not exist in User table", error);
        res.status(400).json({ message: "Username feature not available" });
      }
    } catch (error) {
      logger.error("Username update failed:", error);
      next(ApiError.internal("Failed to update username"));
    }
  }

  /**
   * Link parent to student
   */
  async linkParentStudent(req, res, next) {
    try {
      const { parentId, studentId } = req.body;

      // Validate input
      if (!parentId || !studentId) {
        res.status(400).json({
          message: "Parent ID and Student ID are required",
        });
        return;
      }

      // Verify both users exist and have correct roles
      const usersQuery = `
        SELECT id, role, email, name
        FROM users 
        WHERE id = $1 OR id = $2
      `;

      const usersResult = await query(usersQuery, [parentId, studentId]);

      if (usersResult.rows.length !== 2) {
        res.status(404).json({
          message: "Parent or student not found",
        });
        return;
      }

      const parent = usersResult.rows.find((user) => user.id == parentId);
      const student = usersResult.rows.find((user) => user.id == studentId);

      if (!parent || !student) {
        res.status(404).json({
          message: "Parent or student not found",
        });
        return;
      }

      // Verify roles
      if (parent.role !== "parent") {
        res.status(400).json({
          message: "User with parent ID must have 'parent' role",
        });
        return;
      }

      if (student.role !== "student") {
        res.status(400).json({
          message: "User with student ID must have 'student' role",
        });
        return;
      }

      // Check if relationship already exists
      const existingQuery = `
        SELECT id FROM parent_student_relationships 
        WHERE parent_id = $1 AND student_id = $2
      `;

      const existingResult = await query(existingQuery, [parentId, studentId]);

      if (existingResult.rows.length > 0) {
        res.status(400).json({
          message: "Parent-student relationship already exists",
        });
        return;
      }

      // Create the relationship
      const insertQuery = `
        INSERT INTO parent_student_relationships (parent_id, student_id, created_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        RETURNING id, created_at
      `;

      const relationshipResult = await query(insertQuery, [
        parentId,
        studentId,
      ]);

      // Create audit log
      await createAuditLog({
        action: "PARENT_STUDENT_LINKED",
        userId: req.user.id,
        details: `Linked parent ${parent.email} to student ${student.email}`,
      });

      logger.info("Parent-student relationship created", {
        parentId,
        studentId,
        relationshipId: relationshipResult.rows[0].id,
      });

      res.json({
        message: "Parent-student relationship created successfully",
        relationship: {
          id: relationshipResult.rows[0].id,
          parent: {
            id: parent.id,
            name: parent.name,
            email: parent.email,
          },
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
          },
          createdAt: relationshipResult.rows[0].created_at,
        },
      });
    } catch (error) {
      logger.error("Link parent-student error:", error);
      next(ApiError.internal("Failed to link parent and student"));
    }
  }
}

export default new UserController();
