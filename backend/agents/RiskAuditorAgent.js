const { calculateGini, calculateHHI, checkSyncIndex } = require('../services/integrityEngine');

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
  static getIntegrityDecision(address, data) {
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

    return {
      status,
      scores: { gini, hhi, syncIndex },
      reason
    };
  }
}

module.exports = { RiskAuditorAgent, Configuration };
