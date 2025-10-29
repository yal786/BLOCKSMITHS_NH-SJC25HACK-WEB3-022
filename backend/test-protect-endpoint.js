// Quick test for /v1/protect endpoint
import axios from 'axios';

const TEST_SIGNED_TX = "0xf86b8202b28477359400825208944592d8f8d7b001e72cb26a73e4fa1806a51ac79d880de0b6b3a7640000802ca05924bde7ef10aa88db9c66dd4f5fb16b46dff2319b9968be983118b57bb50562a001b24b31010004f13d9a26b320845257a6cfc2bf819a3d55e3fc86263c5f0772";

async function testProtectEndpoint() {
  try {
    console.log('🧪 Testing /v1/protect endpoint...\n');
    
    const response = await axios.post('http://localhost:4000/v1/protect', {
      signedRawTx: TEST_SIGNED_TX,
      alertTxHash: '0xtest123456789abc',
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is backend running on port 4000?');
    }
  }
}

testProtectEndpoint();
