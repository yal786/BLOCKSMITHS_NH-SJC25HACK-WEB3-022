// Test script to verify unique transactions implementation
import { insertAlert, logEvent, pool } from './utils/db.js';

console.log('🧪 Testing Unique Transactions Implementation\n');

async function testUniqueAlerts() {
  console.log('📝 Test 1: Unique Alerts');
  const testTxHash = '0xtest_unique_' + Date.now();
  
  try {
    // First insert - should succeed
    const alert1 = await insertAlert({
      txHash: testTxHash,
      from: '0x1234567890abcdef',
      to: '0xfedcba0987654321',
      riskLevel: 'HIGH',
      confidence: 85,
      rules: ['sandwich', 'frontrun'],
      estLossUsd: 100,
      slippagePct: 5,
      payload: { test: true }
    });
    
    if (alert1 && alert1.tx_hash === testTxHash) {
      console.log('  ✅ First insert succeeded:', alert1.tx_hash);
    } else {
      console.log('  ❌ First insert failed');
      return false;
    }
    
    // Second insert with same tx_hash - should be skipped
    const alert2 = await insertAlert({
      txHash: testTxHash,
      from: '0x1234567890abcdef',
      to: '0xfedcba0987654321',
      riskLevel: 'LOW',
      confidence: 50,
      rules: ['test'],
      estLossUsd: 200,
      slippagePct: 10,
      payload: { test: true }
    });
    
    if (!alert2) {
      console.log('  ✅ Duplicate correctly skipped (ON CONFLICT worked)');
    } else {
      console.log('  ❌ Duplicate was NOT skipped - this should not happen!');
      return false;
    }
    
    // Verify only one entry exists
    const check = await pool.query('SELECT COUNT(*) as count FROM alerts WHERE tx_hash = $1', [testTxHash]);
    const count = parseInt(check.rows[0].count);
    
    if (count === 1) {
      console.log('  ✅ Database verification: Only 1 entry exists for this tx_hash\n');
      return true;
    } else {
      console.log(`  ❌ Database verification failed: ${count} entries found instead of 1\n`);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Test failed with error:', error.message, '\n');
    return false;
  }
}

async function testUniqueEvents() {
  console.log('📝 Test 2: Unique Events (Analytics)');
  const testTxHash = '0xtest_event_' + Date.now();
  
  try {
    // First simulation event - should succeed
    const event1 = await logEvent({
      txHash: testTxHash,
      eventType: 'simulation',
      status: 'success',
      riskLevel: 'HIGH',
      gasUsed: 50000,
      lossUsd: 100,
      profitUsd: 50,
      slippage: 2
    });
    
    if (event1) {
      console.log('  ✅ First simulation event logged:', event1.tx_hash);
    } else {
      console.log('  ❌ First event failed');
      return false;
    }
    
    // Duplicate simulation event - should be skipped
    const event2 = await logEvent({
      txHash: testTxHash,
      eventType: 'simulation',
      status: 'success',
      riskLevel: 'MEDIUM',
      gasUsed: 60000,
      lossUsd: 200,
      profitUsd: 100,
      slippage: 5
    });
    
    if (!event2) {
      console.log('  ✅ Duplicate simulation event correctly skipped');
    } else {
      console.log('  ❌ Duplicate simulation event was NOT skipped!');
      return false;
    }
    
    // Different event_type (protection) - should succeed
    const event3 = await logEvent({
      txHash: testTxHash,
      eventType: 'protection',
      status: 'success',
      riskLevel: 'HIGH',
      gasUsed: 70000,
      lossUsd: 0,
      profitUsd: 100,
      slippage: 0
    });
    
    if (event3) {
      console.log('  ✅ Protection event logged (different event_type allowed)');
    } else {
      console.log('  ❌ Protection event failed');
      return false;
    }
    
    // Verify entries
    const check = await pool.query(
      'SELECT event_type, COUNT(*) as count FROM events_log WHERE tx_hash = $1 GROUP BY event_type ORDER BY event_type',
      [testTxHash]
    );
    
    if (check.rows.length === 2) {
      const simulation = check.rows.find(r => r.event_type === 'simulation');
      const protection = check.rows.find(r => r.event_type === 'protection');
      
      if (simulation && parseInt(simulation.count) === 1 && protection && parseInt(protection.count) === 1) {
        console.log('  ✅ Database verification: 1 simulation + 1 protection event\n');
        return true;
      }
    }
    
    console.log('  ❌ Database verification failed');
    console.log('  Found:', check.rows);
    return false;
  } catch (error) {
    console.log('  ❌ Test failed with error:', error.message, '\n');
    return false;
  }
}

async function checkConstraints() {
  console.log('📝 Test 3: Verify Database Constraints');
  
  try {
    const result = await pool.query(`
      SELECT 
        c.conname as constraint_name,
        c.contype as constraint_type,
        t.relname as table_name
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname IN ('alerts', 'events_log')
      AND c.contype = 'u'
      ORDER BY t.relname, c.conname;
    `);
    
    const alertsConstraint = result.rows.find(r => r.table_name === 'alerts');
    const eventsConstraint = result.rows.find(r => r.table_name === 'events_log');
    
    console.log('  Constraints found:');
    result.rows.forEach(row => {
      console.log(`    - ${row.table_name}: ${row.constraint_name}`);
    });
    
    if (alertsConstraint && eventsConstraint) {
      console.log('  ✅ All required unique constraints are in place\n');
      return true;
    } else {
      console.log('  ❌ Some constraints are missing\n');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Test failed with error:', error.message, '\n');
    return false;
  }
}

async function getDatabaseStats() {
  console.log('📊 Database Statistics');
  
  try {
    // Alerts stats
    const alertsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(DISTINCT tx_hash) as unique_tx_hashes
      FROM alerts;
    `);
    
    console.log('  Alerts Table:');
    console.log(`    Total alerts: ${alertsStats.rows[0].total_alerts}`);
    console.log(`    Unique tx_hashes: ${alertsStats.rows[0].unique_tx_hashes}`);
    
    // Events stats
    const eventsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT tx_hash) as unique_tx_hashes,
        COUNT(DISTINCT (tx_hash, event_type)) as unique_combinations
      FROM events_log;
    `);
    
    console.log('  Events Log Table:');
    console.log(`    Total events: ${eventsStats.rows[0].total_events}`);
    console.log(`    Unique tx_hashes: ${eventsStats.rows[0].unique_tx_hashes}`);
    console.log(`    Unique (tx_hash, event_type): ${eventsStats.rows[0].unique_combinations}`);
    
    // Check for any duplicates that shouldn't exist
    const duplicateCheck = await pool.query(`
      SELECT tx_hash, COUNT(*) as count
      FROM alerts
      GROUP BY tx_hash
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicateCheck.rows.length === 0) {
      console.log('  ✅ No duplicate tx_hashes in alerts table\n');
    } else {
      console.log('  ⚠️ Warning: Found duplicate tx_hashes:', duplicateCheck.rows.length);
    }
    
    return true;
  } catch (error) {
    console.log('  ❌ Stats check failed:', error.message, '\n');
    return false;
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════\n');
  
  const results = [];
  
  results.push(await checkConstraints());
  results.push(await getDatabaseStats());
  results.push(await testUniqueAlerts());
  results.push(await testUniqueEvents());
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY\n');
  
  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Unique transactions implementation is working correctly!\n');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the output above.\n');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

runAllTests();
