/**
 * TrustChain Integrity Engine - Sentinel V2.1
 * Logic: Gini Coefficient + HHI Concentration + Temporal Sync Index
 */

const calculateGini = (transactions) => {
  if (!transactions || transactions.length < 3) return 0.5; // Probationary default

  const values = transactions.map(tx => Math.abs(tx.amount)).sort((a, b) => a - b);
  const n = values.length;
  let sumDiff = 0;
  let sumValue = 0;

  for (let i = 0; i < n; i++) {
    sumValue += values[i];
    for (let j = 0; j < n; j++) {
      sumDiff += Math.abs(values[i] - values[j]);
    }
  }

  if (sumValue === 0) return 0;
  const denominator = 2 * Math.pow(n, 2) * (sumValue / n);
  return sumDiff / denominator;
};

const calculateHHI = (positions) => {
  if (!positions || positions.length === 0) return 0;
  const totalLiquidity = positions.reduce((sum, p) => sum + p.value, 0);
  if (totalLiquidity === 0) return 0;
  return positions.reduce((hhi, p) => hhi + Math.pow((p.value / totalLiquidity) * 100, 2), 0) / 10000;
};

const checkSyncIndex = (signatures) => {
  if (!signatures || signatures.length < 2) return 0;
  const timestamps = signatures
    .map(s => s.blockTime)
    .filter(t => t != null)
    .sort((a, b) => a - b);
  const clusters = timestamps.filter((t, i) => i > 0 && (t - timestamps[i - 1]) <= 2);
  return clusters.length / signatures.length;
};

const analyzeWalletIntegrity = async (address, data) => {
  const gini = calculateGini(data.transactions);
  const hhi = calculateHHI(data.positions);
  const syncIndex = checkSyncIndex(data.signatures);

  let status = 'VERIFIED';
  let reason = 'Behavior aligns with organic patterns.';

  if (data.transactions.length < 3) {
    status = 'PROBATIONARY';
    reason = 'Insufficient transaction history for full analysis.';
  } else if (syncIndex > 0.35 || gini > 0.7) {
    status = 'SYBIL';
    reason = 'High temporal synchronization or extreme value inequality detected.';
  }

  return {
    status,
    scores: { gini, hhi, syncIndex },
    reason
  };
};

module.exports = {
  calculateGini,
  calculateHHI,
  checkSyncIndex,
  analyzeWalletIntegrity
};
