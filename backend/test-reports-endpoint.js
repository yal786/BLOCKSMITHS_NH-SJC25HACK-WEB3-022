// Test the reports endpoint
import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:4000';

console.log('🧪 Testing Reports Endpoints\n');
console.log('=' .repeat(60));

// Test 1: JSON Endpoint
console.log('\n📊 Test 1: JSON Report Endpoint');
console.log('Calling: GET /v1/reports/full');
try {
  const response = await fetch(`${BASE_URL}/v1/reports/full`);
  const data = await response.json();
  
  if (data.ok) {
    console.log('✅ JSON endpoint working!');
    console.log(`   - Alerts: ${data.report.alerts.length}`);
    console.log(`   - Simulations: ${data.report.simulations.length}`);
    console.log(`   - Protections: ${data.report.protections.length}`);
    console.log(`   - Audit Logs: ${data.report.auditLogs.length}`);
    console.log(`   - Total Events: ${data.report.analytics.totalEvents}`);
    console.log(`   - Generated At: ${data.report.generatedAt}`);
  } else {
    console.log('❌ JSON endpoint failed:', data.error);
  }
} catch (error) {
  console.log('❌ Error calling JSON endpoint:', error.message);
}

// Test 2: PDF Endpoint
console.log('\n📄 Test 2: PDF Report Endpoint');
console.log('Calling: GET /v1/reports/full/pdf');
try {
  const response = await fetch(`${BASE_URL}/v1/reports/full/pdf`);
  
  if (response.ok) {
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    
    console.log('✅ PDF endpoint working!');
    console.log(`   - Content-Type: ${contentType}`);
    console.log(`   - Content-Disposition: ${contentDisposition}`);
    
    // Save PDF to file
    const buffer = await response.arrayBuffer();
    const testPdfPath = './test-report.pdf';
    fs.writeFileSync(testPdfPath, Buffer.from(buffer));
    console.log(`   - PDF saved to: ${testPdfPath}`);
    console.log(`   - File size: ${(buffer.byteLength / 1024).toFixed(2)} KB`);
  } else {
    const data = await response.json();
    console.log('❌ PDF endpoint failed:', data.error);
  }
} catch (error) {
  console.log('❌ Error calling PDF endpoint:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🎉 Testing Complete!\n');
