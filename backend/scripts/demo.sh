#!/bin/bash

# 1. POINT TO THE VERIFIED HOME FOLDER
export PATH="/home/freedomwithin/solana-release/bin:$PATH"

# 2. START BUFFER (s)
echo "🎥 Starting Demo in 5 seconds..."
sleep 10 

# 3. THE "WAKE UP" INJECTION (Lower amount to avoid rate limits)
echo "🛰️  Step 1: Pinging Ledger for Balance Update..."
# We use 0.1 SOL; even if it fails, the script continues
solana airdrop 0.1 SVRQGjRmizi3Lvv4vHmtW4x6ap7dKs65QVooUdnbZuJ --url devnet || echo "⚠️ Airdrop rate-limited, but we have enough SOL to continue."
sleep 6

# 4. THE HYDRATION (This is the meat of the demo)
echo "🛡️  Step 2: Simulating Whale Cluster (Gini Spike)..."
node hydrate.js
sleep 7

# 5. FINAL NOTARY STEP (Identity Proof)
echo "🏛️  Step 3: Notarizing Integrity Scores..."
cd ..
ts-node services/notary_sync.ts

echo "✨ Demo Sequence Complete. Total time: ~28 seconds."