// Test script for Proty chatbot endpoint
import axios from 'axios';

const API_URL = 'http://localhost:4000/api/proty';

async function testProty(question) {
  console.log(`\n🤖 Question: "${question}"`);
  console.log('⏳ Processing...\n');
  
  try {
    const response = await axios.post(API_URL, { question });
    console.log('✅ Response:');
    console.log(response.data.reply);
    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('\n🧪 Testing Proty Chatbot\n');
  console.log('='.repeat(80));

  // Test 1: FinTech question
  await testProty('What is DeFi and how does it work?');
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Blockchain question
  await testProty('Explain blockchain technology in simple terms');
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Non-fintech question
  await testProty('What is the capital of France?');
  
  console.log('\n✨ All tests completed!\n');
}

runTests();
