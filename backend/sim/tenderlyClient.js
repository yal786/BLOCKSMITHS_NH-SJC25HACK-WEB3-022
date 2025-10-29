// backend/sim/tenderlyClient.js
// Tenderly API client for transaction simulation
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const TENDERLY_ACCOUNT = process.env.TENDERLY_ACCOUNT;
const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT;
const TENDERLY_ACCESS_KEY = process.env.TENDERLY_ACCESS_KEY;

if (!TENDERLY_ACCOUNT || !TENDERLY_PROJECT || !TENDERLY_ACCESS_KEY) {
  console.warn("⚠️ Tenderly credentials not fully configured in .env - simulation features will be disabled");
}

/**
 * Simulate a transaction using Tenderly API
 * @param {Object} params - Simulation parameters
 * @returns {Promise<Object>} - Simulation result
 */
export async function simulateTenderly(params) {
  const {
    networkId = '1',
    from,
    to,
    input = '0x',
    value = '0x0',
    gas = '8000000',
    gasPrice,
    blockNumber,
    save = false,
    saveIfFails = true
  } = params;

  if (!TENDERLY_ACCESS_KEY) {
    throw new Error("Tenderly API key not configured");
  }

  const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}/simulate`;

  const payload = {
    network_id: networkId,
    from,
    to,
    input,
    value,
    gas: parseInt(gas),
    save,
    save_if_fails: saveIfFails,
  };

  // Add optional parameters
  if (gasPrice) {
    payload.gas_price = gasPrice;
  }
  if (blockNumber) {
    payload.block_number = blockNumber;
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': TENDERLY_ACCESS_KEY,
      },
      timeout: 30000, // 30 second timeout
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Tenderly simulation error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data,
    };
  }
}

/**
 * Check if Tenderly is configured
 */
export function isTenderlyConfigured() {
  return !!(TENDERLY_ACCOUNT && TENDERLY_PROJECT && TENDERLY_ACCESS_KEY);
}

export default {
  simulate: simulateTenderly,
  isConfigured: isTenderlyConfigured,
};
