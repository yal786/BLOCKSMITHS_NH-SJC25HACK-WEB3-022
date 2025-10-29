// Show database details
import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function showDatabaseDetails() {
  try {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║           POSTGRES DATABASE DETAILS                        ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    // Connection info
    console.log("📌 CONNECTION INFO:");
    console.log(`   Database: protego`);
    console.log(`   Host: localhost:5432`);
    console.log(`   User: admin`);
    console.log(`   URL: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
    console.log();

    // Get tables
    const tablesRes = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log("📋 TABLES:");
    tablesRes.rows.forEach(row => console.log(`   - ${row.table_name}`));
    console.log();

    // Get schema
    const schemaRes = await pool.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'alerts' 
       ORDER BY ordinal_position`
    );
    console.log("🗂️  ALERTS TABLE SCHEMA:");
    console.table(schemaRes.rows);
    console.log();

    // Total count
    const countRes = await pool.query("SELECT COUNT(*) as total FROM alerts");
    console.log(`📊 TOTAL ALERTS: ${countRes.rows[0].total}`);
    console.log();

    // By risk level
    const riskRes = await pool.query(
      "SELECT risk_level, COUNT(*) as count FROM alerts GROUP BY risk_level ORDER BY count DESC"
    );
    console.log("🎯 ALERTS BY RISK LEVEL:");
    console.table(riskRes.rows);

    // By confidence (high confidence only)
    const confRes = await pool.query(
      "SELECT confidence, COUNT(*) as count FROM alerts WHERE confidence >= 70 GROUP BY confidence ORDER BY confidence DESC LIMIT 10"
    );
    console.log("💯 HIGH-CONFIDENCE ALERTS (≥70%):");
    if (confRes.rows.length > 0) {
      console.table(confRes.rows);
    } else {
      console.log("   No high-confidence alerts found\n");
    }

    // Most common rules
    const rulesRes = await pool.query(
      "SELECT rules, COUNT(*) as count FROM alerts GROUP BY rules ORDER BY count DESC LIMIT 10"
    );
    console.log("🔍 MOST COMMON RULE COMBINATIONS:");
    console.table(rulesRes.rows);

    // Recent alerts
    const recentRes = await pool.query(
      `SELECT tx_hash, "from", "to", risk_level, confidence, rules, 
              est_loss_usd, slippage_pct, created_at 
       FROM alerts 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    console.log("🕐 RECENT ALERTS (last 5):");
    recentRes.rows.forEach((row, i) => {
      console.log(`\n[${i + 1}] TX: ${row.tx_hash}`);
      console.log(`    From: ${row.from || "N/A"}`);
      console.log(`    To: ${row.to || "N/A"}`);
      console.log(`    Risk: ${row.risk_level} | Confidence: ${row.confidence}%`);
      console.log(`    Rules: ${row.rules}`);
      console.log(`    Est. Loss: $${row.est_loss_usd} | Slippage: ${row.slippage_pct}%`);
      console.log(`    Time: ${row.created_at.toISOString()}`);
    });
    console.log();

    // Check for enhanced data
    const enhancedRes = await pool.query(
      "SELECT COUNT(*) as count FROM alerts WHERE payload->'enhancedData' IS NOT NULL"
    );
    console.log(`\n🔬 ALERTS WITH ENHANCED DATA: ${enhancedRes.rows[0].count}`);

    // Sample enhanced alert if exists
    const sampleEnhancedRes = await pool.query(
      `SELECT tx_hash, risk_level, confidence, rules, payload->'enhancedData' as enhanced_data 
       FROM alerts 
       WHERE payload->'enhancedData' IS NOT NULL 
       LIMIT 1`
    );
    if (sampleEnhancedRes.rows.length > 0) {
      console.log("\n📄 SAMPLE ENHANCED ALERT:");
      const sample = sampleEnhancedRes.rows[0];
      console.log(`   TX: ${sample.tx_hash}`);
      console.log(`   Risk: ${sample.risk_level} | Confidence: ${sample.confidence}%`);
      console.log(`   Rules: ${sample.rules}`);
      if (sample.enhanced_data) {
        console.log(`   Enhanced Data:`, JSON.stringify(sample.enhanced_data, null, 2));
      }
    }

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                    END OF REPORT                           ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    await pool.end();
    process.exit(1);
  }
}

showDatabaseDetails();
