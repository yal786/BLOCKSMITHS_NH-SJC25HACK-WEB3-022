// backend/sim/simulateTx.js
// High-level transaction simulation interface
import { simulateTenderly } from './tenderlyClient.js';

/**
 * Simulate a transaction using Tenderly
 * @param {Object} tx - Transaction object from mempool
 * @returns {Promise<Object>} - Simulation result with status and logs
 */
export async function simulateTenderlyTx(tx) {
  const {
    networkId = '1',
    from,
    to,
    data,
    value = '0x0',
    gas = '8000000',
    gasPrice,
    blockNumber,
  } = tx;

  // Convert gasPrice to hex string if it's a BigInt or number
  let gasPriceHex = gasPrice;
  if (typeof gasPrice === 'bigint' || typeof gasPrice === 'number') {
    gasPriceHex = '0x' + gasPrice.toString(16);
  } else if (gasPrice && !gasPrice.startsWith('0x')) {
    gasPriceHex = '0x' + parseInt(gasPrice).toString(16);
  }

  const result = await simulateTenderly({
    networkId,
    from,
    to,
    input: data || '0x',
    value: value || '0x0',
    gas,
    gasPrice: gasPriceHex,
    blockNumber,
    save: false,
    saveIfFails: true,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      details: result.details,
    };
  }

  // Extract relevant data from Tenderly response
  const simulation = result.data.simulation || result.data;
  
  return {
    success: true,
    status: simulation.status || false,
    gasUsed: simulation.gas_used || 0,
    logs: simulation.transaction?.transaction_info?.logs || simulation.logs || [],
    trace: simulation.transaction?.transaction_info?.call_trace || null,
    explorerUrl: `https://dashboard.tenderly.co/${process.env.TENDERLY_ACCOUNT}/${process.env.TENDERLY_PROJECT}/simulator/${simulation.id}`,
    simulationId: simulation.id,
    blockNumber: simulation.block_number,
    raw: simulation,
  };
}

/**
 * Simulate multiple transactions in sequence (for sandwich attack analysis)
 * @param {Array<Object>} txs - Array of transaction objects
 * @returns {Promise<Array<Object>>} - Array of simulation results
 */
export async function simulateTxSequence(txs) {
  const results = [];
  
  for (const tx of txs) {
    const result = await simulateTenderlyTx(tx);
    results.push(result);
    
    // If any simulation fails, stop the sequence
    if (!result.success || !result.status) {
      break;
    }
  }
  
  return results;
}
