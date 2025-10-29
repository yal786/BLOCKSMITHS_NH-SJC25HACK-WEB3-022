// backend/sim/analyzeSimulation.js
// Parse and analyze simulation results to extract token transfers and slippage
import { ethers } from 'ethers';

// ERC20 Transfer event ABI
const ERC20_TRANSFER_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const ERC20_IFACE = new ethers.Interface(ERC20_TRANSFER_ABI);

/**
 * Parse Tenderly simulation to extract token transfers
 * @param {Object} simResult - Result from simulateTenderlyTx
 * @param {Object} options - Filtering options
 * @returns {Object} - Parsed simulation data
 */
export function parseTenderlySimulation(simResult, options = {}) {
  const {
    victimAddressLower = null,
    tokenAddressLower = null,
  } = options;

  if (!simResult.success) {
    return {
      success: false,
      error: simResult.error,
      tokenOut: null,
      explorerUrl: null,
    };
  }

  const transfers = [];
  let victimTokenOut = null;

  // Parse logs to find Transfer events
  if (simResult.logs && simResult.logs.length > 0) {
    for (const log of simResult.logs) {
      try {
        // Filter by token address if specified
        if (tokenAddressLower && log.address?.toLowerCase() !== tokenAddressLower) {
          continue;
        }

        // Try to parse as ERC20 Transfer event
        const parsed = ERC20_IFACE.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (parsed && parsed.name === 'Transfer') {
          const transfer = {
            token: log.address.toLowerCase(),
            from: parsed.args.from.toLowerCase(),
            to: parsed.args.to.toLowerCase(),
            value: parsed.args.value.toString(),
          };

          transfers.push(transfer);

          // Check if this is a transfer TO the victim
          if (victimAddressLower && transfer.to === victimAddressLower) {
            victimTokenOut = transfer.value;
          }
        }
      } catch (err) {
        // Not a Transfer event or parsing failed, skip
      }
    }
  }

  return {
    success: simResult.success,
    status: simResult.status,
    tokenOut: victimTokenOut,
    transfers,
    gasUsed: simResult.gasUsed,
    explorerUrl: simResult.explorerUrl,
    simulationId: simResult.simulationId,
    raw: simResult.raw,
  };
}

/**
 * Extract the output token amount for a specific recipient
 * @param {Object} simResult - Simulation result
 * @param {string} recipientAddress - Address of the recipient
 * @param {string} tokenAddress - Address of the token (optional)
 * @returns {string|null} - Token amount as string or null
 */
export function extractTokenOutput(simResult, recipientAddress, tokenAddress = null) {
  const parsed = parseTenderlySimulation(simResult, {
    victimAddressLower: recipientAddress.toLowerCase(),
    tokenAddressLower: tokenAddress?.toLowerCase(),
  });

  return parsed.tokenOut;
}

/**
 * Compare two simulations to detect sandwich attack impact
 * @param {Object} baselineSimResult - Simulation without frontrun
 * @param {Object} attackSimResult - Simulation with frontrun
 * @param {string} victimAddress - Victim's address
 * @param {string} tokenAddress - Token address (optional)
 * @returns {Object} - Comparison result with impact metrics
 */
export function compareSandwichSimulations(baselineSimResult, attackSimResult, victimAddress, tokenAddress = null) {
  const baselineParsed = parseTenderlySimulation(baselineSimResult, {
    victimAddressLower: victimAddress.toLowerCase(),
    tokenAddressLower: tokenAddress?.toLowerCase(),
  });

  const attackParsed = parseTenderlySimulation(attackSimResult, {
    victimAddressLower: victimAddress.toLowerCase(),
    tokenAddressLower: tokenAddress?.toLowerCase(),
  });

  if (!baselineParsed.tokenOut || !attackParsed.tokenOut) {
    return {
      success: false,
      error: 'Could not extract token outputs from simulations',
    };
  }

  const baselineOut = BigInt(baselineParsed.tokenOut);
  const attackOut = BigInt(attackParsed.tokenOut);
  const diff = baselineOut - attackOut;

  // Calculate percentage impact
  const impactPct = baselineOut > 0n 
    ? Number((diff * 10000n) / baselineOut) / 100 
    : 0;

  return {
    success: true,
    baselineOut: baselineParsed.tokenOut,
    attackOut: attackParsed.tokenOut,
    difference: diff.toString(),
    impactPct,
    baselineExplorerUrl: baselineParsed.explorerUrl,
    attackExplorerUrl: attackParsed.explorerUrl,
  };
}

/**
 * Analyze gas usage difference between simulations
 * @param {Object} baselineSimResult - Baseline simulation
 * @param {Object} attackSimResult - Attack simulation
 * @returns {Object} - Gas analysis
 */
export function analyzeGasImpact(baselineSimResult, attackSimResult) {
  const baselineGas = baselineSimResult.gasUsed || 0;
  const attackGas = attackSimResult.gasUsed || 0;
  const gasDiff = attackGas - baselineGas;

  return {
    baselineGas,
    attackGas,
    gasDifference: gasDiff,
    gasIncreasePct: baselineGas > 0 ? (gasDiff / baselineGas) * 100 : 0,
  };
}
