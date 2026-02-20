require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
const { RiskAuditorAgent } = require('./agents/RiskAuditorAgent');
const { fetchWithRetry } = require('./utils/rpc');
const { performance } = require('perf_hooks');

const app = express();
const port = process.env.PORT || 3001;

// Solana Mainnet RPC
if (!process.env.SOLANA_RPC_URL) {
  console.warn('Warning: SOLANA_RPC_URL not set in environment.');
}
const rpcEndpoint = process.env.SOLANA_RPC_URL;
const connection = new Connection(rpcEndpoint, 'confirmed');

// Middleware - Updated origin to match your live Vercel domains
app.use(cors({
  origin: ['https://trustchain-sovereign-frontend.vercel.app', /\.vercel\.app$/],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// --- Security Middleware ---
const validateAddress = (req, res, next) => {
  const { address } = req.params;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  if (!base58Regex.test(address)) {
    return res.status(400).json({
      error: "Invalid Solana Address",
      message: "Address failed Base58 security validation."
    });
  }
  next();
};

// --- Caching Middleware ---
const setEdgeCache = (req, res, next) => {
  res.set('Cache-Control', 's-maxage=1, stale-while-revalidate=5');
  next();
};

// --- Root Route (The Sovereign Landing Page) ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TrustChain Sentinel | API</title>
        <style>
            body { 
                background: #0a0a0a; color: #00ffa3; font-family: 'Courier New', monospace; 
                display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; 
            }
            .container { 
                border: 1px solid #00ffa3; padding: 2rem; border-radius: 12px; 
                box-shadow: 0 0 20px rgba(0, 255, 163, 0.15); text-align: center;
                max-width: 400px;
            }
            .status { color: #fff; margin-bottom: 1.5rem; font-weight: bold; }
            .pulse { 
                display: inline-block; width: 12px; height: 12px; background: #00ffa3; 
                border-radius: 50%; margin-right: 10px; animation: pulse 2s infinite; 
            }
            @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
            .version { font-size: 0.85rem; color: #444; margin-top: 1.5rem; border-top: 1px solid #222; padding-top: 1rem; }
            h1 { font-size: 1.5rem; letter-spacing: 2px; margin-top: 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>TRUSTCHAIN SENTINEL</h1>
            <div class="status"><span class="pulse"></span> LOGIC LAYER ACTIVE</div>
            <p>V2.1 Baseline: Weighted Temporal Detection</p>
            <div class="version">Status: Mainnet-Beta | 17 Days to Grant</div>
        </div>
    </body>
    </html>
  `);
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Pool Integrity Endpoints ---
// --- Pool Integrity Endpoints ---
app.get('/api/pool/:id/integrity', setEdgeCache, async (req, res) => {
  const poolId = req.params.id;

  try {
    const baseData = {
      'SOL-USDC': { giniScore: 0.25, topHolders: 15, totalLiquidity: 5000000 },
      'JUP-SOL': { giniScore: 0.42, topHolders: 8, totalLiquidity: 1200000 },
      'RAY-SOL': { giniScore: 0.78, topHolders: 3, totalLiquidity: 300000 }
    };

    const notaryPubKey = new PublicKey('SVRQGjRmizi3Lvv4vHmtW4x6ap7dKs65QVooUdnbZuJ');
    const balance = await connection.getBalance(notaryPubKey);
    const solBalance = balance / 1e9;

    const result = {
      ...(baseData[poolId] || baseData['SOL-USDC']),
      notaryBalance: solBalance,
      // Change 0.5 to 1.2 for the demo flip
      status: solBalance > 0.6 ? 'VERIFIED' : 'PROBATIONARY',
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
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  if (!address || typeof address !== 'string' || !base58Regex.test(address)) {
    return res.status(400).json({ error: 'Invalid Solana wallet address format' });
  }

  // Global Mock Mode Guard & Hardcoded Cases
  if (process.env.MOCK_MODE === 'true') {
    if (address === '11111111111111111111111111111111') return res.json({ status: 'PROBATIONARY', scores: { gini: 0.5 } });
    return res.json({
        status: 'VERIFIED',
        scores: { gini: 0.1, hhi: 0.05, syncIndex: 0.1 },
        reason: 'Mock verification'
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
    console.error('Error calculating integrity:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Vercel Serverless Export
module.exports = app;

// Keep listen for local dev
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`TrustChain Solana Backend running on port ${port}`));
}