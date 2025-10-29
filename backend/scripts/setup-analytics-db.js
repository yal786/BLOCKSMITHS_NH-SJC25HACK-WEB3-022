// Script to set up events_log table for analytics dashboard
import { pool } from "../utils/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupAnalyticsDB() {
  try {
    console.log("📊 Setting up analytics database...\n");

    // Read SQL file
    const sqlFile = path.join(__dirname, "create-events-log-table.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    // Execute SQL
    await pool.query(sql);

    console.log("\n✅ Analytics database setup complete!");
    console.log("   - events_log table created");
    console.log("   - Indexes created for performance");
    console.log("   - Sample data inserted for testing\n");

    // Verify table exists
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM events_log;
    `);

    console.log(`📈 Total events in database: ${result.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

setupAnalyticsDB();
