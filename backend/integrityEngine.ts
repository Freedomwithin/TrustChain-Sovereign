// integrityEngine.ts - TrustChain LP Integrity Engine v2.0.0

export interface LiquidityEvent {
  wallet: string;
  poolId: string;
  timestamp: number;
  amount: number;
  type: 'add' | 'remove';
}

export interface IntegrityScores {
  giniScore: number;
  persistenceScore: number;
  extractivenessScore: number;
}

// MAIN EXPORT
export function calculateIntegrity(poolId: string, events: LiquidityEvent[]): IntegrityScores {
  const contributions = computeWalletContributions(events);
  const gini = computeGini(contributions);
  const persistence = timeWeightedPersistence(events);
  return {
    giniScore: gini,
    persistenceScore: persistence,
    extractivenessScore: gini * (1 - persistence)
  };
}

// ALL EXPORTS
export function computeWalletContributions(events: LiquidityEvent[]): number[] {
  const walletTotals: Record<string, number> = {};
  for (const event of events) {
    walletTotals[event.wallet] = (walletTotals[event.wallet] || 0) + event.amount;
  }
  return Object.values(walletTotals).filter(v => v > 0);
}

export function computeGini(contributions: number[]): number {
  const n = contributions.length;
  if (n < 2) return 0;
  const sorted = [...contributions].sort((a, b) => a - b);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += sorted[i] * (2 * i - n + 1);
  }
  const total = sorted.reduce((a, b) => a + b, 0);
  return total > 0 ? sum / (n * n * total) : 0;
}

export function timeWeightedPersistence(events: LiquidityEvent[]): number {
  const windows = [1, 10, 3600];
  let totalScore = 0;
  let windowCount = 0;
  for (const window of windows) {
    const windowScore = calculateWindowPersistence(events, window);
    totalScore += windowScore;
    windowCount++;
  }
  return windowCount > 0 ? totalScore / windowCount : 0;
}

export function calculateWindowPersistence(events: LiquidityEvent[], windowSize: number): number {
  const sessions: Record<string, { start: number; end: number | null }[]> = {};
  for (const event of events) {
    const wallet = event.wallet;
    if (!sessions[wallet]) sessions[wallet] = [];
    const lastSession = sessions[wallet][sessions[wallet].length - 1];
    if (event.type === 'add') {
      if (!lastSession || lastSession.end !== undefined) {
        sessions[wallet].push({ start: event.timestamp, end: null });
      }
    } else {
      if (lastSession && lastSession.end === null) {
        lastSession.end = event.timestamp;
      }
    }
  }

  let totalPersistence = 0;
  let walletCount = 0;
  for (const walletSessions of Object.values(sessions)) {
    for (const session of walletSessions) {
      if (session.end !== null) {
        const duration = session.end - session.start;
        const normalized = Math.min(duration / windowSize, 1);
        totalPersistence += normalized > 0.1 ? normalized : 0;
      }
    }
    walletCount++;
  }
  return walletCount > 0 ? totalPersistence / walletCount : 0;
}

// TEST DIRECTLY FROM ENGINE
if (require.main === module) {
  const events: LiquidityEvent[] = [
    { wallet: "A", poolId: "test", timestamp: 1, amount: 1000, type: "add" },
    { wallet: "A", poolId: "test", timestamp: 2, amount: -1000, type: "remove" },
    { wallet: "B", poolId: "test", timestamp: 1, amount: 100, type: "add" },
    { wallet: "B", poolId: "test", timestamp: 3600, amount: 50, type: "add" }
  ];
  console.log(calculateIntegrity("test", events));
}
