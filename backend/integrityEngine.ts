/**
 * TrustChain Integrity Engine
 * Logic: Dual Gatekeeper (FairScale + Gini/HHI)
 */

export interface LiquidityEvent {
  signature: string; // Solana Transaction Signature
  wallet: string;
  poolId: string;
  timestamp: number;
  amount: number;
  type: 'add' | 'remove';
}

/**
 * Calculates the Gini Coefficient to detect wealth/liquidity concentration.
 * Range: 0 (Perfect Equality) to 1 (Total Inequality)
 */
export const calculateGini = (values: number[]): number => {
  if (values.length < 2) return 0;
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

  // Corrected math to avoid the "0.25" bug Jules found
  return sumOfAbsoluteDifferences / (2 * n * sumOfValues);
};

/**
 * Calculates HHI as a gas-efficient proxy for on-chain concentration.
 */
export const calculateHHI = (values: number[]): number => {
  const total = values.reduce((acc, val) => acc + val, 0);
  if (total === 0) return 0;

  // HHI = Sum of squares of percentage shares
  return values.reduce((acc, val) => {
    const share = (val / total) * 100;
    return acc + (share * share);
  }, 0) / 10000; // Normalized 0-1
};

/**
 * Dual Gatekeeper Logic
 * Cross-references FairScale Tier with local Integrity Score
 */
export const checkLpEligibility = async (
  fairScoreTier: number,
  walletEvents: LiquidityEvent[]
): Promise<{ eligible: boolean; reason?: string; gini: number }> => {

  // 1. Calculate concentration based on current balances
  // Optimize: Scan only the last 15 signatures to prevent timeouts
  const recentEvents = walletEvents.slice(-15);

  const balances = recentEvents.reduce((acc: Record<string, number>, event) => {
    acc[event.wallet] = (acc[event.wallet] || 0) + Math.abs(event.amount);
    return acc;
  }, {});

  const gini = calculateGini(Object.values(balances));

  // 2. Dual Gatekeeper Check (Referencing AGENT.md rules)
  // Rule 1: FairScale Tier >= 2
  // Rule 2: Gini <= 0.3
  if (fairScoreTier < 2) {
    return { eligible: false, reason: "FairScale Tier insufficient (Sybil risk)", gini };
  }

  if (gini > 0.3) {
    return { eligible: false, reason: "Gini coefficient too high (Extractive behavior)", gini };
  }

  return { eligible: true, gini };
};