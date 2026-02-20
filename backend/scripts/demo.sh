#!/bin/bash
cd "$(dirname "$0")"

# 1. POINT TO THE VERIFIED PATH (Matches your 'which solana' output)
export PATH="/home/freedomwithin/.local/share/solana/install/active_release/bin:$PATH"

# 2. START BUFFER (Rhythm for your AI song)
echo "🎥 Starting Demo in 10 seconds..."
sleep 10 

# 3. THE "WAKE UP" INJECTION
echo "🛰️  Step 1: Pinging Ledger for Balance Update..."
# Funding your new 5xwpc wallet
solana airdrop 0.4 5xwpcxB8ZEuspaa1NhNTCq2ouPmqV9ZJndT9UnYGRDJq --url devnet || echo "⚠️ Airdrop rate-limited, continuing with existing balance."
sleep 10

# 4. THE HYDRATION
echo "🛡️  Step 2: Simulating Whale Cluster (Gini Spike)..."
# Runs your node script using the .env notary
node hydrate.js
sleep 10

# 5. FINAL NOTARY STEP
echo "🏛️  Step 3: Notarizing Integrity Scores..."
# Move up to find the services folder
cd ..
npx ts-node services/notary_sync.ts

echo "✨ Demo Sequence Complete. Terminal will remain open."

# 6. THE LOCK: Keeps the results visible on screen
exec $SHELL