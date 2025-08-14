// server/src/middleware/index.js
const cors = require("cors");
const jwt = require("jsonwebtoken");

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Ensure JWT secret is available
if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            status: "error",
            message: "Token expired",
          });
        }

        if (err.name === "JsonWebTokenError") {
          return res.status(403).json({
            status: "error",
            message: "Invalid token",
          });
        }

        return res.status(403).json({
          status: "error",
          message: "Token verification failed",
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during authentication",
    });
  }
};

// Role-based access control
const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          status: "error",
          message: "Access forbidden: Insufficient permissions",
        });
      }

      next();
    } catch (error) {
      console.error("Authorization middleware error:", error);
      return res.status(500).json({
        status: "error",
        message: "Internal server error during authorization",
      });
    }
  };
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: "Invalid ID format",
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      status: "error",
      message: "Duplicate entry",
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      status: "error",
      message: "File upload error",
      error: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

// Request logger
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${
        res.statusCode
      } - ${duration}ms - ${new Date().toISOString()}`
    );
  });
  next();
};

// Error logger
const errorLogger = (err, req, res, next) => {
  console.error("Error Logger:", {
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || "unauthenticated",
  });
  next(err);
};

module.exports = {
  cors: cors(corsOptions),
  authenticateToken,
  authorize,
  errorHandler,
  requestLogger,
  errorLogger,
};
