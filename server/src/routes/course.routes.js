// src/routes/course.routes.js
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// Course routes
router.get("/", authenticate(), async (req, res) => {
  res.status(501).json({ message: "Get all courses - Not implemented" });
});

router.get("/:id", authenticate(), async (req, res) => {
  res.status(501).json({ message: "Get course by ID - Not implemented" });
});

router.post(
  "/",
  authenticate(),
  authorize(["admin", "teacher"]),
  async (req, res) => {
    res.status(501).json({ message: "Create course - Not implemented" });
  }
);

router.put(
  "/:id",
  authenticate(),
  authorize(["admin", "teacher"]),
  async (req, res) => {
    res.status(501).json({ message: "Update course - Not implemented" });
  }
);

router.delete(
  "/:id",
  authenticate(),
  authorize(["admin"]),
  async (req, res) => {
    res.status(501).json({ message: "Delete course - Not implemented" });
  }
);

export default router;
