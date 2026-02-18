#!/bin/bash
set -e

echo "Running Sovereign Verification Workflow..."

echo "1. Testing Sentinel Logic (Backend)..."
node backend/tests/sentinel.test.js

echo "2. Testing Frontend Integrity..."
yarn workspace trustchain-vite test run

echo "✅ Sovereign Verification Complete."
