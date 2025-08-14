// @ts-nocheck - This is a database seed script that doesn't need strict TypeScript checking
import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Fix 1: Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database seed files in order
 * @returns {Promise<void>}
 */
async function runSeeds() {
  // Fix 2: Validate environment variables
  const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    console.log("🌱 Starting database seeding...");

    // Get all seed files
    const files = await fs.readdir(__dirname);
    const seedFiles = files.filter((f) => f.endsWith(".sql")).sort();

    if (seedFiles.length === 0) {
      console.log("⚠️  No seed files found");
      return;
    }

    console.log(`📁 Found ${seedFiles.length} seed files:`, seedFiles);

    // Run seeds in order
    for (const file of seedFiles) {
      console.log(`🔄 Running seed: ${file}`);

      try {
        const sql = await fs.readFile(path.join(__dirname, file), "utf8");

        // Fix 3: Skip empty files
        if (!sql.trim()) {
          console.log(`⏭️  Skipping empty file: ${file}`);
          continue;
        }

        await connection.query(sql);
        console.log(`✅ Completed seed: ${file}`);
      } catch (fileError) {
        console.error(`❌ Error in seed file ${file}:`, fileError.message);
        throw fileError;
      }
    }

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("💥 Seeding failed:", error.message);
    console.error("Full error:", error);
    throw error;
  } finally {
    try {
      await connection.end();
      console.log("🔌 Database connection closed");
    } catch (closeError) {
      console.error("⚠️  Error closing connection:", closeError.message);
    }
  }
}

// Fix 4: Add proper error handling for the main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  // Only run if this file is executed directly
  runSeeds()
    .then(() => {
      console.log("🏁 Seeding process finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("🚨 Fatal error during seeding:", error);
      process.exit(1);
    });
}

export default runSeeds;
