// server/src/utils/logger.js - Simple Serverless Logger
// Perfect for Vercel/serverless environments

const logger = {
  info: (...args) => {
    console.log(`[INFO] ${new Date().toISOString()}:`, ...args);
  },

  error: (...args) => {
    console.error(`[ERROR] ${new Date().toISOString()}:`, ...args);
  },

  warn: (...args) => {
    console.warn(`[WARN] ${new Date().toISOString()}:`, ...args);
  },

  debug: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${new Date().toISOString()}:`, ...args);
    }
  },

  http: (...args) => {
    console.log(`[HTTP] ${new Date().toISOString()}:`, ...args);
  },
};

// Utility functions with type safety
export const logUtils = {
  // Format request details with proper type checking
  formatRequest: (req, res, duration) => {
    const formatted = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    };

    // Safely add user ID if available
    if (req.user && typeof req.user === "object" && "id" in req.user) {
      formatted.userId = req.user.id;
    }

    return formatted;
  },

  // Format error details with type safety
  formatError: (error, context = {}) => {
    const formatted = {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };

    // Safely add error properties
    if (error instanceof Error) {
      if (error.stack) formatted.stack = error.stack;
      if ("code" in error) formatted.code = error.code;
    }

    // Safely add context if it's an object
    if (context && typeof context === "object") {
      formatted.context = context;
    }

    return formatted;
  },

  // Application lifecycle logs
  logStartup: (port) => {
    logger.info("Server starting up", {
      port: Number(port),
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
    });
  },

  logShutdown: () => {
    logger.info("Server shutting down gracefully");
  },

  // Database logs
  logDbConnection: (success, details = {}) => {
    if (success) {
      logger.info("Database connected successfully", details);
    } else {
      logger.error("Database connection failed", details);
    }
  },

  // Performance monitoring
  logPerformance: (metric) => {
    if (typeof metric === "object" && metric !== null) {
      logger.debug("Performance metric", {
        ...metric,
        timestamp: Date.now(),
      });
    }
  },
};

// Request logging middleware with error handling
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request completion
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.http("HTTP Request", logUtils.formatRequest(req, res, duration));
  });

  // Log request failure
  res.on("error", (error) => {
    const duration = Date.now() - start;
    logger.error("HTTP Request Error", {
      ...logUtils.formatRequest(req, res, duration),
      error: logUtils.formatError(error),
    });
  });

  next();
};

// Error logging middleware with type safety
export const errorLogger = (err, req, res, next) => {
  logger.error("Unhandled Error", {
    ...logUtils.formatError(err),
    request: logUtils.formatRequest(req, res, 0),
  });

  next(err);
};

// Default export
export default logger;
