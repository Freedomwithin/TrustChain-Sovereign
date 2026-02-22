#!/bin/bash
set -e

echo "🚀 Starting TrustChain Sovereign Setup..."

echo "🔑 Syncing Anchor Keys..."
anchor keys sync

echo "🏗️ Building Anchor Program..."
anchor build

echo "📝 Updating Environment Variables..."
node scripts/update_env.js

echo "✅ Setup Complete!"
