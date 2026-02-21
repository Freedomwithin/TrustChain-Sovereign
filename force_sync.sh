#!/bin/bash
set -e

echo "🚀 Starting TrustChain Force Sync..."

# Ensure corepack is enabled for Yarn Berry
corepack enable

echo "📦 Syncing Notary State..."
yarn workspace trustchain-backend sync:notary

echo "✅ Force Sync Complete!"
