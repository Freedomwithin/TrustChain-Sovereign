const { calculateGini, calculateHHI, checkSyncIndex } = require('../services/integrityEngine');
const { submitNotarization } = require('../utils/solanaBridge');

class Configuration {
  static PROBATIONARY_SYNC_INDEX_THRESHOLD = 0.35;
  static GINI_THRESHOLD = 0.7;
  static MIN_TRANSACTIONS = 3;
}

class RiskAuditorAgent {
  /**
   * Evaluates wallet integrity based on Gini, HHI, and Sync Index.
   * @param {string} address - The wallet address being analyzed.
   * @param {object} data - The wallet data (transactions, positions, signatures).
   * @returns {object} - The decision object containing status, scores, and reason.
   */
  static async notarizeDecision(address, decision) {
    if (decision.status === 'SYBIL') {
      console.error(`[SECURITY EVENT] Sybil detected for wallet: ${address}`);
    } else if (decision.status === 'VERIFIED') {
      try {
        await submitNotarization(address, decision.status, decision.scores.gini, decision.scores.hhi);
      } catch (error) {
        console.error(`[NOTARY ERROR] Failed to notarize verified wallet ${address}:`, error.message);
        // Do not throw, so the backend response isn't affected by blockchain issues
      }
    }
  }

  static async getIntegrityDecision(address, data) {
    const gini = calculateGini(data.transactions);
    const hhi = calculateHHI(data.positions);
    const syncIndex = checkSyncIndex(data.signatures);

    let status = 'VERIFIED';
    let reason = 'Behavior aligns with organic patterns.';

    // Decision Logic using Configuration thresholds
    if (!data.transactions || data.transactions.length < Configuration.MIN_TRANSACTIONS) {
      status = 'PROBATIONARY';
      reason = 'Insufficient transaction history for full analysis.';
    } else if (syncIndex > Configuration.PROBATIONARY_SYNC_INDEX_THRESHOLD || gini > Configuration.GINI_THRESHOLD) {
      status = 'SYBIL';
      reason = 'High temporal synchronization or extreme value inequality detected.';
    }

    const decision = {
      status,
      scores: { gini, hhi, syncIndex },
      reason
    };

    // Make this async to handle the side effect (notarization)
    await RiskAuditorAgent.notarizeDecision(address, decision);

    return decision;
  }
}

module.exports = { RiskAuditorAgent, Configuration };
