#!/bin/bash
# TrustChain Sovereign: Institutional Demo Sequence
cd "$(dirname "$0")"

# 1. SET THE PATH (Sovereign Local)
export PATH="/home/freedomwithin/.local/share/solana/install/active_release/bin:$PATH"

# 2. START BUFFER (The "Focus" Window)
echo "🎥 Starting Demo in 10 seconds..."
echo "Identity: 6QsEMrsHgnBB2dRVeySrGAi5nYy3eq35w4sywdis1xJ5"
sleep 10

# 3. THE "WAKE UP" (Establish Initial History)
echo "🛰️  Step 1: Pinging Ledger (Initial Airdrop)..."
# Using 0.4 to keep balance high but realistic
solana airdrop 0.4 6QsEMrsHgnBB2dRVeySrGAi5nYy3eq35w4sywdis1xJ5 --url devnet > /dev/null 2>&1
sleep 10

# 4. THE HYDRATION (The Behavioral Pattern)
echo "🛡️  Step 2: Simulating Behavioral Cluster (Whale vs. Dust)..."
# This runs your Gini/HHI engine logic
node hydrate.js
sleep 10 # Essential for Block Confirmation and Sentinel Analysis

# 5. FINAL NOTARY STEP (On-Chain Finality)
echo "🏛️  Step 3: Notarizing Integrity Scores to PDA..."
# Moving to root to ensure ts-node finds the Sovereign services
cd ..
npx ts-node services/notary_sync.ts

echo "----------------------------------------------------"
echo "✨ Demo Sequence Complete. Results Locked on Devnet."
echo "Logic Layer Active. Check Dashboard for Verified Status."
echo "----------------------------------------------------"

# 6. KEEP TERMINAL OPEN FOR LOGS
exec $SHELL