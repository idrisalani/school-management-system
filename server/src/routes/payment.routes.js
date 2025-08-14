// src/routes/payment.routes.js
import express from "express";
import paymentController from "../controllers/payment.controller.js";
import {
  authenticate,
  authorize,
  hasPermission,
} from "../middleware/auth.middleware.js";
import { validatePayment } from "../middleware/validation.middleware.js";
import { rateLimiter } from "../middleware/rate-limiter.middleware.js";

const router = express.Router();

// Apply authentication to all routes except webhook
const authenticateRoute = authenticate({ requireVerified: false });
router.use(authenticateRoute);

// Protected routes
// Get all payments
router.get(
  "/",
  authorize(["admin", "finance"]),
  hasPermission(["view_payments"]),
  paymentController.getPayments
);

// Get payment statistics
router.get(
  "/stats",
  authorize(["admin", "finance"]),
  hasPermission(["view_payments"]),
  paymentController.getPaymentStats
);

// Get specific payment
router.get(
  "/:id",
  hasPermission(["view_payments"]),
  paymentController.getPaymentById
);

// Create payment
router.post(
  "/",
  authorize(["admin", "finance"]),
  hasPermission(["manage_payments"]),
  validatePayment,
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  paymentController.createPayment
);

// Update payment
router.put(
  "/:id",
  authorize(["admin", "finance"]),
  hasPermission(["manage_payments"]),
  validatePayment,
  paymentController.updatePayment
);

// Delete payment
router.delete(
  "/:id",
  authorize(["admin"]),
  hasPermission(["manage_payments"]),
  paymentController.deletePayment
);

// Get student's payments
router.get(
  "/student/:studentId",
  hasPermission(["view_payments"]),
  paymentController.getPaymentsByStudent
);

// Mark payment as completed
router.post(
  "/:id/complete",
  authorize(["admin", "finance"]),
  hasPermission(["manage_payments"]),
  paymentController.markAsCompleted
);

export default router;
