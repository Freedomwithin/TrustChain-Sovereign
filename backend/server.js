const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');

const app = express();

// Use the Vercel Environment Variable, with a fallback for local dev
const port = process.env.PORT || 3001;

// Solana Mainnet RPC
const rpcEndpoint = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(rpcEndpoint, 'confirmed');

// Middleware - Includes Jules' CORS fix for port 5173
app.use(cors({
  origin: ['https://trustchain-2-frontend.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'TrustChain Solana API Active' }));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/api/pool/:id/integrity', async (req, res) => {
  const poolId = req.params.id;
  await delay(500);

  if (process.env.MOCK_MODE !== 'false') {
    const mockData = {
      'SOL-USDC': {
        giniScore: 0.25,
        integrityScore: 88,
        extractivenessScore: 0.05,
        topHolders: 15,
        totalLiquidity: 5000000
      },
      'JUP-SOL': {
        giniScore: 0.42,
        integrityScore: 72,
        extractivenessScore: 0.35,
        topHolders: 8,
        totalLiquidity: 1200000
      },
      'RAY-SOL': {
        giniScore: 0.78,
        integrityScore: 34,
        extractivenessScore: 0.85,
        topHolders: 3,
        totalLiquidity: 300000
      }
    };

    const data = mockData[poolId] || {
      giniScore: 0,
      integrityScore: 0,
      extractivenessScore: 0,
      topHolders: 0,
      totalLiquidity: 0
    };
    return res.json(data);
  }

  return res.status(501).json({ error: 'Real integrity check not implemented' });
});

app.get('/api/wallet/:address/history', async (req, res) => {
  try {
    const { address } = req.params;
    const pubKey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 15 });
    res.json(signatures);
  } catch (error) {
    console.error('Solana RPC Error:', error);
    res.status(500).json({ error: 'Failed to fetch Solana history' });
  }
});

app.listen(port, () => {
  console.log(`TrustChain Solana Backend running on port ${port}`);
});