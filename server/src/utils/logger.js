// server/src/utils/logger.js - Hybrid Serverless Logger (Best of Both Approaches)
import dotenv from "dotenv";

dotenv.config();

// 🚀 Environment detection
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isServerless =
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY;

/**
 * Log levels (from Simple Logger - ✅ KEPT)
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3, // Added for request logging
  DEBUG: 4,
};

/**
 * Current log level based on environment (from Simple Logger - ✅ KEPT)
 */
const currentLogLevel = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()]
  : isDevelopment
  ? LOG_LEVELS.DEBUG
  : LOG_LEVELS.INFO;

/**
 * Color codes for console output (from Simple Logger - ✅ KEPT + ENHANCED)
 */
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

/**
 * Format timestamp (from Simple Logger - ✅ KEPT)
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Get color for log level (from Simple Logger - ✅ KEPT + ENHANCED)
 */
const getColor = (level) => {
  switch (level.toLowerCase()) {
    case "error":
      return colors.red;
    case "warn":
      return colors.yellow;
    case "info":
      return colors.blue;
    case "http":
      return colors.magenta; // Added
    case "debug":
      return colors.cyan;
    default:
      return colors.reset;
  }
};

/**
 * Enhanced format message with structured logging (HYBRID APPROACH)
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();

  // For serverless/production: structured JSON logging
  if (isServerless || isProduction) {
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
      environment: process.env.NODE_ENV,
      serverless: isServerless,
    });
  }

  // For development: human-readable with colors
  const metaString =
    Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
};

/**
 * Core log function (from Simple Logger - ✅ ENHANCED)
 */
const log = (level, message, meta = {}) => {
  const levelValue = LOG_LEVELS[level.toUpperCase()];

  // Check if this log level should be output
  if (levelValue > currentLogLevel) {
    return;
  }

  const color = getColor(level);
  const formattedMessage = formatMessage(level, message, meta);

  // Output with appropriate formatting
  if (isDevelopment && !isServerless) {
    // Development: colorful console output
    console.log(`${color}${formattedMessage}${colors.reset}`);
  } else {
    // Production/Serverless: structured logging
    console.log(formattedMessage);
  }

  // Always write errors to stderr in production
  if (level.toLowerCase() === "error") {
    console.error(formattedMessage);
  }
};

/**
 * 🆕 ADDED: Utility functions from Complex Logger (Serverless-Optimized)
 */
export const logUtils = {
  /**
   * Format request details (from Complex Logger - ✅ ADAPTED)
   */
  formatRequest: (req, res, duration) => {
    const formatted = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("user-agent"),
      ip: req.ip || req.connection?.remoteAddress || "unknown",
    };

    // Safely add user ID if available
    if (req.user && typeof req.user === "object" && "id" in req.user) {
      formatted.userId = req.user.id;
    }

    // Add request body size if available
    if (req.get("content-length")) {
      formatted.requestSize = req.get("content-length");
    }

    return formatted;
  },

  /**
   * Format error details (from Complex Logger - ✅ ENHANCED)
   */
  formatError: (error, context = {}) => {
    const formatted = {
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      type: error instanceof Error ? error.name : "Unknown",
    };

    // Add error properties safely
    if (error instanceof Error) {
      if (error.stack) formatted.stack = error.stack;
      if ("code" in error) formatted.code = error.code;
      if ("status" in error) formatted.status = error.status;
      if ("statusCode" in error) formatted.statusCode = error.statusCode;
    }

    // Add context safely
    if (context && typeof context === "object") {
      formatted.context = context;
    }

    return formatted;
  },

  /**
   * Database connection logging (from Complex Logger - ✅ ADAPTED)
   */
  logDbConnection: (success, details = {}) => {
    if (success) {
      logger.info("Database connected successfully", {
        ...details,
        database: "PostgreSQL",
        serverless: isServerless,
      });
    } else {
      logger.error("Database connection failed", {
        ...details,
        database: "PostgreSQL",
        serverless: isServerless,
      });
    }
  },

  /**
   * Performance monitoring (from Complex Logger - ✅ SIMPLIFIED)
   */
  logPerformance: (metric) => {
    if (typeof metric === "object" && metric !== null) {
      logger.debug("Performance metric", {
        ...metric,
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      });
    }
  },

  /**
   * 🆕 ADDED: Serverless-specific utilities
   */
  logColdStart: () => {
    logger.info("Serverless cold start", {
      platform: process.env.VERCEL ? "Vercel" : "Unknown",
      nodeVersion: process.version,
      memoryLimit: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || "unknown",
    });
  },

  logApiCall: (endpoint, method, duration, success = true) => {
    logger.http(`API ${method} ${endpoint}`, {
      endpoint,
      method,
      duration: `${duration}ms`,
      success,
      timestamp: Date.now(),
    });
  },
};

/**
 * Enhanced Logger object (from Simple Logger - ✅ ENHANCED)
 */
const logger = {
  /**
   * Log error message (Enhanced with better error handling)
   */
  error: (message, meta = {}) => {
    // Handle Error objects properly
    if (meta instanceof Error) {
      meta = logUtils.formatError(meta);
    }
    log("ERROR", message, meta);
  },

  /**
   * Log warning message
   */
  warn: (message, meta = {}) => {
    log("WARN", message, meta);
  },

  /**
   * Log info message
   */
  info: (message, meta = {}) => {
    log("INFO", message, meta);
  },

  /**
   * 🆕 ADDED: HTTP request logging (from Complex Logger)
   */
  http: (message, meta = {}) => {
    log("HTTP", message, meta);
  },

  /**
   * Log debug message
   */
  debug: (message, meta = {}) => {
    log("DEBUG", message, meta);
  },

  /**
   * Log with custom level
   */
  log: (level, message, meta = {}) => {
    log(level, message, meta);
  },

  /**
   * Create a child logger with additional context (from Simple Logger - ✅ KEPT)
   */
  child: (context = {}) => {
    return {
      error: (message, meta = {}) =>
        logger.error(message, { ...context, ...meta }),
      warn: (message, meta = {}) =>
        logger.warn(message, { ...context, ...meta }),
      info: (message, meta = {}) =>
        logger.info(message, { ...context, ...meta }),
      http: (message, meta = {}) =>
        logger.http(message, { ...context, ...meta }),
      debug: (message, meta = {}) =>
        logger.debug(message, { ...context, ...meta }),
      log: (level, message, meta = {}) =>
        logger.log(level, message, { ...context, ...meta }),
    };
  },
};

/**
 * 🆕 ADDED: Request logging middleware (from Complex Logger - ✅ SERVERLESS-OPTIMIZED)
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request start in development
  if (isDevelopment) {
    logger.debug(`→ ${req.method} ${req.url}`, {
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });
  }

  // Log request completion
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;

    // Use HTTP level for request logging
    logger.http(
      "Request completed",
      logUtils.formatRequest(req, res, duration)
    );

    return originalSend.call(this, data);
  };

  // Handle response finish event
  res.on("finish", () => {
    if (!res.headersSent) {
      const duration = Date.now() - start;
      logger.http(
        "Request finished",
        logUtils.formatRequest(req, res, duration)
      );
    }
  });

  // Handle response errors
  res.on("error", (error) => {
    const duration = Date.now() - start;
    logger.error("Request error", {
      ...logUtils.formatRequest(req, res, duration),
      error: logUtils.formatError(error),
    });
  });

  next();
};

/**
 * 🆕 ADDED: Error logging middleware (from Complex Logger - ✅ ENHANCED)
 */
export const errorLogger = (err, req, res, next) => {
  logger.error("Unhandled request error", {
    error: logUtils.formatError(err),
    request: {
      method: req.method,
      url: req.url,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    },
    serverless: isServerless,
  });

  next(err);
};

/**
 * 🆕 ADDED: Startup logging
 */
if (isServerless) {
  logger.info("🚀 Serverless logger initialized", {
    platform: process.env.VERCEL ? "Vercel" : "Unknown Serverless",
    logLevel: Object.keys(LOG_LEVELS).find(
      (key) => LOG_LEVELS[key] === currentLogLevel
    ),
    nodeVersion: process.version,
  });
} else {
  logger.info("💻 Development logger initialized", {
    logLevel: Object.keys(LOG_LEVELS).find(
      (key) => LOG_LEVELS[key] === currentLogLevel
    ),
    colorOutput: isDevelopment,
    nodeVersion: process.version,
  });
}

// 🆕 ADDED: Graceful error handling for unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", {
    reason: logUtils.formatError(reason),
    promise: promise.toString(),
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", logUtils.formatError(error));

  // In serverless, let the platform handle it
  if (!isServerless) {
    process.exit(1);
  }
});

export default logger;

/*
USAGE EXAMPLES:

// Basic logging
logger.info("User registered", { userId: 123, email: "user@example.com" });
logger.error("Database error", new Error("Connection failed"));

// Child logger with context
const userLogger = logger.child({ userId: 123, requestId: "abc-123" });
userLogger.info("User logged in");  // Automatically includes userId and requestId

// Request middleware
app.use(requestLogger);

// Error middleware
app.use(errorLogger);

// Database connection
logUtils.logDbConnection(true, { host: "localhost", database: "school_ms" });

// Performance monitoring
logUtils.logPerformance({ operation: "user-query", duration: 45, recordCount: 150 });

// API monitoring
const start = Date.now();
// ... API operation ...
logUtils.logApiCall("/api/users", "POST", Date.now() - start, true);

// Cold start detection (Vercel)
if (isServerless) {
  logUtils.logColdStart();
}
*/
