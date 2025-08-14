// @ts-nocheck - Utility script for generating JWT secrets
// Generate JWT keys script
import crypto from "crypto";

/**
 * Generate a cryptographically secure random secret
 * @param {number} bytes - Number of bytes to generate (default: 64)
 * @returns {string} Base64 encoded secret
 */
const generateSecret = (bytes = 64) => {
  try {
    return crypto.randomBytes(bytes).toString("base64");
  } catch (error) {
    console.error("Failed to generate secret:", error.message);
    throw new Error("Crypto operation failed");
  }
};

/**
 * Generate JWT secrets for different token types
 * @returns {Object} Object containing all generated secrets
 */
const generateJWTSecrets = () => {
  try {
    // Generate a single JWT secret for backward compatibility
    const jwtSecret = generateSecret();

    // Generate different secrets for each token type for enhanced security
    const jwtSecrets = {
      access: generateSecret(),
      refresh: generateSecret(),
      verification: generateSecret(),
      reset: generateSecret(),
    };

    return {
      jwtSecret,
      jwtSecrets,
    };
  } catch (error) {
    console.error("Failed to generate JWT secrets:", error.message);
    process.exit(1);
  }
};

/**
 * Output secrets in .env format
 * @param {Object} secrets - Generated secrets object
 */
const outputSecrets = ({ jwtSecret, jwtSecrets }) => {
  console.log("🔐 Generated JWT Secrets");
  console.log("========================");
  console.log("Add these to your .env file:\n");

  console.log("# Main JWT Secret (for backward compatibility)");
  console.log(`JWT_SECRET=${jwtSecret}\n`);

  console.log("# Token-specific secrets (recommended for production)");
  console.log(`JWT_ACCESS_SECRET=${jwtSecrets.access}`);
  console.log(`JWT_REFRESH_SECRET=${jwtSecrets.refresh}`);
  console.log(`JWT_VERIFICATION_SECRET=${jwtSecrets.verification}`);
  console.log(`JWT_RESET_SECRET=${jwtSecrets.reset}\n`);

  console.log("⚠️  Important:");
  console.log(
    "- Keep these secrets secure and never commit them to version control"
  );
  console.log(
    "- Use different secrets for different environments (dev, staging, production)"
  );
  console.log("- Consider rotating secrets periodically for enhanced security");
};

/**
 * Main execution function
 */
const main = () => {
  try {
    console.log("🚀 Starting JWT secret generation...\n");

    const secrets = generateJWTSecrets();
    outputSecrets(secrets);

    console.log("\n✅ JWT secrets generated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
};

// Run the script only if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for potential reuse
export { generateSecret, generateJWTSecrets };
export default main;
