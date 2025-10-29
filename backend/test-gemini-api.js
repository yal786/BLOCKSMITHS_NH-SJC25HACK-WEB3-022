import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function testModelName(modelName) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent("What is blockchain technology? Answer in 2 sentences.");
    const response = await result.response;
    const text = response.text();
    
    return { success: true, text };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testGeminiAPI() {
  console.log('\n🧪 Testing Gemini API Connection\n');
  console.log('='.repeat(60));
  
  // Check if API key exists
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY not found in .env file');
    return;
  }
  
  console.log('✅ API Key found:', process.env.GEMINI_API_KEY.substring(0, 20) + '...');
  console.log('\n📡 Testing different model names...\n');
  
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro'
  ];
  
  let workingModel = null;
  
  for (const modelName of modelsToTest) {
    console.log(`Testing: ${modelName}...`);
    const result = await testModelName(modelName);
    
    if (result.success) {
      console.log(`✅ ${modelName} WORKS!\n`);
      workingModel = { name: modelName, response: result.text };
      break;
    } else {
      console.log(`❌ ${modelName} failed: ${result.error.split('\n')[0]}\n`);
    }
  }
  
  if (workingModel) {
    console.log('='.repeat(60));
    console.log('✨ SUCCESS! Found working model:', workingModel.name);
    console.log('='.repeat(60));
    console.log('Response:');
    console.log(workingModel.response);
    console.log('='.repeat(60));
    console.log(`\n✅ Use model name: "${workingModel.name}" in your code\n`);
  } else {
    console.log('='.repeat(60));
    console.error('❌ No working model found. Please check your API key.');
    console.log('\n⚠️ Visit: https://aistudio.google.com/app/apikey');
    console.log('   Make sure your API key has access to Gemini models.\n');
  }
}

testGeminiAPI();
