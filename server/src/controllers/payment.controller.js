// @ts-nocheck
// server/src/controllers/payment.controller.js - PostgreSQL Version
import { query, transaction } from "../config/database.js";
import db from "../config/database.js";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";

class PaymentController {
  /**
   * Get all payments with optional filtering
   */
  async getPayments(req, res, next) {
    try {
      const {
        student_id,
        status,
        payment_type,
        page = 1,
        limit = 10,
      } = req.query;

      let conditions = [];
      let values = [];
      let paramCount = 0;

      // Build WHERE conditions
      if (student_id) {
        paramCount++;
        conditions.push(`p.student_id = $${paramCount}`);
        values.push(student_id);
      }

      if (status) {
        paramCount++;
        conditions.push(`p.status = $${paramCount}`);
        values.push(status);
      }

      if (payment_type) {
        paramCount++;
        conditions.push(`p.payment_type = $${paramCount}`);
        values.push(payment_type);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Get payments with joined student information
      const offset = (page - 1) * limit;
      const paymentsQuery = `
        SELECT 
          p.id, p.student_id, p.amount, p.currency, p.payment_type,
          p.description, p.status, p.payment_method, p.transaction_id,
          p.reference_number, p.due_date, p.paid_at, p.created_at, p.updated_at,
          s.first_name as student_first_name, s.last_name as student_last_name,
          s.email as student_email, s.username as student_username
        FROM payments p
        LEFT JOIN users s ON p.student_id = s.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      values.push(parseInt(limit), offset);
      const result = await query(paymentsQuery, values);

      // Transform results to include populated data
      const payments = result.rows.map((row) => ({
        id: row.id,
        _id: row.id, // For backward compatibility
        student: row.student_id
          ? {
              _id: row.student_id,
              id: row.student_id,
              firstName: row.student_first_name,
              lastName: row.student_last_name,
              email: row.student_email,
              username: row.student_username,
            }
          : null,
        amount: parseFloat(row.amount),
        currency: row.currency,
        paymentType: row.payment_type,
        description: row.description,
        status: row.status,
        paymentMethod: row.payment_method,
        transactionId: row.transaction_id,
        referenceNumber: row.reference_number,
        dueDate: row.due_date,
        paidDate: row.paid_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      logger.info("Payments retrieved successfully", {
        count: payments.length,
      });
      res.json(payments);
    } catch (error) {
      logger.error("Failed to fetch payments", { error });
      next(new ApiError(500, "Failed to fetch payments"));
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(req, res, next) {
    try {
      const { id } = req.params;

      const paymentQuery = `
        SELECT 
          p.id, p.student_id, p.amount, p.currency, p.payment_type,
          p.description, p.status, p.payment_method, p.transaction_id,
          p.reference_number, p.due_date, p.paid_at, p.created_at, p.updated_at,
          s.first_name as student_first_name, s.last_name as student_last_name,
          s.email as student_email, s.username as student_username
        FROM payments p
        LEFT JOIN users s ON p.student_id = s.id
        WHERE p.id = $1
      `;

      const result = await query(paymentQuery, [id]);

      if (result.rows.length === 0) {
        throw new ApiError(404, "Payment not found");
      }

      const row = result.rows[0];
      const payment = {
        id: row.id,
        _id: row.id,
        student: row.student_id
          ? {
              _id: row.student_id,
              id: row.student_id,
              firstName: row.student_first_name,
              lastName: row.student_last_name,
              email: row.student_email,
              username: row.student_username,
            }
          : null,
        amount: parseFloat(row.amount),
        currency: row.currency,
        paymentType: row.payment_type,
        description: row.description,
        status: row.status,
        paymentMethod: row.payment_method,
        transactionId: row.transaction_id,
        referenceNumber: row.reference_number,
        dueDate: row.due_date,
        paidDate: row.paid_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      logger.info("Payment retrieved successfully", {
        paymentId: id,
      });
      res.json(payment);
    } catch (error) {
      logger.error("Failed to fetch payment", {
        error,
        paymentId: req.params.id,
      });
      next(
        error.statusCode ? error : new ApiError(500, "Failed to fetch payment")
      );
    }
  }

  /**
   * Create new payment
   */
  async createPayment(req, res, next) {
    try {
      const {
        student_id,
        amount,
        currency = "USD",
        payment_type,
        description,
        payment_method,
        due_date,
      } = req.body;

      // Validate required fields
      if (!student_id || !amount || !payment_type) {
        throw new ApiError(
          400,
          "Student ID, amount, and payment type are required"
        );
      }

      // Check if student exists
      const studentExists = await db.exists("users", {
        id: student_id,
        role: "student",
      });
      if (!studentExists) {
        throw new ApiError(404, "Student not found");
      }

      const insertQuery = `
        INSERT INTO payments (
          student_id, amount, currency, payment_type, description,
          payment_method, due_date, status, created_at, updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
        RETURNING *
      `;

      const result = await query(insertQuery, [
        student_id,
        amount,
        currency,
        payment_type,
        description,
        payment_method,
        due_date,
        "pending",
      ]);

      const newPayment = result.rows[0];

      // Get the payment with populated student data
      const populatedPayment = await this.getPaymentWithPopulation(
        newPayment.id
      );

      logger.info("Payment created successfully", {
        paymentId: newPayment.id,
        amount: newPayment.amount,
        studentId: student_id,
      });

      res.status(201).json(populatedPayment);
    } catch (error) {
      logger.error("Failed to create payment", { error, payload: req.body });
      next(
        error.statusCode ? error : new ApiError(500, "Failed to create payment")
      );
    }
  }

  /**
   * Update payment
   */
  async updatePayment(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.reference_number; // Generated automatically

      // Check if payment exists
      const existsQuery = await query("SELECT id FROM payments WHERE id = $1", [
        id,
      ]);
      if (existsQuery.rows.length === 0) {
        throw new ApiError(404, "Payment not found");
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;

      const fieldMapping = {
        amount: "amount",
        currency: "currency",
        paymentType: "payment_type",
        description: "description",
        status: "status",
        paymentMethod: "payment_method",
        transactionId: "transaction_id",
        dueDate: "due_date",
      };

      Object.keys(updateData).forEach((key) => {
        const dbField = fieldMapping[key] || key;
        if (updateData[key] !== undefined) {
          paramCount++;
          updates.push(`${dbField} = $${paramCount}`);
          values.push(updateData[key]);
        }
      });

      if (updates.length === 0) {
        throw new ApiError(400, "No valid fields to update");
      }

      // Add updated_at
      paramCount++;
      updates.push(`updated_at = NOW()`);
      values.push(id);

      const updateQuery = `
        UPDATE payments 
        SET ${updates.join(", ")} 
        WHERE id = $${values.length} 
        RETURNING *
      `;

      const result = await query(updateQuery, values);
      const updatedPayment = result.rows[0];

      // Get the payment with populated data
      const populatedPayment = await this.getPaymentWithPopulation(
        updatedPayment.id
      );

      logger.info("Payment updated successfully", {
        paymentId: id,
        updates: Object.keys(updateData),
      });

      res.json(populatedPayment);
    } catch (error) {
      logger.error("Failed to update payment", {
        error,
        paymentId: req.params.id,
        updates: req.body,
      });
      next(
        error.statusCode ? error : new ApiError(500, "Failed to update payment")
      );
    }
  }

  /**
   * Delete payment
   */
  async deletePayment(req, res, next) {
    try {
      const { id } = req.params;

      // Get payment to check status
      const paymentQuery = await query(
        "SELECT id, status FROM payments WHERE id = $1",
        [id]
      );

      if (paymentQuery.rows.length === 0) {
        throw new ApiError(404, "Payment not found");
      }

      const payment = paymentQuery.rows[0];

      if (payment.status === "completed") {
        throw new ApiError(400, "Cannot delete completed payment");
      }

      // Delete payment
      await query("DELETE FROM payments WHERE id = $1", [id]);

      logger.info("Payment deleted successfully", { paymentId: id });
      res.status(204).end();
    } catch (error) {
      logger.error("Failed to delete payment", {
        error,
        paymentId: req.params.id,
      });
      next(
        error.statusCode ? error : new ApiError(500, "Failed to delete payment")
      );
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(req, res, next) {
    try {
      const { student_id, status, payment_type } = req.query;

      let conditions = [];
      let values = [];
      let paramCount = 0;

      // Build WHERE conditions
      if (student_id) {
        paramCount++;
        conditions.push(`student_id = $${paramCount}`);
        values.push(student_id);
      }

      if (status) {
        paramCount++;
        conditions.push(`status = $${paramCount}`);
        values.push(status);
      }

      if (payment_type) {
        paramCount++;
        conditions.push(`payment_type = $${paramCount}`);
        values.push(payment_type);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const statsQuery = `
        SELECT 
          COUNT(*) as total_payments,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments
        FROM payments
        ${whereClause}
      `;

      const result = await query(statsQuery, values);
      const stats = result.rows[0];

      const responseStats = {
        totalAmount: parseFloat(stats.total_amount || 0),
        paidAmount: parseFloat(stats.paid_amount || 0),
        pendingAmount: parseFloat(stats.pending_amount || 0),
        totalPayments: parseInt(stats.total_payments || 0),
        completedPayments: parseInt(stats.completed_payments || 0),
      };

      logger.info("Payment stats retrieved successfully", responseStats);
      res.json(responseStats);
    } catch (error) {
      logger.error("Failed to fetch payment stats", {
        error,
        query: req.query,
      });
      next(new ApiError(500, "Failed to fetch payment statistics"));
    }
  }

  /**
   * Mark payment as completed
   */
  async markAsCompleted(req, res, next) {
    try {
      const { id } = req.params;

      // Get payment with student info
      const paymentQuery = `
        SELECT 
          p.id, p.amount, p.payment_type, p.status, p.transaction_id,
          p.description, p.created_at,
          s.first_name, s.last_name
        FROM payments p
        LEFT JOIN users s ON p.student_id = s.id
        WHERE p.id = $1
      `;

      const result = await query(paymentQuery, [id]);

      if (result.rows.length === 0) {
        throw new ApiError(404, "Payment not found");
      }

      const payment = result.rows[0];

      if (payment.status === "completed") {
        throw new ApiError(400, "Payment is already completed");
      }

      // Update payment status
      const updateQuery = `
        UPDATE payments 
        SET status = 'completed', paid_at = NOW(), updated_at = NOW() 
        WHERE id = $1 
        RETURNING paid_at
      `;

      const updateResult = await query(updateQuery, [id]);
      const paidAt = updateResult.rows[0].paid_at;

      // Generate receipt
      const receipt = {
        receiptNo: payment.transaction_id || `REC-${Date.now()}`,
        studentName: `${payment.first_name} ${payment.last_name}`,
        amount: parseFloat(payment.amount),
        paymentDate: paidAt,
        type: payment.payment_type,
        description: payment.description,
        status: "completed",
      };

      logger.info("Payment marked as completed", {
        paymentId: id,
        receipt: receipt,
      });

      res.json(receipt);
    } catch (error) {
      logger.error("Failed to complete payment", {
        error,
        paymentId: req.params.id,
      });
      next(
        error.statusCode
          ? error
          : new ApiError(500, "Failed to complete payment")
      );
    }
  }

  /**
   * Get payments by student ID
   */
  async getPaymentsByStudent(req, res, next) {
    try {
      const { studentId } = req.params;

      const paymentsQuery = `
        SELECT 
          p.id, p.student_id, p.amount, p.currency, p.payment_type,
          p.description, p.status, p.payment_method, p.transaction_id,
          p.reference_number, p.due_date, p.paid_at, p.created_at, p.updated_at,
          s.first_name as student_first_name, s.last_name as student_last_name,
          s.email as student_email
        FROM payments p
        LEFT JOIN users s ON p.student_id = s.id
        WHERE p.student_id = $1
        ORDER BY p.created_at DESC
      `;

      const result = await query(paymentsQuery, [studentId]);

      const payments = result.rows.map((row) => ({
        id: row.id,
        _id: row.id,
        student: {
          _id: row.student_id,
          firstName: row.student_first_name,
          lastName: row.student_last_name,
          email: row.student_email,
        },
        amount: parseFloat(row.amount),
        currency: row.currency,
        paymentType: row.payment_type,
        description: row.description,
        status: row.status,
        paymentMethod: row.payment_method,
        transactionId: row.transaction_id,
        referenceNumber: row.reference_number,
        dueDate: row.due_date,
        paidDate: row.paid_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      logger.info("Student payments retrieved successfully", {
        studentId: studentId,
        count: payments.length,
      });

      res.json(payments);
    } catch (error) {
      logger.error("Failed to fetch student payments", {
        error,
        studentId: req.params.studentId,
      });
      next(new ApiError(500, "Failed to fetch student payments"));
    }
  }

  /**
   * Helper method to get payment with populated relationships
   * @private
   */
  async getPaymentWithPopulation(paymentId) {
    const paymentQuery = `
      SELECT 
        p.id, p.student_id, p.amount, p.currency, p.payment_type,
        p.description, p.status, p.payment_method, p.transaction_id,
        p.reference_number, p.due_date, p.paid_at, p.created_at, p.updated_at,
        s.first_name as student_first_name, s.last_name as student_last_name,
        s.email as student_email
      FROM payments p
      LEFT JOIN users s ON p.student_id = s.id
      WHERE p.id = $1
    `;

    const result = await query(paymentQuery, [paymentId]);
    const row = result.rows[0];

    return {
      id: row.id,
      _id: row.id,
      student: row.student_id
        ? {
            _id: row.student_id,
            firstName: row.student_first_name,
            lastName: row.student_last_name,
            email: row.student_email,
          }
        : null,
      amount: parseFloat(row.amount),
      currency: row.currency,
      paymentType: row.payment_type,
      description: row.description,
      status: row.status,
      paymentMethod: row.payment_method,
      transactionId: row.transaction_id,
      referenceNumber: row.reference_number,
      dueDate: row.due_date,
      paidDate: row.paid_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new PaymentController();
