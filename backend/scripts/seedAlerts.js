// backend/scripts/seedAlerts.js
import { pool } from "../utils/db.js";

async function seed() {
  const sample = [
    ['0xseed1','0xabc','0x7a250d5630b4cf539739df2c5dacab7dbe2f6d','HIGH',85, ['isDexRouter','gasPriceSpike'], 12.5, 1.8, {}],
    ['0xseed2','0xdef','0x1111111111111111111111111111111111111111','MEDIUM',60, ['isDexRouter'], 3.2, 0.5, {}],
    ['0xseed3','0xghi','0x2222222222222222222222222222222222222222','LOW',20, [], 0, 0, {}]
  ];
  for (const s of sample) {
    await pool.query(
      `INSERT INTO alerts (tx_hash, "from", "to", risk_level, confidence, rules, est_loss_usd, slippage_pct, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [s[0], s[1], s[2], s[3], s[4], JSON.stringify(s[5]), s[6], s[7], s[8]]
    );
  }
  console.log("Seeded sample alerts");
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
