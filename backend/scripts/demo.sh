#!/bin/bash
cd "$(dirname "$0")"

# 1. SET THE PATH
export PATH="/home/freedomwithin/.local/share/solana/install/active_release/bin:$PATH"

# 2. START BUFFER (Shortened for pacing)
echo "🎥 Starting Demo in 10 seconds..."
sleep 10

# 3. THE "WAKE UP" (Airdrop is fast)
echo "🛰️  Step 1: Pinging Ledger..."
solana airdrop 0.4 JCq7a2E3r4M3aA2xQm4uXpKdV1FBocWLqUqgjLG81Xcg --url devnet > /dev/null 2>&1
sleep 10

# 4. THE HYDRATION (The Gini Spike)
echo "🛡️  Step 2: Simulating Whale Cluster..."
node hydrate.js
sleep 10 # Brief pause for the block to confirm

# 5. FINAL NOTARY STEP
echo "🏛️  Step 3: Notarizing Integrity Scores..."
cd ..
npx ts-node services/notary_sync.ts

echo "✨ Demo Sequence Complete. Results Locked."

# 6. KEEP TERMINAL OPEN
exec $SHELL