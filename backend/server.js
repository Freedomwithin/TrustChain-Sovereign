require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
const { RiskAuditorAgent } = require('./agents/RiskAuditorAgent');
// Note: sentinel.js provides the advanced Max-Signal calculateSyncIndex
const { calculateGini, calculateHHI } = require('./services/integrityEngine');
const { calculateSyncIndex } = require('./utils/sentinel');
const { fetchWithRetry } = require('./utils/rpc');
const { performance } = require('perf_hooks');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const port = process.env.PORT || 3001;

const rpcEndpoint = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(rpcEndpoint, 'confirmed');

const validateAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaRegex.test(address);
};

app.use(cors({
  origin: ['https://trustchain-sovereign-frontend.vercel.app', /\.vercel\.app$/, 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// --- Root Route (Visual Logic Layer) ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TrustChain Sentinel | Logic Layer</title>
        <style>
            body { background-color: #000; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: 'Courier New', Courier, monospace; color: #0011ff; }
            .container { border: 2px solid #0011ff; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 0 20px rgba(44, 24, 160, 0.4); background: rgba(0, 5, 20, 0.2); }
            .status-glow { display: inline-block; width: 10px; height: 10px; background: #0011ff; border-radius: 50%; margin-right: 10px; box-shadow: 0 0 10px #0400ff; animation: pulse 2s infinite; }
            h1 { font-size: 1.2rem; letter-spacing: 3px; margin-bottom: 20px; text-transform: uppercase; }
            .meta { font-size: 0.7rem; opacity: 0.6; margin-top: 20px; color: #fff; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>TRUSTCHAIN SENTINEL</h1>
            <div><span class="status-glow"></span> LOGIC LAYER ACTIVE</div>
            <div class="meta">V2.1 BASELINE: WEIGHTED TEMPORAL DETECTION</div>
        </div>
    </body>
    </html>
  `);
});

// --- Pool Integrity Endpoint (STRICT) ---
app.get('/api/pool/:id/integrity', async (req, res) => {
  const poolId = req.params.id;
  try {
    const baseData = {
      'SOL-USDC': { giniScore: 0.15, topHolders: 12, totalLiquidity: 5000000 },
      'JUP-SOL': { giniScore: 0.22, topHolders: 8, totalLiquidity: 1200000 },
      'RAY-SOL': { giniScore: 0.35, topHolders: 5, totalLiquidity: 300000 }
    };
    const notaryAddr = process.env.NOTARY_PUBLIC_KEY || 'JCq7a2E3r4M3aA2xQm4uXpKdV1FBocWLqUqgjLG81Xcg';
    const balance = await connection.getBalance(new PublicKey(notaryAddr));
    const solBalance = balance / 1e9;

    return res.json({
      ...(baseData[poolId] || baseData['SOL-USDC']),
      notaryBalance: solBalance,
      status: solBalance >= 1.0 ? 'VERIFIED' : 'PROBATIONARY',
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch on-chain integrity state' });
  }
});

const fetchWalletData = async (address) => {
  const pubKey = new PublicKey(address);
  const signatures = await fetchWithRetry(() => connection.getSignaturesForAddress(pubKey, { limit: 15 }));
  const transactions = [];
  const positions = [];
  const timestamps = [];

  for (const sigInfo of signatures) {
    try {
      await delay(200);
      const tx = await fetchWithRetry(() => connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 }));
      if (!tx || !tx.meta) continue;

      if (sigInfo.blockTime) timestamps.push(sigInfo.blockTime);

      const accountIndex = tx.transaction.message.accountKeys.findIndex(key => key.pubkey.toBase58() === address);
      if (accountIndex !== -1) {
        const amount = Math.abs((tx.meta.preBalances[accountIndex] || 0) - (tx.meta.postBalances[accountIndex] || 0));
        transactions.push({ amount });
        positions.push({ value: amount });
      }
    } catch (err) { continue; }
  }
  return { transactions, positions, timestamps };
};

// --- Main Verification Logic (The "Institutional" Flow) ---
app.post('/api/verify', async (req, res) => {
  const { address } = req.body;
  const start = performance.now();

  try {
    const rawData = await fetchWalletData(address);

    // Fetch Economic Weight for the Agent
    const notaryAddr = process.env.NOTARY_PUBLIC_KEY || 'JCq7a2E3r4M3aA2xQm4uXpKdV1FBocWLqUqgjLG81Xcg';
    const balance = await connection.getBalance(new PublicKey(notaryAddr));
    const solBalance = balance / 1e9;

    // 1. Calculate weighted temporal sync (Burst + CV)
    const sentinelResults = calculateSyncIndex(rawData.timestamps);

    // 2. Build the score object using the weighted syncIndex
    const scores = {
      gini: calculateGini(rawData.transactions.map(t => t.amount)),
      hhi: calculateHHI(rawData.positions.map(p => p.value)),
      syncIndex: sentinelResults.syncIndex // The Max-Signal value
    };

    // 3. Final Decision by Agent (Strict 1.0 SOL + Maturity + Behavior)
    const result = RiskAuditorAgent.getIntegrityDecision(scores, rawData.transactions.length, solBalance);

    res.json({
      ...result,
      latencyMs: Math.round(performance.now() - start)
    });
  } catch (error) {
    res.json({ status: 'OFFLINE', scores: { gini: 0, hhi: 0, syncIndex: 0 } });
  }
});

module.exports = app;
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`TrustChain Sovereign Backend running on port ${port}`));
}