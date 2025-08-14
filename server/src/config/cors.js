// server/src/config/cors.js
const cors = require("cors");

const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 600, // 10 minutes
  exposedHeaders: ["Content-Disposition"], // For file downloads
};

module.exports = cors(corsOptions);
