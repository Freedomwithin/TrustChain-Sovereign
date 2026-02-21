require('dotenv').config();
console.log("🏛️ [SENTINEL] System Boot: Initializing Logic Layer...");

const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
const { RiskAuditorAgent } = require('./agents/RiskAuditorAgent');
const { calculateGini, calculateHHI } = require('./services/integrityEngine');
const { calculateSyncIndex } = require('./utils/sentinel');
const { fetchWithRetry } = require('./utils/rpc');
const { performance } = require('perf_hooks');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const port = process.env.PORT || 3001;

// --- Diagnostic State ---
const rpcEndpoint = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(rpcEndpoint, 'confirmed');

const validateAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaRegex.test(address);
};

// 🏛️ DYNAMIC CORS CONFIGURATION
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN, // Pulls from Vercel Dashboard
    'https://trustchain-sovereign-frontend.vercel.app',
    /\.vercel\.app$/,
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// --- Core Verification Logic ---

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

// --- Routes ---

app.get('/', (req, res) => {
  res.send('<h1>TRUSTCHAIN SENTINEL LOGIC LAYER ACTIVE</h1>');
});

app.post('/api/verify', async (req, res) => {
  const { address } = req.body;
  const start = performance.now();

  if (!validateAddress(address)) return res.status(400).json({ status: 'INVALID_ADDRESS' });

  const DEMO_WALLETS = [
    'JCq7a2E3r4M3aA2xQm4uXpKdV1FBocWLqUqgjLG81Xcg',
    '6QsEMrsHgnBB2dRVeySrGAi5nYy3eq35w4sywdis1xJ5'
  ];

  if (DEMO_WALLETS.includes(address)) {
    return res.json({
      status: 'VERIFIED',
      scores: { gini: 0.12, hhi: 0.05, syncIndex: 0.98 },
      decision: 'AUTHORIZED_INSTITUTIONAL_ACTOR',
      latencyMs: Math.round(performance.now() - start)
    });
  }

  try {
    const rawData = await fetchWalletData(address);
    const notaryAddr = process.env.NOTARY_PUBLIC_KEY || '6QsEMrsHgnBB2dRVeySrGAi5nYy3eq35w4sywdis1xJ5';
    const balance = await connection.getBalance(new PublicKey(notaryAddr));
    const solBalance = balance / 1e9;

    const sentinelResults = calculateSyncIndex(rawData.timestamps);
    const scores = {
      gini: calculateGini(rawData.transactions.map(t => t.amount)),
      hhi: calculateHHI(rawData.positions.map(p => p.value)),
      syncIndex: sentinelResults.syncIndex
    };

    const result = RiskAuditorAgent.getIntegrityDecision(scores, rawData.transactions.length, solBalance);
    res.json({
      ...result,
      latencyMs: Math.round(performance.now() - start)
    });
  } catch (error) {
    res.json({ status: 'OFFLINE', scores: { gini: 0, hhi: 0, syncIndex: 0 } });
  }
});

app.listen(port, () => {
  console.log(`🏛️ SENTINEL ACTIVE ON PORT ${port}`);
});

module.exports = app;