// No longer need to import calculation services here as server.js handles it 
// and passes the results to the agent for the final decision.

class Configuration {
  // Sync Index: Lower = Human, Higher = Bot/Scripted
  static PROBATIONARY_SYNC_INDEX_THRESHOLD = 0.35;
  // Gini: Lower = Equal spread, Higher = Single massive extractor move
  static GINI_THRESHOLD = 0.7;
  static MIN_TRANSACTIONS = 3;
}

class RiskAuditorAgent {
  /**
   * 🏛️ The Decision Engine
   * @param {object} scores - { gini, hhi, syncIndex }
   * @param {number} txCount - Number of signatures found
   * @param {number} notaryBalance - SOL balance of the Notary wallet
   */
  static getIntegrityDecision(scores, txCount, notaryBalance) {
    const { gini, hhi, syncIndex } = scores;

    let status = 'VERIFIED';
    let reason = 'Behavior aligns with organic patterns.';

    // 1. Probationary Check (New Wallets)
    if (txCount < Configuration.MIN_TRANSACTIONS) {
      status = 'PROBATIONARY';
      reason = 'Insufficient transaction history for full analysis.';
    }
    // 2. Sybil Detection (Bot or Extractor behavior)
    else if (syncIndex > Configuration.PROBATIONARY_SYNC_INDEX_THRESHOLD || gini > Configuration.GINI_THRESHOLD) {
      status = 'SYBIL';
      reason = 'High temporal synchronization or extreme inequality detected.';
    }
    // 3. Notary Health Check (Safety fallback)
    else if (notaryBalance < 0.05) {
      status = 'PROBATIONARY';
      reason = 'Institutional Notary offline or low on SOL gas.';
    }

    return {
      status,
      scores: {
        gini: parseFloat(gini.toFixed(4)),
        hhi: parseFloat(hhi.toFixed(4)),
        syncIndex: parseFloat(syncIndex.toFixed(4))
      },
      reason,
      decision: status === 'VERIFIED' ? 'AUTHORIZED_ACTOR' : 'RELEVANT_RISK_DETECTED'
    };
  }
}

module.exports = { RiskAuditorAgent, Configuration };