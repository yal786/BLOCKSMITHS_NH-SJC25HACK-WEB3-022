// Comprehensive test script for Proty chatbot with Protego functionality
import axios from 'axios';

const API_URL = 'http://localhost:4000/api/proty';

async function testProty(testName, question) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🧪 Test: ${testName}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📝 Question: "${question}"`);
  console.log('⏳ Processing...\n');
  
  try {
    const response = await axios.post(API_URL, { question });
    console.log('✅ Response:');
    console.log(response.data.reply);
    console.log('\n✓ Test passed!');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.log('\n✗ Test failed!');
    return false;
  }
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  PROTY CHATBOT - COMPREHENSIVE TEST SUITE         ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('\nTesting Protego-focused chatbot functionality...\n');

  const tests = [];

  // Test 1: Empty message
  tests.push(await testProty('Empty Message', ''));
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Greeting - "hi"
  tests.push(await testProty('Greeting - Hi', 'hi'));
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Greeting - "hello"
  tests.push(await testProty('Greeting - Hello', 'hello'));
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Protego question
  tests.push(await testProty('Protego Platform', 'What is Protego?'));
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 5: MEV question
  tests.push(await testProty('MEV Protection', 'How does Protego protect against MEV attacks?'));
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 6: Workflow question
  tests.push(await testProty('Protego Workflow', 'Explain the Protego workflow'));
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 7: Blockchain question
  tests.push(await testProty('Blockchain Technology', 'What is blockchain technology?'));
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 8: Flashbots question
  tests.push(await testProty('Flashbots', 'What is Flashbots and how does it work?'));
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 9: Simulation question
  tests.push(await testProty('Transaction Simulation', 'How does Protego simulate transactions?'));
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 10: Analytics question
  tests.push(await testProty('Analytics & Reports', 'What analytics does Protego provide?'));
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 11: Non-related question
  tests.push(await testProty('Unrelated Question', 'What is the capital of France?'));

  // Summary
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                      ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  
  const passed = tests.filter(t => t).length;
  const failed = tests.filter(t => !t).length;
  
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Proty is working perfectly!\n');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.\n');
  }
}

console.log('\n⚠️ Make sure backend server is running on port 4000!');
console.log('Starting tests in 3 seconds...\n');

setTimeout(runAllTests, 3000);
