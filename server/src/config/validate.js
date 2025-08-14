// src/config/validate.js
import logger from "../utils/logger.js";

/**
 * Get environment variable with type checking
 * @param {string} key - Environment variable key
 * @param {boolean} [required=true] - Whether the variable is required
 * @returns {string} Environment variable value
 * @throws {Error} If required variable is missing
 */
const getEnvVar = (key, required = true) => {
  const value = process.env[key];
  if (required && (!value || value.trim() === "")) {
    const error = `Environment variable ${key} is required`;
    logger.error(error);
    throw new Error(error);
  }
  return value || "";
};

// Define required environment variables
const REQUIRED_ENV_VARS = [
  "NODE_ENV",
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_VERIFICATION_SECRET",
  "JWT_RESET_SECRET",
  "CLIENT_URL",
];

// Valid environment values
const VALID_ENVIRONMENTS = ["development", "production", "test"];

/**
 * Validates required environment variables
 * @throws {Error} If any required variables are missing or invalid
 * @returns {Object} Validated environment variables
 */
const validateConfig = () => {
  logger.info("Validating configuration...");

  try {
    // Check for missing variables
    const missing = REQUIRED_ENV_VARS.filter(
      (varName) => !process.env[varName] || process.env[varName].trim() === ""
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    // Validate NODE_ENV
    const nodeEnv = getEnvVar("NODE_ENV");
    if (!VALID_ENVIRONMENTS.includes(nodeEnv)) {
      throw new Error(
        `Invalid NODE_ENV: ${nodeEnv}. Must be one of: ${VALID_ENVIRONMENTS.join(
          ", "
        )}`
      );
    }

    // Validate PORT
    const port = parseInt(getEnvVar("PORT"), 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new Error("PORT must be a valid number between 1 and 65535");
    }

    // Validate MongoDB URI format
    const mongoUri = getEnvVar("MONGO_URI");
    const mongoDbRegex = /^mongodb(\+srv)?:\/\/.+/;
    if (!mongoDbRegex.test(mongoUri)) {
      throw new Error("Invalid MONGO_URI format");
    }

    // Validate JWT secrets length
    const jwtSecrets = [
      "JWT_SECRET",
      "JWT_ACCESS_SECRET",
      "JWT_REFRESH_SECRET",
      "JWT_VERIFICATION_SECRET",
      "JWT_RESET_SECRET",
    ];

    jwtSecrets.forEach((secret) => {
      const value = getEnvVar(secret);
      if (value.length < 32) {
        throw new Error(`${secret} should be at least 32 characters long`);
      }
    });

    // Validate CLIENT_URL format
    const clientUrl = getEnvVar("CLIENT_URL");
    try {
      new URL(clientUrl);
    } catch (error) {
      throw new Error("CLIENT_URL must be a valid URL");
    }

    // Additional production checks
    if (nodeEnv === "production") {
      if (clientUrl.includes("localhost")) {
        throw new Error("CLIENT_URL cannot contain localhost in production");
      }
    }

    logger.info("Configuration validation successful");

    // Return validated environment variables
    return {
      nodeEnv,
      port,
      mongoUri,
      jwtSecret: getEnvVar("JWT_SECRET"),
      jwtAccessSecret: getEnvVar("JWT_ACCESS_SECRET"),
      jwtRefreshSecret: getEnvVar("JWT_REFRESH_SECRET"),
      jwtVerificationSecret: getEnvVar("JWT_VERIFICATION_SECRET"),
      jwtResetSecret: getEnvVar("JWT_RESET_SECRET"),
      clientUrl,
    };
  } catch (error) {
    logger.error("Configuration validation failed:", error);
    throw error;
  }
};

export { validateConfig, getEnvVar };
