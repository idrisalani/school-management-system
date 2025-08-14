// @ts-nocheck

// server/src/models/payment.model.js - PostgreSQL Payment Model
import { query } from "../config/database";
import withTransaction from "../config/database";

/**
 * PostgreSQL Payment Model
 */
class Payment {
  /**
   * Find payment by ID
   * @param {string} id - Payment ID
   * @returns {Object|null} Payment object or null
   */
  static async findById(id) {
    const result = await query(
      `
      SELECT p.*, u.first_name || ' ' || u.last_name as student_name,
             u.username as student_username, u.email as student_email
      FROM payments p
      LEFT JOIN users u ON p.student_id = u.id
      WHERE p.id = $1
    `,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create new payment
   * @param {Object} paymentData - Payment data
   * @returns {Object} Created payment
   */
  static async create(paymentData) {
    const {
      studentId,
      amount,
      currency = "USD",
      paymentType = "tuition",
      paymentMethod = null,
      transactionId = null,
      status = "pending",
      dueDate = null,
      paidDate = null,
      description = null,
      academicYear = "2024-2025",
      semester = "Fall",
    } = paymentData;

    const result = await query(
      `
      INSERT INTO payments (
        student_id, amount, currency, payment_type, payment_method,
        transaction_id, status, due_date, paid_date, description,
        academic_year, semester, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `,
      [
        studentId,
        amount,
        currency,
        paymentType,
        paymentMethod,
        transactionId,
        status,
        dueDate,
        paidDate,
        description,
        academicYear,
        semester,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update payment by ID
   * @param {string} id - Payment ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated payment
   */
  static async findByIdAndUpdate(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Handle status change to completed
    if (updateData.status === "completed" && !updateData.paidDate) {
      updateData.paidDate = new Date();
    }

    Object.keys(updateData).forEach((key) => {
      const dbField = this.camelToSnake(key);
      fields.push(`${dbField} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `
      UPDATE payments 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete payment by ID
   * @param {string} id - Payment ID
   * @returns {boolean} Success status
   */
  static async findByIdAndDelete(id) {
    const result = await query(
      "DELETE FROM payments WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Find payments by student
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Array} Array of payments
   */
  static async findByStudent(studentId, options = {}) {
    const {
      status = null,
      paymentType = null,
      academicYear = null,
      semester = null,
      limit = 50,
    } = options;

    let whereClause = "WHERE p.student_id = $1";
    const params = [studentId];
    let paramCount = 2;

    if (status) {
      whereClause += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (paymentType) {
      whereClause += ` AND p.payment_type = $${paramCount}`;
      params.push(paymentType);
      paramCount++;
    }

    if (academicYear) {
      whereClause += ` AND p.academic_year = $${paramCount}`;
      params.push(academicYear);
      paramCount++;
    }

    if (semester) {
      whereClause += ` AND p.semester = $${paramCount}`;
      params.push(semester);
      paramCount++;
    }

    params.push(limit);
    const result = await query(
      `
      SELECT p.*
      FROM payments p
      ${whereClause}
      ORDER BY p.due_date DESC, p.created_at DESC
      LIMIT $${paramCount}
    `,
      params
    );

    return result.rows;
  }

  /**
   * Find all payments with pagination
   * @param {Object} options - Query options
   * @returns {Object} Payments with pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status = null,
      paymentType = null,
      academicYear = null,
      semester = null,
      search = null,
      sortBy = "due_date",
      sortOrder = "DESC",
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (paymentType) {
      whereClause += ` AND p.payment_type = $${paramCount}`;
      params.push(paymentType);
      paramCount++;
    }

    if (academicYear) {
      whereClause += ` AND p.academic_year = $${paramCount}`;
      params.push(academicYear);
      paramCount++;
    }

    if (semester) {
      whereClause += ` AND p.semester = $${paramCount}`;
      params.push(semester);
      paramCount++;
    }

    if (search) {
      whereClause += ` AND (
        u.first_name ILIKE $${paramCount} OR 
        u.last_name ILIKE $${paramCount} OR 
        u.username ILIKE $${paramCount} OR
        p.description ILIKE $${paramCount} OR
        p.transaction_id ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countResult = await query(
      `
      SELECT COUNT(*) as total
      FROM payments p
      LEFT JOIN users u ON p.student_id = u.id
      ${whereClause}
    `,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    // Get payments
    params.push(limit, offset);
    const validSortColumns = [
      "due_date",
      "paid_date",
      "amount",
      "status",
      "created_at",
    ];
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : "due_date";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const result = await query(
      `
      SELECT p.*, u.first_name || ' ' || u.last_name as student_name,
             u.username as student_username, u.email as student_email
      FROM payments p
      LEFT JOIN users u ON p.student_id = u.id
      ${whereClause}
      ORDER BY p.${orderBy} ${order}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `,
      params
    );

    return {
      payments: result.rows,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: result.rowCount,
        totalRecords: total,
      },
    };
  }

  /**
   * Get payment statistics
   * @param {Object} filters - Filter options
   * @returns {Object} Payment statistics
   */
  static async getStatistics(filters = {}) {
    const { academicYear = null, semester = null, studentId = null } = filters;

    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (academicYear) {
      whereClause += ` AND academic_year = $${paramCount}`;
      params.push(academicYear);
      paramCount++;
    }

    if (semester) {
      whereClause += ` AND semester = $${paramCount}`;
      params.push(semester);
      paramCount++;
    }

    if (studentId) {
      whereClause += ` AND student_id = $${paramCount}`;
      params.push(studentId);
      paramCount++;
    }

    const result = await query(
      `
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_payments,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        AVG(amount) as average_amount,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status = 'pending' THEN 1 END) as overdue_payments
      FROM payments
      ${whereClause}
    `,
      params
    );

    const stats = result.rows[0];
    return {
      totalPayments: parseInt(stats.total_payments),
      completedPayments: parseInt(stats.completed_payments),
      pendingPayments: parseInt(stats.pending_payments),
      failedPayments: parseInt(stats.failed_payments),
      refundedPayments: parseInt(stats.refunded_payments),
      totalAmount: parseFloat(stats.total_amount || 0),
      completedAmount: parseFloat(stats.completed_amount || 0),
      pendingAmount: parseFloat(stats.pending_amount || 0),
      averageAmount: parseFloat(stats.average_amount || 0),
      overduePayments: parseInt(stats.overdue_payments),
    };
  }

  /**
   * Get overdue payments
   * @param {Object} options - Query options
   * @returns {Array} Array of overdue payments
   */
  static async getOverduePayments(options = {}) {
    const { limit = 50 } = options;

    const result = await query(
      `
      SELECT p.*, u.first_name || ' ' || u.last_name as student_name,
             u.username as student_username, u.email as student_email
      FROM payments p
      LEFT JOIN users u ON p.student_id = u.id
      WHERE p.due_date < CURRENT_DATE 
        AND p.status = 'pending'
      ORDER BY p.due_date ASC
      LIMIT $1
    `,
      [limit]
    );

    return result.rows;
  }

  /**
   * Process payment
   * @param {string} paymentId - Payment ID
   * @param {Object} transactionData - Transaction data
   * @returns {Object} Updated payment
   */
  static async processPayment(paymentId, transactionData) {
    const {
      transactionId,
      paymentMethod,
      status = "completed",
    } = transactionData;

    return withTransaction(async (client) => {
      const result = await client.query(
        `
        UPDATE payments 
        SET transaction_id = $1, payment_method = $2, status = $3, 
            paid_date = NOW(), updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `,
        [transactionId, paymentMethod, status, paymentId]
      );

      return result.rows[0];
    });
  }

  /**
   * Bulk create payments
   * @param {Array} paymentsData - Array of payment data
   * @returns {Array} Array of created payments
   */
  static async bulkCreate(paymentsData) {
    return withTransaction(async (client) => {
      const results = [];

      for (const paymentData of paymentsData) {
        const {
          studentId,
          amount,
          currency = "USD",
          paymentType = "tuition",
          dueDate,
          description,
          academicYear = "2024-2025",
          semester = "Fall",
        } = paymentData;

        const result = await client.query(
          `
          INSERT INTO payments (
            student_id, amount, currency, payment_type, status, due_date,
            description, academic_year, semester, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, NOW(), NOW())
          RETURNING *
        `,
          [
            studentId,
            amount,
            currency,
            paymentType,
            dueDate,
            description,
            academicYear,
            semester,
          ]
        );

        results.push(result.rows[0]);
      }

      return results;
    });
  }

  /**
   * Get student payment summary
   * @param {string} studentId - Student ID
   * @param {string} academicYear - Academic year
   * @returns {Object} Payment summary
   */
  static async getStudentSummary(studentId, academicYear = null) {
    let whereClause = "WHERE student_id = $1";
    const params = [studentId];

    if (academicYear) {
      whereClause += " AND academic_year = $2";
      params.push(academicYear);
    }

    const result = await query(
      `
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as outstanding_amount,
        COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END) as overdue_count
      FROM payments
      ${whereClause}
    `,
      params
    );

    const summary = result.rows[0];
    return {
      totalPayments: parseInt(summary.total_payments),
      totalAmount: parseFloat(summary.total_amount || 0),
      paidAmount: parseFloat(summary.paid_amount || 0),
      outstandingAmount: parseFloat(summary.outstanding_amount || 0),
      overdueCount: parseInt(summary.overdue_count),
    };
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
   * Format payment object for API response
   * @param {Object} payment - Raw payment object from database
   * @returns {Object} Formatted payment object
   */
  static formatPayment(payment) {
    if (!payment) return null;

    return {
      id: payment.id,
      studentId: payment.student_id,
      studentName: payment.student_name,
      studentUsername: payment.student_username,
      studentEmail: payment.student_email,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      paymentType: payment.payment_type,
      paymentMethod: payment.payment_method,
      transactionId: payment.transaction_id,
      status: payment.status,
      dueDate: payment.due_date,
      paidDate: payment.paid_date,
      description: payment.description,
      academicYear: payment.academic_year,
      semester: payment.semester,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    };
  }
}

export default Payment;
