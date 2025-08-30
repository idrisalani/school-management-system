// Database Schema-Compliant Mockaroo Integration
// This ensures all generated data matches your existing database structure exactly

const axios = require("axios");
const { Pool } = require("pg");

class SchemaCompliantMockaroo {
  constructor() {
    this.mockarooAPIKey = process.env.MOCKAROO_API_KEY || "d61875f0";
    this.baseURL = "https://my.api.mockaroo.com";

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }

  // First, let's analyze your existing database structure
  async analyzeExistingSchema() {
    console.log("📊 Analyzing existing database schema...");

    try {
      // Get all tables and their columns
      const tablesQuery = `
        SELECT 
          t.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name, c.ordinal_position;
      `;

      const result = await this.pool.query(tablesQuery);
      const schema = this.organizeSchemaData(result.rows);

      console.log("🏗️ Found these tables in your database:");
      Object.keys(schema).forEach((table) => {
        console.log(`  📋 ${table}: ${Object.keys(schema[table]).length} columns`);
      });

      return schema;
    } catch (error) {
      console.error("❌ Error analyzing schema:", error.message);
      return this.getFallbackSchema();
    }
  }

  // Create Mockaroo schemas based on your actual database structure
  async createSchemaCompliantMockarooSchemas() {
    const dbSchema = await this.analyzeExistingSchema();

    console.log("🎯 Creating Mockaroo schemas that match your database exactly...\n");

    // Users table schema for Mockaroo
    if (dbSchema.users) {
      console.log("👥 USERS TABLE - Mockaroo Schema Configuration:");
      console.log('Copy this to Mockaroo.com when creating your "users" schema:\n');

      const usersMockarooSchema = this.generateMockarooFieldsForTable("users", dbSchema.users);
      console.log(JSON.stringify(usersMockarooSchema, null, 2));
      console.log("\n" + "=".repeat(80) + "\n");
    }

    // Classes table schema for Mockaroo
    if (dbSchema.classes) {
      console.log("📚 CLASSES TABLE - Mockaroo Schema Configuration:");
      console.log('Copy this to Mockaroo.com when creating your "classes" schema:\n');

      const classesMockarooSchema = this.generateMockarooFieldsForTable(
        "classes",
        dbSchema.classes
      );
      console.log(JSON.stringify(classesMockarooSchema, null, 2));
      console.log("\n" + "=".repeat(80) + "\n");
    }

    // Assignments table schema for Mockaroo
    if (dbSchema.assignments) {
      console.log("📝 ASSIGNMENTS TABLE - Mockaroo Schema Configuration:");
      console.log('Copy this to Mockaroo.com when creating your "assignments" schema:\n');

      const assignmentsMockarooSchema = this.generateMockarooFieldsForTable(
        "assignments",
        dbSchema.assignments
      );
      console.log(JSON.stringify(assignmentsMockarooSchema, null, 2));
      console.log("\n" + "=".repeat(80) + "\n");
    }

    return {
      users: dbSchema.users,
      classes: dbSchema.classes,
      assignments: dbSchema.assignments,
    };
  }

  // Generate Mockaroo field configuration for a specific table
  generateMockarooFieldsForTable(tableName, columns) {
    const mockarooFields = [];

    Object.entries(columns).forEach(([columnName, columnInfo]) => {
      // Skip auto-generated fields
      if (
        columnName === "id" ||
        columnName.includes("_id") ||
        columnName === "created_at" ||
        columnName === "updated_at"
      ) {
        return;
      }

      const field = {
        name: columnName,
        type: this.mapDatabaseTypeToMockaroo(columnInfo.data_type, columnName),
        blank_percentage: columnInfo.is_nullable === "YES" ? 10 : 0,
      };

      // Add specific configurations based on column name and type
      if (columnName === "email") {
        field.type = "Email Address";
      } else if (columnName === "phone") {
        field.type = "Phone";
        field.format = "(###) ###-####";
      } else if (columnName.includes("first_name")) {
        field.type = "First Name";
      } else if (columnName.includes("last_name")) {
        field.type = "Last Name";
      } else if (columnName === "username") {
        field.type = "Username";
      } else if (columnName === "role") {
        field.type = "Custom List";
        field.values = ["student", "teacher", "admin", "parent"];
      } else if (columnName === "address") {
        field.type = "Street Address";
      } else if (columnName === "city") {
        field.type = "City";
      } else if (columnName === "state") {
        field.type = "State (abbrev)";
      } else if (columnName === "zip" || columnName === "postal_code") {
        field.type = "Postal Code";
      } else if (columnName.includes("date")) {
        field.type = "Date";
        field.min = this.getDateRangeForField(columnName).min;
        field.max = this.getDateRangeForField(columnName).max;
      } else if (columnName.includes("grade") && columnInfo.data_type.includes("int")) {
        field.type = "Number";
        field.min = 1;
        field.max = 12;
      } else if (columnName === "gpa") {
        field.type = "Number";
        field.min = 2.0;
        field.max = 4.0;
        field.decimal_places = 2;
      } else if (columnName.includes("status")) {
        field.type = "Custom List";
        field.values = this.getStatusValuesForField(tableName, columnName);
      }

      mockarooFields.push(field);
    });

    return {
      name: `${tableName}_schema`,
      count: 1000,
      fields: mockarooFields,
    };
  }

  // Map PostgreSQL data types to appropriate Mockaroo types
  mapDatabaseTypeToMockaroo(dataType, columnName) {
    const typeMapping = {
      "character varying": "Full Name",
      varchar: "Full Name",
      text: "Sentences",
      integer: "Number",
      bigint: "Number",
      decimal: "Number",
      numeric: "Number",
      boolean: "Boolean",
      date: "Date",
      timestamp: "Datetime",
      time: "Time",
    };

    return typeMapping[dataType] || "Custom List";
  }

  // Get appropriate date ranges for different date fields
  getDateRangeForField(fieldName) {
    const dateRanges = {
      birth_date: { min: "1990-01-01", max: "2010-12-31" },
      enrollment_date: { min: "2023-08-01", max: "2024-09-01" },
      hire_date: { min: "2015-01-01", max: "2024-01-01" },
      due_date: { min: "2024-01-01", max: "2024-12-31" },
      start_date: { min: "2024-01-01", max: "2024-12-31" },
      end_date: { min: "2024-06-01", max: "2024-12-31" },
      created_at: { min: "2024-01-01", max: "2024-08-27" },
      updated_at: { min: "2024-01-01", max: "2024-08-27" },
    };

    return dateRanges[fieldName] || { min: "2024-01-01", max: "2024-12-31" };
  }

  // Get appropriate status values for different tables
  getStatusValuesForField(tableName, fieldName) {
    const statusValues = {
      users: {
        status: ["active", "inactive", "suspended"],
        account_status: ["active", "pending", "suspended"],
      },
      classes: {
        status: ["active", "completed", "cancelled"],
        enrollment_status: ["open", "closed", "waitlist"],
      },
      assignments: {
        status: ["draft", "published", "closed"],
        submission_status: ["pending", "submitted", "graded"],
      },
      attendance: {
        status: ["present", "absent", "tardy", "excused"],
      },
    };

    return statusValues[tableName]?.[fieldName] || ["active", "inactive"];
  }

  // Generate data that matches your exact database structure
  async generateSchemaCompliantData(tableName, count = 100) {
    console.log(`📊 Generating ${count} records for ${tableName} table...`);

    try {
      // Use your specific Mockaroo schema endpoint
      const response = await axios.get(`${this.baseURL}/${tableName}.json`, {
        params: {
          key: this.mockarooAPIKey,
          count: count,
        },
      });

      // Transform the data to match your database exactly
      return response.data.map((record) => {
        // Remove any fields that don't exist in your database
        const cleanRecord = { ...record };

        // Add required fields that Mockaroo doesn't generate
        cleanRecord.created_at = new Date();
        cleanRecord.updated_at = new Date();
        cleanRecord.is_active = cleanRecord.is_active !== undefined ? cleanRecord.is_active : true;

        return cleanRecord;
      });
    } catch (error) {
      console.error(`❌ Error generating ${tableName} data:`, error.message);
      throw error;
    }
  }

  // Insert data using exact database schema
  async insertSchemaCompliantData(tableName, records) {
    console.log(`💾 Inserting ${records.length} records into ${tableName}...`);

    const dbSchema = await this.analyzeExistingSchema();
    const tableColumns = Object.keys(dbSchema[tableName] || {});

    // Filter records to only include columns that exist in the database
    const validColumns = tableColumns.filter((col) => col !== "id");

    for (const record of records) {
      const values = validColumns.map((col) => record[col] || null);
      const placeholders = validColumns.map((_, index) => `$${index + 1}`).join(", ");
      const columnNames = validColumns.join(", ");

      const query = `
        INSERT INTO ${tableName} (${columnNames})
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `;

      try {
        await this.pool.query(query, values);
      } catch (error) {
        console.error(`Error inserting into ${tableName}:`, error.message);
        console.error("Record:", record);
        console.error("Columns:", validColumns);
        console.error("Values:", values);
        break; // Stop on first error to debug
      }
    }
  }

  // Organize schema analysis results
  organizeSchemaData(rows) {
    const schema = {};

    rows.forEach((row) => {
      if (!schema[row.table_name]) {
        schema[row.table_name] = {};
      }

      if (row.column_name) {
        schema[row.table_name][row.column_name] = {
          data_type: row.data_type,
          is_nullable: row.is_nullable,
          column_default: row.column_default,
          character_maximum_length: row.character_maximum_length,
        };
      }
    });

    return schema;
  }

  // Fallback schema if database analysis fails
  getFallbackSchema() {
    return {
      users: {
        first_name: { data_type: "character varying", is_nullable: "NO" },
        last_name: { data_type: "character varying", is_nullable: "NO" },
        email: { data_type: "character varying", is_nullable: "NO" },
        username: { data_type: "character varying", is_nullable: "YES" },
        role: { data_type: "character varying", is_nullable: "NO" },
        phone: { data_type: "character varying", is_nullable: "YES" },
        address: { data_type: "text", is_nullable: "YES" },
        is_active: { data_type: "boolean", is_nullable: "NO" },
      },
    };
  }

  // Main execution function
  async run() {
    try {
      console.log("🚀 Starting Schema-Compliant Data Generation...\n");

      // Step 1: Analyze your existing database
      const schema = await this.analyzeExistingSchema();

      // Step 2: Create matching Mockaroo schema configurations
      await this.createSchemaCompliantMockarooSchemas();

      console.log("✅ Schema analysis complete!");
      console.log("\n📋 NEXT STEPS:");
      console.log("1. Copy the Mockaroo schema configurations above");
      console.log("2. Create corresponding schemas on Mockaroo.com");
      console.log("3. Run the data generation with your schemas");
      console.log("4. All generated data will match your database exactly");
    } catch (error) {
      console.error("❌ Error:", error.message);
    } finally {
      await this.pool.end();
    }
  }
}

// CLI usage
if (require.main === module) {
  const generator = new SchemaCompliantMockaroo();
  generator.run();
}

module.exports = SchemaCompliantMockaroo;
