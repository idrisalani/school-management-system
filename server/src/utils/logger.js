// @ts-nocheck

// server/src/utils/logger.js - Fixed ES Modules Version
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get current directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Create logs directory
const logsDir = path.join(process.cwd(), "logs");
fs.mkdirSync(logsDir, { recursive: true });

// Define log transports
const transports = [
  // Console transport with colors
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize({ all: true })),
  }),

  // Error log file with daily rotation
  new DailyRotateFile({
    filename: path.join(logsDir, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    level: "error",
    maxFiles: "30d",
    maxSize: "20m",
    zippedArchive: true,
  }),

  // Combined log file with daily rotation
  new DailyRotateFile({
    filename: path.join(logsDir, "combined-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles: "30d",
    maxSize: "20m",
    zippedArchive: true,
  }),

  // HTTP requests log file
  new DailyRotateFile({
    filename: path.join(logsDir, "http-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    level: "http",
    maxFiles: "7d",
    maxSize: "20m",
    zippedArchive: true,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  levels,
  format,
  transports,
});

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
