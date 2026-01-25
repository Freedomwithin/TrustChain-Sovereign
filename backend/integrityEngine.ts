// integrityEngine.ts
interface LiquidityEvent {
  wallet: string;
  poolId: string;
  timestamp: number; // block or unix
  amount: number;    // liquidity added/removed (positive/negative)
  type: 'add' | 'remove';
}

interface IntegrityScores {
  giniScore: number;      // 0-1, higher = more unequal
  persistenceScore: number; // 0-1, higher = more stable
  extractivenessScore: number; // 0-1, higher = more predatory
}

export function calculateIntegrity(
  poolId: string, 
  events: LiquidityEvent[]
): IntegrityScores {
  const contributions = computeWalletContributions(events);
  const gini = computeGini(contributions);
  const persistence = timeWeightedPersistence(events);
  return {
    giniScore: gini,
    persistenceScore: persistence,
    extractivenessScore: gini * (1 - persistence) // composable metric
  };
}

function computeWalletContributions(events: LiquidityEvent[]): number[] {
  // Group by wallet, net contribution over time
  const walletTotals: Record<string, number> = {};
  for (const event of events) {
    walletTotals[event.wallet] = (walletTotals[event.wallet] || 0) + event.amount;
  }
  return Object.values(walletTotals).filter(v => v > 0);
}

function computeGini(contributions: number[]): number {
  // Standard Gini coefficient (0 = equal, 1 = max inequality)
  const n = contributions.length;
  if (n < 2) return 0;
  
  const sorted = [...contributions].sort((a, b) => a - b);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += sorted[i] * (2 * i - n + 1);
  }
  return sum / (n * n * sorted.reduce((a, b) => a + b, 0));
}

function timeWeightedPersistence(events: LiquidityEvent[]): number {
  // Track presence across time windows: 1blk, 10blk, 1hr
  const windows = [1, 10, 3600]; // blocks or seconds
  let totalScore = 0;
  let windowCount = 0;
  
  for (const window of windows) {
    const windowScore = calculateWindowPersistence(events, window);
    totalScore += windowScore;
    windowCount++;
  }
  
  return totalScore / windowCount;
}

function calculateWindowPersistence(
  events: LiquidityEvent[], 
  windowSize: number
): number {
  // Penalize: enter+exit same window
  // Reward: continuous presence across window
  const sessions: Record<string, {start: number, end: number}[]> = {};
  
  for (const event of events) {
    const wallet = event.wallet;
    if (!sessions[wallet]) sessions[wallet] = [];
    
    const lastSession = sessions[wallet][sessions[wallet].length - 1];
    if (event.type === 'add') {
      if (!lastSession || lastSession.end) {
        sessions[wallet].push({ start: event.timestamp, end: null });
      }
    } else { // remove
      if (lastSession && !lastSession.end) {
        lastSession.end = event.timestamp;
      }
    }
  }
  
  // Score: length of sessions relative to window size, penalize short churn
  let totalPersistence = 0;
  let walletCount = 0;
  
  for (const walletSessions of Object.values(sessions)) {
    for (const session of walletSessions) {
      if (session.end) {
        const duration = session.end - session.start;
        const normalized = Math.min(duration / windowSize, 1);
        totalPersistence += normalized > 0.1 ? normalized : 0; // ignore dust churn
      }
    }
    walletCount++;
  }
  
  return walletCount > 0 ? totalPersistence / walletCount : 0;
}
