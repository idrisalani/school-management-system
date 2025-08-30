// @ts-nocheck - This is a database seed script that doesn't need strict TypeScript checking
import pkg from "pg";
const { Pool } = pkg;
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database seed files in order
 * @returns {Promise<void>}
 */
async function runSeeds() {
  // Validate environment variables - PostgreSQL/Supabase format
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing required environment variable: DATABASE_URL. " +
        "Should be in format: postgresql://user:password@host:port/database"
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  let client;

  try {
    console.log("🌱 Starting database seeding...");
    console.log("🔌 Connecting to PostgreSQL database...");

    // Get a client from the pool
    client = await pool.connect();

    // Test connection
    const testResult = await client.query("SELECT NOW()");
    console.log(`✅ Connected to database at: ${testResult.rows[0].now}`);

    // Get all seed files
    const files = await fs.readdir(__dirname);
    const seedFiles = files.filter((f) => f.endsWith(".sql")).sort();

    if (seedFiles.length === 0) {
      console.log("⚠️  No seed files found");
      return;
    }

    console.log(`📁 Found ${seedFiles.length} seed files:`, seedFiles);

    // Begin transaction for all seeds
    await client.query("BEGIN");

    try {
      // Run seeds in order
      for (const file of seedFiles) {
        console.log(`🔄 Running seed: ${file}`);

        try {
          const sql = await fs.readFile(path.join(__dirname, file), "utf8");

          // Skip empty files
          if (!sql.trim()) {
            console.log(`⏭️  Skipping empty file: ${file}`);
            continue;
          }

          // Execute the SQL file
          await client.query(sql);
          console.log(`✅ Completed seed: ${file}`);
        } catch (fileError) {
          console.error(`❌ Error in seed file ${file}:`, fileError.message);
          throw fileError;
        }
      }

      // Commit transaction
      await client.query("COMMIT");
      console.log("💾 All seeds committed successfully");
    } catch (seedError) {
      // Rollback transaction on error
      await client.query("ROLLBACK");
      console.error("🔄 Transaction rolled back due to error");
      throw seedError;
    }

    console.log("🎉 Database seeding completed successfully!");

    // Show some stats
    const userCount = await client.query("SELECT COUNT(*) FROM users");
    const classCount = await client.query("SELECT COUNT(*) FROM classes");

    console.log("📊 Database Statistics:");
    console.log(`   👥 Users: ${userCount.rows[0].count}`);
    console.log(`   📚 Classes: ${classCount.rows[0].count}`);
  } catch (error) {
    console.error("💥 Seeding failed:", error.message);
    console.error("Full error:", error);
    throw error;
  } finally {
    try {
      // Release the client back to the pool
      if (client) {
        client.release();
        console.log("🔓 Database client released");
      }
      // Close the pool
      await pool.end();
      console.log("🔌 Database connection pool closed");
    } catch (closeError) {
      console.error("⚠️  Error closing connection:", closeError.message);
    }
  }
}

/**
 * Alternative function to run individual seed file
 * @param {string} seedFileName - Name of the seed file to run
 * @returns {Promise<void>}
 */
export async function runSingleSeed(seedFileName) {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  let client;

  try {
    console.log(`🔄 Running single seed: ${seedFileName}`);

    client = await pool.connect();

    const sql = await fs.readFile(path.join(__dirname, seedFileName), "utf8");

    if (!sql.trim()) {
      console.log("⏭️  Seed file is empty");
      return;
    }

    await client.query(sql);
    console.log(`✅ Completed seed: ${seedFileName}`);
  } catch (error) {
    console.error(`❌ Error running seed ${seedFileName}:`, error.message);
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

/**
 * Reset database by dropping and recreating tables
 * @returns {Promise<void>}
 */
export async function resetDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  let client;

  try {
    console.log("🗑️  Resetting database...");

    client = await pool.connect();

    // Drop all tables (be careful with this!)
    const dropTablesQuery = `
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `;

    await client.query(dropTablesQuery);
    console.log("🧹 Database reset completed");
  } catch (error) {
    console.error("❌ Error resetting database:", error.message);
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case "reset":
      resetDatabase()
        .then(() => {
          console.log("🏁 Database reset finished");
          process.exit(0);
        })
        .catch((error) => {
          console.error("🚨 Fatal error during reset:", error);
          process.exit(1);
        });
      break;

    case "single":
      const fileName = process.argv[3];
      if (!fileName) {
        console.error("❌ Please provide a seed file name");
        process.exit(1);
      }

      runSingleSeed(fileName)
        .then(() => {
          console.log("🏁 Single seed finished");
          process.exit(0);
        })
        .catch((error) => {
          console.error("🚨 Fatal error during single seed:", error);
          process.exit(1);
        });
      break;

    default:
      // Run all seeds
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
}

export default runSeeds;
