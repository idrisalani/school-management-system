// @ts-nocheck
// server/src/routes/activities.routes.js
import express from "express";
import pkg from "pg";
import { authenticate } from "../middleware/auth.middleware.js";

const { Pool } = pkg;
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Create middleware instance
const authMiddleware = authenticate();

// Get recent activities/announcements
router.get("/recent", authMiddleware(), async (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit)) || 5;

    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.title,
        a.content,
        a.type,
        a.created_at,
        u.first_name,
        u.last_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_published = true
      ORDER BY a.created_at DESC
      LIMIT $1
    `,
      [limit]
    );

    const activities = result.rows.map((activity) => ({
      id: activity.id,
      user:
        activity.first_name && activity.last_name
          ? `${activity.first_name} ${activity.last_name}`.trim()
          : "System",
      action: activity.title,
      subject: activity.type,
      time: new Date(activity.created_at).toLocaleString(),
      type: activity.type,
    }));

    res.json(activities);
  } catch (error) {
    console.error("Recent activities error:", error);
    res.json([]);
  }
});

// Get activities by type
router.get("/by-type/:type", authMiddleware(), async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(String(req.query.limit)) || 10;

    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.title,
        a.content,
        a.type,
        a.created_at,
        u.first_name,
        u.last_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_published = true AND a.type = $1
      ORDER BY a.created_at DESC
      LIMIT $2
    `,
      [type, limit]
    );

    const activities = result.rows.map((activity) => ({
      id: activity.id,
      user:
        activity.first_name && activity.last_name
          ? `${activity.first_name} ${activity.last_name}`.trim()
          : "System",
      action: activity.title,
      subject: activity.type,
      time: new Date(activity.created_at).toLocaleString(),
      type: activity.type,
      content: activity.content,
    }));

    res.json(activities);
  } catch (error) {
    console.error("Activities by type error:", error);
    res.json([]);
  }
});

// Get system logs/audit trail
router.get("/system-logs", authMiddleware(), async (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit)) || 10;

    // Check if audits table exists, if not return empty array
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audits'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return res.json([]);
    }

    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.action,
        a.table_name,
        a.created_at,
        u.first_name,
        u.last_name
      FROM audits a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT $1
    `,
      [limit]
    );

    const logs = result.rows.map((log) => ({
      id: log.id,
      user:
        log.first_name && log.last_name ? `${log.first_name} ${log.last_name}`.trim() : "System",
      action: log.action,
      subject: log.table_name,
      time: new Date(log.created_at).toLocaleString(),
      type: "system",
    }));

    res.json(logs);
  } catch (error) {
    console.error("System logs error:", error);
    res.json([]);
  }
});

// Create a new announcement/activity
router.post("/", authMiddleware(), async (req, res) => {
  try {
    const { title, content, type, target_audience } = req.body;
    const author_id = req.user.id; // Assuming auth middleware adds user to request

    const result = await pool.query(
      `
      INSERT INTO announcements (title, content, type, author_id, target_audience, is_published, published_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW(), NOW())
      RETURNING *
    `,
      [title, content, type, author_id, target_audience]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ message: "Error creating announcement" });
  }
});

// Update an announcement
router.put("/:id", authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, target_audience, is_published } = req.body;

    const result = await pool.query(
      `
      UPDATE announcements 
      SET title = $1, content = $2, type = $3, target_audience = $4, is_published = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `,
      [title, content, type, target_audience, is_published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update announcement error:", error);
    res.status(500).json({ message: "Error updating announcement" });
  }
});

// Delete an announcement
router.delete("/:id", authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM announcements WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({ message: "Error deleting announcement" });
  }
});

// Get announcement by ID
router.get("/:id", authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        a.*,
        u.first_name,
        u.last_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const announcement = result.rows[0];
    announcement.author_name =
      announcement.first_name && announcement.last_name
        ? `${announcement.first_name} ${announcement.last_name}`.trim()
        : "System";

    res.json(announcement);
  } catch (error) {
    console.error("Get announcement error:", error);
    res.status(500).json({ message: "Error fetching announcement" });
  }
});

export default router;
