// src/routes/user.routes.js
import express from "express";
import userController from "../controllers/user.controller";
import {
  authenticate,
  authorize,
  hasPermission,
  isAdmin,
} from "../middleware/auth.middleware.js";
import {
  validateUser,
  validateProfileUpdate,
  validatePasswordChange,
} from "../middleware/validation.middleware.js";
import { rateLimiter } from "../middleware/rate-limiter.middleware.js";

const router = express.Router();

// Protected routes
router.use(authenticate());

// Admin routes
router.get("/", authorize(["admin"]), userController.getUsers);

router.post("/", isAdmin, validateUser, userController.createUser);

router.get("/:id", hasPermission(["view_users"]), userController.getUserById);

router.put("/:id", isAdmin, validateUser, userController.updateUser);

router.delete("/:id", isAdmin, userController.deleteUser);

// Profile routes
router.put("/profile", validateProfileUpdate, userController.updateProfile);

router.put(
  "/change-password",
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 5 }),
  validatePasswordChange,
  userController.changePassword
);

// Parent-student linking
router.post(
  "/link-parent-student",
  authorize(["admin"]),
  userController.linkParentStudent
);

//
router.put(
  "/update-username",
  authenticate({ requireVerified: true }),
  userController.updateUsername
);

export default router;
