// server/src/routes/test.routes.js - Add this new file
const express = require("express");
const router = express.Router();

// Simple insert test endpoint
router.post("/simple-insert", async (req, res) => {
  try {
    const { pool } = req.app.locals; // Get PostgreSQL connection

    // Test data
    const testData = {
      first_name: "Test",
      last_name: "User",
      email: `test${Date.now()}@example.com`,
      username: `test.user.${Date.now()}`,
      password_hash: "test_hash",
      role: "student",
    };

    // Insert test user
    const query = `
      INSERT INTO users (first_name, last_name, email, username, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, first_name, last_name, role, created_at
    `;

    const values = [
      testData.first_name,
      testData.last_name,
      testData.email,
      testData.username,
      testData.password_hash,
      testData.role,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Test user inserted successfully",
      user: result.rows[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test insert error:", error);
    res.status(500).json({
      success: false,
      message: "Test insert failed",
      error: error.message,
      details: error.detail || "No additional details",
    });
  }
});

module.exports = router;
