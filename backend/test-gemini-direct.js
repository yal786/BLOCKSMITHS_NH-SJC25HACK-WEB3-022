import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testGeminiDirect() {
  console.log('\n🧪 Testing Gemini API with Direct HTTP Calls\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ERROR: GEMINI_API_KEY not found in .env file');
    return;
  }
  
  console.log('✅ API Key:', apiKey.substring(0, 20) + '...');
  
  // Test 1: List available models
  console.log('\n📋 Fetching available models...\n');
  
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResponse = await axios.get(listUrl);
    
    console.log('✅ API Key is valid! Found models:');
    console.log('='.repeat(60));
    
    if (listResponse.data.models && listResponse.data.models.length > 0) {
      listResponse.data.models.forEach(model => {
        console.log(`📦 ${model.name}`);
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          console.log('   ✅ Supports generateContent');
        }
      });
      
      // Find first model that supports generateContent
      const workingModel = listResponse.data.models.find(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      if (workingModel) {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 Testing with model:', workingModel.name);
        console.log('='.repeat(60));
        
        // Test 2: Generate content
        const modelName = workingModel.name.split('/').pop(); // Get model name without 'models/' prefix
        const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        console.log('\n📝 Sending test question: "What is blockchain?"\n');
        
        const generateResponse = await axios.post(generateUrl, {
          contents: [{
            parts: [{
              text: "What is blockchain technology? Answer in 2 sentences."
            }]
          }]
        });
        
        const text = generateResponse.data.candidates[0].content.parts[0].text;
        
        console.log('✅ SUCCESS! Response:');
        console.log('='.repeat(60));
        console.log(text);
        console.log('='.repeat(60));
        console.log(`\n✨ Use this model name in code: "${modelName}"\n`);
        
        return modelName;
      } else {
        console.log('\n❌ No models support generateContent');
      }
    } else {
      console.log('❌ No models found for this API key');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('API_KEY_INVALID')) {
      console.log('\n⚠️ Your API key is INVALID or EXPIRED');
      console.log('\n📝 Get a new API key:');
      console.log('   1. Visit: https://aistudio.google.com/app/apikey');
      console.log('   2. Click "Create API Key"');
      console.log('   3. Copy the new key');
      console.log('   4. Update GEMINI_API_KEY in backend/.env');
    } else if (error.response?.status === 403) {
      console.log('\n⚠️ API key does not have permission');
      console.log('   Make sure Gemini API is enabled for your project');
    }
    
    console.log('\n');
  }
}

testGeminiDirect();
