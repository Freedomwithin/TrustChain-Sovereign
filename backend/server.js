require('dotenv').config();
console.log("🏛️ [SENTINEL] System Boot: Initializing Logic Layer...");

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Connection, PublicKey } = require('@solana/web3.js');
const { RiskAuditorAgent } = require('./agents/RiskAuditorAgent');
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

app.use(cors({
  origin: [
    process.env.CORS_ORIGIN,
    'https://trustchain-sovereign-frontend.vercel.app',
    /\.vercel\.app$/,
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Core Data Fetching ---
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
  return { transactions, positions, timestamps, signatures };
};

// --- Routes ---

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Pool Integrity Endpoint (Retaining logic from Main)
app.get('/api/pool/:id/integrity', async (req, res) => {
  const poolId = req.params.id;
  try {
    const baseData = {
      'SOL-USDC': { giniScore: 0.15, topHolders: 12, totalLiquidity: 5000000 },
      'JUP-SOL': { giniScore: 0.22, topHolders: 8, totalLiquidity: 1200000 },
      'RAY-SOL': { giniScore: 0.35, topHolders: 5, totalLiquidity: 300000 }
    };
    const notaryAddr = process.env.NOTARY_PUBLIC_KEY || '6QsEMrsHgnBB2dRVeySrGAi5nYy3eq35w4sywdis1xJ5';
    const balance = await connection.getBalance(new PublicKey(notaryAddr));
    const solBalance = balance / 1e9;

    return res.json({
      ...(baseData[poolId] || baseData['SOL-USDC']),
      notaryBalance: solBalance,
      status: solBalance >= 0.05 ? 'ONLINE' : 'LOW_FUNDS',
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch pool state' });
  }
});

// Main Verification Route (Refactored for Feature branch Agent)
app.post('/api/verify', async (req, res) => {
  const { address } = req.body;
  const start = performance.now();

  if (!validateAddress(address)) return res.status(400).json({ status: 'INVALID_ADDRESS' });

  try {
    const data = await fetchWalletData(address);
    // Verified async execution for RiskAuditorAgent
    // Call the newly async getIntegrityDecision from the merged Agent
    const result = await RiskAuditorAgent.getIntegrityDecision(address, data);
    
    const end = performance.now();
    result.latencyMs = Math.round(end - start);
    
    res.json(result);
  } catch (error) {
    console.error("Verification error:", error);
    res.json({ status: 'OFFLINE', scores: { gini: 0, hhi: 0, syncIndex: 0 } });
  }
});

app.listen(port, () => {
  console.log(`🏛️  SENTINEL ACTIVE ON PORT ${port}`);
});

module.exports = app;