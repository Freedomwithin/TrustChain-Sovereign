/**
 * TrustChain Integrity Engine
 * Logic: Dual Gatekeeper (FairScale + Gini/HHI)
 * Ported to CommonJS for stability and deployment.
 */

/**
 * Calculates the Gini Coefficient to detect wealth/liquidity concentration.
 * Range: 0 (Perfect Equality) to 1 (Total Inequality)
 */
const calculateGini = (values) => {
  if (!values || values.length < 2) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  let sumOfAbsoluteDifferences = 0;
  let sumOfValues = 0;

  for (let i = 0; i < n; i++) {
    sumOfValues += sorted[i];
    for (let j = 0; j < n; j++) {
      sumOfAbsoluteDifferences += Math.abs(sorted[i] - sorted[j]);
    }
  }

  if (sumOfValues === 0) return 0;
  return sumOfAbsoluteDifferences / (2 * n * sumOfValues);
};

/**
 * Calculates HHI as a gas-efficient proxy for on-chain concentration.
 */
const calculateHHI = (values) => {
  if (!values || values.length === 0) return 0;
  const total = values.reduce((acc, val) => acc + val, 0);
  if (total === 0) return 0;

  // HHI = Sum of squares of percentage shares
  return values.reduce((acc, val) => {
    const share = (val / total) * 100;
    return acc + (share * share);
  }, 0) / 10000; // Normalized 0-1
};

module.exports = {
  calculateGini,
  calculateHHI
};
