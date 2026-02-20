require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
const { RiskAuditorAgent } = require('./agents/RiskAuditorAgent');
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

// --- INSERTED: The "Logic Layer" Visual Root Route ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TrustChain Sentinel | Logic Layer</title>
        <style>
            body { 
                background-color: #000; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                font-family: 'Courier New', Courier, monospace;
                color: #00ff9d;
            }
            .container {
                border: 2px solid #00ff9d;
                padding: 40px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 0 20px rgba(0, 255, 157, 0.2);
                background: rgba(0, 20, 10, 0.1);
            }
            .status-glow {
                display: inline-block;
                width: 10px;
                height: 10px;
                background: #00ff9d;
                border-radius: 50%;
                margin-right: 10px;
                box-shadow: 0 0 10px #00ff9d;
                animation: pulse 2s infinite;
            }
            h1 { font-size: 1.2rem; letter-spacing: 3px; margin-bottom: 20px; text-transform: uppercase; }
            .meta { font-size: 0.7rem; opacity: 0.6; margin-top: 20px; }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
            }
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

// --- Pool Integrity Endpoint ---
app.get('/api/pool/:id/integrity', async (req, res) => {
  const poolId = req.params.id;
  try {
    const baseData = {
      'SOL-USDC': { giniScore: 0.15, topHolders: 12, totalLiquidity: 5000000 },
      'JUP-SOL': { giniScore: 0.22, topHolders: 8, totalLiquidity: 1200000 },
      'RAY-SOL': { giniScore: 0.35, topHolders: 5, totalLiquidity: 300000 }
    };
    const notaryAddr = process.env.NOTARY_PUBLIC_KEY || 'JCq7a2E3r4M3aA2xQm4uXpKdV1FBocWLqUqgjLG81Xcg';
    const notaryPubKey = new PublicKey(notaryAddr);
    const balance = await connection.getBalance(notaryPubKey);
    const solBalance = balance / 1e9;
    const result = {
      ...(baseData[poolId] || baseData['SOL-USDC']),
      notaryBalance: solBalance,
      status: solBalance >= 0.4 ? 'VERIFIED' : 'PROBATIONARY',
      lastSync: new Date().toISOString()
    };
    return res.json(result);
  } catch (error) {
    console.error('Integrity Error:', error);
    return res.status(500).json({ error: 'Failed to fetch on-chain integrity state' });
  }
});

// --- Remaining API Logic (fetchWalletData, verify endpoints, etc.) ---
const fetchWalletData = async (address) => {
  const pubKey = new PublicKey(address);
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

app.get('/api/verify/:address', async (req, res) => {
  const { address } = req.params;
  if (!validateAddress(address)) return res.status(400).json({ error: 'Invalid Solana address format' });
  try {
    const data = await fetchWalletData(address);
    const start = performance.now();
    const result = RiskAuditorAgent.getIntegrityDecision(address, data);
    const end = performance.now();
    res.json({ ...result, latencyMs: Math.round(end - start) });
  } catch (error) {
    res.json({ status: 'OFFLINE', scores: { gini: 0, hhi: 0, syncIndex: 0 } });
  }
});

app.post('/api/verify', async (req, res) => {
  const { address } = req.body;
  try {
    const data = await fetchWalletData(address);
    const start = performance.now();
    const result = RiskAuditorAgent.getIntegrityDecision(address, data);
    const end = performance.now();
    res.json({ ...result, latencyMs: Math.round(end - start) });
  } catch (error) {
    console.error('SENTINEL CRASH:', error);
    res.json({ status: 'OFFLINE', scores: { gini: 0, hhi: 0, syncIndex: 0 } });
  }
});

module.exports = app;
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`TrustChain Solana Backend running on port ${port}`));
}