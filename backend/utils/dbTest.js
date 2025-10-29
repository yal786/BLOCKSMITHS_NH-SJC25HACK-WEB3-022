import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDB() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log("✅ Database connected successfully:", res.rows[0]);
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  } finally {
    pool.end();
  }
}

testDB();
