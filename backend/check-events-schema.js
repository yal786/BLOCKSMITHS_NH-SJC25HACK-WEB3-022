import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('\n=== AUDIT_LOGS TABLE ===');
try {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    ORDER BY ordinal_position
  `);
  console.table(res.rows);
} catch(e) {
  console.log('Error:', e.message);
}

await pool.end();
