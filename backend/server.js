require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
const { calculateGini, calculateHHI } = require('./integrityEngine');
const { calculateSyncIndex } = require('./utils/sentinel');

const app = express();
const port = process.env.PORT || 3001;

// Solana Mainnet RPC
const rpcEndpoint = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(rpcEndpoint, 'confirmed');

// Middleware - Updated origin to match your live Vercel domains
app.use(cors({
  origin: ['https://trustchain-sovereign-frontend.vercel.app', /\.vercel\.app$/],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

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
app.get('/api/pool/:id/integrity', async (req, res) => {
  const poolId = req.params.id;
  await delay(500);

  if (process.env.MOCK_MODE !== 'false') {
    const mockData = {
      'SOL-USDC': { giniScore: 0.25, extractivenessScore: 0.05, topHolders: 15, totalLiquidity: 5000000 },
      'JUP-SOL': { giniScore: 0.42, extractivenessScore: 0.35, topHolders: 8, totalLiquidity: 1200000 },
      'RAY-SOL': { giniScore: 0.78, extractivenessScore: 0.85, topHolders: 3, totalLiquidity: 300000 }
    };
    const data = mockData[poolId] || { giniScore: 0.5, status: 'PROBATIONARY', extractivenessScore: 0.5 };
    return res.json(data);
  }
  return res.status(501).json({ error: 'Real integrity check not implemented' });
});

// --- Wallet Integrity Endpoint ---
app.post('/api/verify', async (req, res) => {
  const { address } = req.body;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  if (!address || typeof address !== 'string' || !base58Regex.test(address)) {
    return res.status(400).json({ error: 'Invalid Solana wallet address format' });
  }

  // Hardcoded Testing Cases for Grant Recording
  if (address === '11111111111111111111111111111111') return res.json({ giniScore: 0.5, status: 'PROBATIONARY' });
  if (address === '22222222222222222222222222222222') return res.json({ giniScore: 0.1, hhiScore: 0.05, status: 'VERIFIED' });

  try {
    const pubKey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 5 });

    if (signatures.length < 3) {
      return res.json({
        giniScore: 0.5,
        hhiScore: 0,
        status: 'PROBATIONARY'
      });
    }

    const values = [];
    const timestamps = [];
    for (const sigInfo of signatures) {
      if (sigInfo.blockTime) timestamps.push(sigInfo.blockTime);
      try {
        await delay(200);
        const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
        if (!tx || !tx.meta) continue;

        const accountIndex = tx.transaction.message.accountKeys.findIndex(key => key.pubkey.toBase58() === address);
        if (accountIndex !== -1) {
          const pre = tx.meta.preBalances[accountIndex] || 0;
          const post = tx.meta.postBalances[accountIndex] || 0;
          values.push(Math.abs(pre - post));
        }
      } catch (err) { continue; }
    }

    const realGini = calculateGini(values);
    const hhiScore = calculateHHI(values);
    const { syncIndex } = calculateSyncIndex(timestamps);

    const trustFactor = Math.min((signatures.length - 2) / 3, 1);
    const giniScore = (0.5 * (1 - trustFactor)) + (realGini * trustFactor);

    let status = 'VERIFIED';
    let reason = undefined;

    if (syncIndex > 0.35) {
      status = 'PROBATIONARY';
      reason = 'High syncIndex detected (Potential Cluster)';
    }

    return res.json({ giniScore, hhiScore, syncIndex, status, reason });

  } catch (error) {
    console.error('Error calculating integrity:', error);
    return res.json({ giniScore: 0.5, hhiScore: 0, status: 'ERROR' });
  }
});

// Vercel Serverless Export
module.exports = app;

// Keep listen for local dev
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`TrustChain Solana Backend running on port ${port}`));
}