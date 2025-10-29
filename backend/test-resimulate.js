// Test script for re-simulation feature
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_BASE = "http://localhost:4000";

// Example transaction hash from Ethereum mainnet
const TEST_TX_HASH = "0xf180c6dbbbbe173c2b483526c40f0a5abc317fb924ce75311338ed09ee298e4a";

async function testResimulation() {
  console.log("🧪 Testing Re-Simulation Feature\n");
  console.log("=" .repeat(60));
  
  try {
    console.log(`\n📡 Sending request to re-simulate transaction:\n${TEST_TX_HASH}\n`);
    
    const response = await axios.post(`${API_BASE}/v1/simulate`, {
      txHash: TEST_TX_HASH,
    });

    if (response.data.ok && response.data.mode === "hash") {
      console.log("✅ SUCCESS! Re-simulation completed.\n");
      
      console.log("📋 Transaction Data:");
      console.log("  From:", response.data.transaction.from);
      console.log("  To:", response.data.transaction.to);
      console.log("  Value:", response.data.transaction.value);
      console.log("  Gas:", response.data.transaction.gas);
      console.log("  Block Number:", response.data.transaction.blockNumber);
      
      if (response.data.simulation) {
        console.log("\n📊 Simulation Results:");
        console.log("  Status:", response.data.simulation.execution_status);
        console.log("  Gas Used:", response.data.simulation.gas_used);
        console.log("  Estimated Loss:", `$${response.data.simulation.estimated_loss_usd}`);
        console.log("  Attacker Profit:", `$${response.data.simulation.attacker_profit_usd}`);
        console.log("  Slippage:", `${response.data.simulation.slippage_percent}%`);
        console.log("\n🔗 Tenderly URL:", response.data.simulation.tenderly_url);
      }
      
      console.log("\n" + "=".repeat(60));
      console.log("✅ Test passed! The re-simulation feature is working correctly.");
    } else {
      console.error("❌ Unexpected response format:", response.data);
    }
  } catch (error) {
    console.error("\n❌ Test failed!");
    console.error("Error:", error.message);
    
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    
    if (error.code === "ECONNREFUSED") {
      console.error("\n⚠️  Make sure the backend server is running on port 4000");
      console.error("   Run: node server.js");
    }
  }
}

// Run the test
console.log("⚠️  Make sure the backend server is running before running this test!");
console.log("   In another terminal, run: node server.js\n");

testResimulation();
