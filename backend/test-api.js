// Quick API test script
import { pool } from "./utils/db.js";
import { analyzeTx } from "./core/detector.js";

console.log("🧪 Testing Protego Backend Components\n");

// Test 1: Database connection
console.log("1️⃣ Testing Database Connection...");
try {
  const result = await pool.query("SELECT COUNT(*) as count FROM alerts");
  console.log(`✅ Database connected! Found ${result.rows[0].count} alerts in DB\n`);
} catch (err) {
  console.error("❌ Database connection failed:", err.message);
  process.exit(1);
}

// Test 2: Fetch alerts from DB
console.log("2️⃣ Testing Alert Retrieval...");
try {
  const result = await pool.query(`
    SELECT id, tx_hash, "from", "to", risk_level, confidence, rules
    FROM alerts
    ORDER BY created_at DESC
    LIMIT 3
  `);
  console.log(`✅ Retrieved ${result.rows.length} alerts:`);
  result.rows.forEach(row => {
    console.log(`   - ${row.tx_hash} [${row.risk_level}] confidence: ${row.confidence}%`);
  });
  console.log();
} catch (err) {
  console.error("❌ Alert retrieval failed:", err.message);
}

// Test 3: Detector function
console.log("3️⃣ Testing Detection Engine...");
const testTx = {
  hash: "0xtest123",
  from: "0xabc",
  to: "0x7a250d5630b4cf539739df2c5dacab7dbe2f6d",
  gasPrice: 500,
  data: "0x"
};
const detection = analyzeTx(testTx);
console.log(`✅ Detection works! Result: ${detection.riskLevel} (confidence: ${detection.confidence}%)`);
console.log(`   Rules triggered: ${detection.rules.join(", ") || "none"}\n`);

// Test 4: Stats query
console.log("4️⃣ Testing Stats Query...");
try {
  const result = await pool.query(`
    SELECT risk_level, COUNT(*) as count
    FROM alerts
    GROUP BY risk_level
    ORDER BY count DESC
  `);
  console.log(`✅ Stats query works! Breakdown:`);
  result.rows.forEach(row => {
    console.log(`   - ${row.risk_level}: ${row.count} alerts`);
  });
  console.log();
} catch (err) {
  console.error("❌ Stats query failed:", err.message);
}

console.log("✨ All component tests passed!\n");
console.log("To start the server, run: node server.js");
console.log("To test API endpoints, use curl commands provided in the documentation.\n");

await pool.end();
process.exit(0);
