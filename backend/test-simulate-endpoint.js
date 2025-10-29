// Test script to verify /v1/simulate endpoint
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 4000}`;

async function testSimulateEndpoint() {
  console.log("🧪 Testing Re-simulation Endpoint\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Tenderly Account: ${process.env.TENDERLY_ACCOUNT}`);
  console.log(`Tenderly Project: ${process.env.TENDERLY_PROJECT}`);
  console.log(`Has Access Key: ${!!process.env.TENDERLY_ACCESS_KEY}\n`);

  // Test 1: Health check
  try {
    console.log("1️⃣ Testing health check...");
    const health = await axios.get(`${BASE_URL}/`);
    console.log("✅ Health check passed:", health.data);
  } catch (err) {
    console.error("❌ Health check failed:", err.message);
    console.log("⚠️  Make sure the backend server is running!");
    return;
  }

  // Test 2: Re-simulation with a real Ethereum transaction hash
  try {
    console.log("\n2️⃣ Testing re-simulation with transaction hash...");
    
    // Using a real Ethereum transaction hash (a simple ETH transfer)
    const testTxHash = "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060";
    
    console.log(`Transaction Hash: ${testTxHash}`);
    console.log("Sending POST request to /v1/simulate...\n");
    
    const response = await axios.post(`${BASE_URL}/v1/simulate`, {
      txHash: testTxHash
    }, {
      timeout: 45000, // 45 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ Re-simulation succeeded!");
    console.log("\n📊 Response Data:");
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.simulation) {
      console.log("\n📈 Simulation Results:");
      console.log(`  Status: ${response.data.simulation.execution_status}`);
      console.log(`  Gas Used: ${response.data.simulation.gas_used}`);
      console.log(`  Estimated Loss: $${response.data.simulation.estimated_loss_usd}`);
      console.log(`  Attacker Profit: $${response.data.simulation.attacker_profit_usd}`);
      console.log(`  Slippage: ${response.data.simulation.slippage_percent}%`);
      if (response.data.simulation.tenderly_url) {
        console.log(`  Tenderly URL: ${response.data.simulation.tenderly_url}`);
      }
    }
    
  } catch (err) {
    console.error("\n❌ Re-simulation failed!");
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(`Error: ${JSON.stringify(err.response.data, null, 2)}`);
    } else {
      console.error(`Error: ${err.message}`);
    }
  }
}

testSimulateEndpoint();
