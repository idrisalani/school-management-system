// server/debug-server.js - Minimal Debug Server
// @ts-nocheck
import express from "express";

const app = express();
const PORT = 5001; // Using different port

console.log("🔍 Starting debug server...");

app.use(express.json());

// Simple test routes
app.get("/", (req, res) => {
  console.log("📝 Root route accessed");
  res.json({
    message: "Debug server working!",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

app.get("/test", (req, res) => {
  console.log("📝 Test route accessed");
  res.json({
    message: "Test endpoint working!",
    success: true,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: err.message });
});

// Start server with detailed logging
const server = app.listen(PORT, () => {
  console.log(`✅ Debug server listening on port ${PORT}`);
  console.log(`🌐 Test URL: http://localhost:${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/test`);
});

// Server error handling
server.on("error", (error) => {
  console.error("❌ Server failed to start:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Try a different port.`);
  }
  process.exit(1);
});

server.on("listening", () => {
  console.log("🎉 Server successfully bound to port and is listening");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🔄 Shutting down debug server...");
  server.close(() => {
    console.log("✅ Debug server closed");
    process.exit(0);
  });
});

export default app;
