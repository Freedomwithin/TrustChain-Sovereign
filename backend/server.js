const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');

const app = express();
const port = 3001;

// Solana Mainnet RPC (using public endpoint for demo)
const rpcEndpoint = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(rpcEndpoint, 'confirmed');

// Middleware
app.use(cors({
  origin: ['https://trustchain-2-frontend.vercel.app', /\.vercel\.app$/],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Root route
app.get('/', (req, res) => res.json({ status: 'TrustChain Solana API Active' }));

// Helper to delay response (prevent rate limits)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * MOCK_MODE: Returns hardcoded integrity data to bypass RPC rate limits.
 * Real logic would query Solana history for the pool address.
 */
app.get('/api/pool/:id/integrity', async (req, res) => {
  const poolId = req.params.id;

  // Simulate network delay
  await delay(500);

  if (process.env.MOCK_MODE !== 'false') {
    // MOCK DATA for specific pools (aligned with frontend)
  const mockData = {
    'SOL-USDC': {
      giniScore: 0.25,
      extractivenessScore: 0.05, // Low Risk
      topHolders: 15,
      totalLiquidity: 5000000
    },
    'JUP-SOL': {
      giniScore: 0.42,
      extractivenessScore: 0.35, // Medium Risk
      topHolders: 8,
      totalLiquidity: 1200000
    },
    'RAY-SOL': {
      giniScore: 0.78,
      extractivenessScore: 0.85, // High Risk
      topHolders: 3,
      totalLiquidity: 300000
    }
  };

    const data = mockData[poolId] || {
      giniScore: 0,
      extractivenessScore: 0,
      topHolders: 0,
      totalLiquidity: 0
    };
    return res.json(data);
  }

  // Real logic placeholder (would call integrityEngine if enabled)
  return res.status(501).json({ error: 'Real integrity check not implemented in this demo version' });
});

// Real endpoint to fetch Solana transaction history (Optional usage)
app.get('/api/wallet/:address/history', async (req, res) => {
  try {
    const { address } = req.params;
    const pubKey = new PublicKey(address);

    // Fetch last 15 signatures
    const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 15 });

    res.json(signatures);
  } catch (error) {
    console.error('Solana RPC Error:', error);
    res.status(500).json({ error: 'Failed to fetch Solana history' });
  }
});

// Standardized Verification Endpoint
app.post('/api/verify', async (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  // Simulate analysis delay
  await delay(300);

  // MOCK LOGIC: Return a determinstic pseudo-random Gini score based on address
  // This ensures consistent results for the same wallet without a database
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const normalizedHash = Math.abs(hash) % 1000; // 0-999
  // Scale to 0.0 - 0.5 range (mostly safe)
  const giniScore = normalizedHash / 2000;

  return res.json({ giniScore });
});

// Start server
app.listen(port, () => {
  console.log(`TrustChain Solana Backend running on port ${port}`);
});
