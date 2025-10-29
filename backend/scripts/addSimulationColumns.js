// backend/scripts/addSimulationColumns.js
// Database migration to add simulation columns to alerts table
import { pool } from "../utils/db.js";

async function addSimulationColumns() {
  console.log("🔧 Adding simulation columns to alerts table...\n");

  try {
    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'alerts' 
      AND column_name IN ('sim_status', 'sim_url', 'raw_sim');
    `;
    
    const existingCols = await pool.query(checkQuery);
    
    if (existingCols.rows.length > 0) {
      console.log("⚠️ Simulation columns already exist:");
      existingCols.rows.forEach(row => console.log(`   - ${row.column_name}`));
      console.log("\n✅ No migration needed.\n");
      process.exit(0);
    }

    // Add new columns
    const alterQuery = `
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS sim_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS sim_url TEXT,
      ADD COLUMN IF NOT EXISTS raw_sim JSONB;
    `;

    await pool.query(alterQuery);
    console.log("✅ Added columns:");
    console.log("   - sim_status (TEXT) - Status of simulation (pending/done/failed)");
    console.log("   - sim_url (TEXT) - Tenderly explorer URL");
    console.log("   - raw_sim (JSONB) - Full simulation response");

    // Create index on sim_status for faster queries
    const indexQuery = `
      CREATE INDEX IF NOT EXISTS idx_alerts_sim_status 
      ON alerts(sim_status);
    `;
    
    await pool.query(indexQuery);
    console.log("\n✅ Created index on sim_status column");

    // Verify schema
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'alerts'
      ORDER BY ordinal_position;
    `;
    
    const schema = await pool.query(verifyQuery);
    console.log("\n📋 Updated alerts table schema:");
    console.table(schema.rows);

    console.log("\n🎉 Migration completed successfully!\n");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addSimulationColumns();
