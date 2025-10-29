// Run migration to add unique constraints
import { pool } from '../utils/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔧 Running unique constraints migration...');
    
    const sqlPath = path.join(__dirname, 'add-unique-constraints.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Unique constraints added to alerts and events_log tables');
    console.log('✅ Duplicate entries have been removed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigration();
