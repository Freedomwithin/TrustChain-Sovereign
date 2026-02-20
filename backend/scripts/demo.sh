#!/bin/bash

# 1. POINT TO THE VERIFIED HOME FOLDER
export PATH="/home/freedomwithin/solana-release/bin:$PATH"

# 2. START BUFFER (Aligned echo and sleep)
echo "🎥 Starting Demo in 10 seconds..."
sleep 10 

# 3. THE "WAKE UP" INJECTION
echo "🛰️  Step 1: Pinging Ledger for Balance Update..."
# Trying for 0.4 to push your 0.93 balance over the 1.2 threshold
solana airdrop 0.4 SVRQGjRmizi3Lvv4vHmtW4x6ap7dKs65QVooUdnbZuJ --url devnet || echo "⚠️ Airdrop rate-limited, continuing with existing balance."
sleep 6

# 4. THE HYDRATION
echo "🛡️  Step 2: Simulating Whale Cluster (Gini Spike)..."
node hydrate.js
sleep 7

# 5. FINAL NOTARY STEP
echo "🏛️  Step 3: Notarizing Integrity Scores..."
cd ..
ts-node services/notary_sync.ts

echo "✨ Demo Sequence Complete. Terminal will remain open."

# 6. THE LOCK: This prevents the window from closing
exec $SHELL