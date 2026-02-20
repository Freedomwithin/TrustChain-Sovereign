require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
const { RiskAuditorAgent } = require('./agents/RiskAuditorAgent');
const { fetchWithRetry } = require('./utils/rpc');
const { performance } = require('perf_hooks');

const app = express();
const port = process.env.PORT || 3001;

const rpcEndpoint = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(rpcEndpoint, 'confirmed');

app.use(cors({
  origin: ['https://trustchain-sovereign-frontend.vercel.app', /\.vercel\.app$/, 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// --- Pool Integrity Endpoint ---
app.get('/api/pool/:id/integrity', async (req, res) => {
  const poolId = req.params.id;

  try {
    const baseData = {
      'SOL-USDC': { giniScore: 0.25, topHolders: 15, totalLiquidity: 5000000 },
      'JUP-SOL': { giniScore: 0.42, topHolders: 8, totalLiquidity: 1200000 },
      'RAY-SOL': { giniScore: 0.78, topHolders: 3, totalLiquidity: 300000 }
    };

    // Use ENV or fallback to your current active wallet
    const notaryAddr = process.env.NOTARY_PUBLIC_KEY || '5xwpcxB8ZEuspaa1NhNTCq2ouPmqV9ZJndT9UnYGRDJq';
    const notaryPubKey = new PublicKey(notaryAddr);

    const balance = await connection.getBalance(notaryPubKey);
    const solBalance = balance / 1e9;

    const result = {
      ...(baseData[poolId] || baseData['SOL-USDC']),
      notaryBalance: solBalance,
      status: solBalance > 0.5 ? 'VERIFIED' : 'PROBATIONARY',
      lastSync: new Date().toISOString()
    };

    return res.json(result);
  } catch (error) {
    console.error('Integrity Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch on-chain integrity state' });
  }
});

// --- Shared Logic ---
const fetchWalletData = async (address) => {
  const pubKey = new PublicKey(address);
  // Fetch last 15 transactions for temporal analysis
  const signatures = await fetchWithRetry(() => connection.getSignaturesForAddress(pubKey, { limit: 15 }));

  const transactions = [];
  const positions = [];

  for (const sigInfo of signatures) {
    try {
        await delay(200);
        const tx = await fetchWithRetry(() => connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 }));
        if (!tx || !tx.meta) continue;

        const accountIndex = tx.transaction.message.accountKeys.findIndex(key => key.pubkey.toBase58() === address);
        if (accountIndex !== -1) {
          const pre = tx.meta.preBalances[accountIndex] || 0;
          const post = tx.meta.postBalances[accountIndex] || 0;
          const amount = Math.abs(pre - post);
          transactions.push({ amount });
          positions.push({ value: amount });
        }
    } catch (err) { continue; }
  }

  return { signatures, transactions, positions };
};

// --- Wallet Integrity Endpoints ---
app.get('/api/verify/:address', validateAddress, setEdgeCache, async (req, res) => {
  const { address } = req.params;

  // Global Mock Mode Guard
  if (process.env.MOCK_MODE === 'true') {
    return res.json({
      status: 'VERIFIED',
      scores: { gini: 0.1, hhi: 0.05, syncIndex: 0.1 },
      reason: 'Mock verification (Environment MOCK_MODE=true)'
    });
  }

  try {
    const data = await fetchWalletData(address);
    const start = performance.now();
    const result = RiskAuditorAgent.getIntegrityDecision(address, data);
    const end = performance.now();
    result.latencyMs = Math.round(end - start);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/verify', async (req, res) => {
  const { address } = req.body;

  try {
    // 1. Fetch the data
    const data = await fetchWalletData(address);

    // 2. SAFETY CHECK: Prevents the 500 crash if wallet is empty
    if (!data || !data.transactions || data.transactions.length === 0) {
      return res.json({
        status: 'PROBATIONARY',
        scores: { gini: 0, hhi: 0, syncIndex: 0 },
        reason: 'New Identity: Insufficient history for notarization.'
      });
    }

    // 3. Calculation
    const start = performance.now();
    const result = RiskAuditorAgent.getIntegrityDecision(address, data);
    const end = performance.now();

    res.json({
      ...result,
      latencyMs: Math.round(end - start)
    });

  } catch (error) {
    console.error('SENTINEL CRASH:', error);
    // Returning a 200 with an error object prevents the CORS/NetworkError
    res.json({
      status: 'OFFLINE',
      error: 'Internal Logic Error',
      scores: { gini: 0, hhi: 0, syncIndex: 0 }
    });
  }
});

// Vercel Serverless Export
module.exports = app;

// Keep listen for local dev
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`TrustChain Solana Backend running on port ${port}`));
}