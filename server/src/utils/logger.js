// @ts-nocheck

// server/src/utils/logger.js - Serverless-Compatible Version (Preserving Your Code)
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get current directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔧 SERVERLESS DETECTION - Added for Vercel compatibility
const isServerless =
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY;
const isProduction = process.env.NODE_ENV === "production";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Set winston colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    fillExcept: ["message", "level", "timestamp", "stack"],
  }),
  winston.format.printf((info) => {
    let log = `${info.timestamp} ${info.level}: ${info.message}`;

    // Safely check if metadata exists and has properties
    const metadata =
      info.metadata && typeof info.metadata === "object" ? info.metadata : {};
    if (Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }

    // Add stack trace if available
    if (info.stack) {
      log += `\n${info.stack}`;
    }

    return log;
  })
);

// 🔧 CONDITIONAL DIRECTORY CREATION - Only in non-serverless environments
let logsDir = null;
if (!isServerless) {
  try {
    logsDir = path.join(process.cwd(), "logs");
    fs.mkdirSync(logsDir, { recursive: true });
    console.log("✅ Logs directory created for local development");
  } catch (error) {
    console.warn("⚠️ Failed to create logs directory:", error.message);
  }
}

// 🔧 CONDITIONAL TRANSPORTS - Different for serverless vs local
const transports = [
  // Console transport with colors (ALWAYS available)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      // Enhanced format for serverless environments
      isServerless
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf((info) => {
              return `[${info.timestamp}] ${info.level}: ${info.message}`;
            })
          )
        : winston.format.simple()
    ),
  }),
];

// 🔧 FILE TRANSPORTS - Only add in non-serverless environments
if (!isServerless && logsDir) {
  try {
    // Error log file with daily rotation
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, "error-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        level: "error",
        maxFiles: "30d",
        maxSize: "20m",
        zippedArchive: true,
      })
    );

    // Combined log file with daily rotation
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, "combined-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxFiles: "30d",
        maxSize: "20m",
        zippedArchive: true,
      })
    );

    // HTTP requests log file
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, "http-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        level: "http",
        maxFiles: "7d",
        maxSize: "20m",
        zippedArchive: true,
      })
    );

    console.log("✅ File logging transports added for local development");
  } catch (error) {
    console.warn("⚠️ Failed to set up file logging:", error.message);
  }
} else if (isServerless) {
  console.log("🚀 Serverless environment detected - console logging only");
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  levels,
  format,
  transports,
  // 🔧 SERVERLESS OPTIMIZATION - Don't exit on error in serverless
  exitOnError: !isServerless,
});

// 🔧 STARTUP LOG - Environment awareness
if (isServerless) {
  logger.info("🚀 Logger initialized for serverless environment", {
    platform: process.env.VERCEL ? "Vercel" : "Other Serverless",
    transports: ["Console"],
  });
} else {
  logger.info("💻 Logger initialized for local development", {
    transports: transports.map((t) => t.constructor.name),
    logsDirectory: logsDir,
  });
}

// Utility functions with type safety (PRESERVED FROM YOUR CODE)
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
      serverless: isServerless,
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

// Request logging middleware with error handling (PRESERVED FROM YOUR CODE)
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

// Error logging middleware with type safety (PRESERVED FROM YOUR CODE)
export const errorLogger = (err, req, res, next) => {
  logger.error("Unhandled Error", {
    ...logUtils.formatError(err),
    request: logUtils.formatRequest(req, res, 0),
  });

  next(err);
};

// Default export
export default logger;
