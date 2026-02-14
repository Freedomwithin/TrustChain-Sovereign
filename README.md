# TrustChain: Solana-Native Integrity Layer

**Status:** Live Fullstack MVP (Solana Mainnet/Testnet Ready)
**Grant Phase:** Resubmission - Enterprise Hardening Phase

## The Evolution
TrustChain has successfully transitioned from an Osmosis-based concept to a **Solana-native reputation and integrity engine**. We solve the "Sybil Gap" in DeFi by cross-referencing on-chain behavior with research-backed concentration metrics.

## High-Velocity Agentic Workflow
This repository is managed by an **Agentic Swarm**, enabling enterprise-grade development velocity:
- **Architect:** Jonathon (Human)
- **Agentic Coder:** Jules (Gemini 3 Pro)
- **Logic Auditor:** Claude (Security Audit)

## Dual Gatekeeper Protocol (Live)
TrustChain proactively blocks extractive behavior using a two-tier verification system:
1. **Gini Coefficient:** Detects wealth/liquidity inequality in real-time.
2. **HHI Index:** Measures concentration to identify "Whale" manipulation that Gini might miss.

**Current Logic:** - **0-2 Transactions:** Flagged as `PROBATIONARY` (New Entity).
- **3+ Transactions:** Full Gini/HHI calculation enabled for `VERIFIED` status.

## Tech Stack
- **Frontend:** React 18, Vite, TailwindCSS
- **Backend:** Node.js, Express, @solana/web3.js
- **Wallet:** Phantom / Solflare Integration
- **Infrastructure:** Vercel (Production Deployed)

## Enterprise Hardening (Feb 2026)
- [x] Base58 Wallet Address Regex Validation
- [x] Environment Variable Security (RPC Encapsulation)
- [x] Adversarial Security Test Suite
- [x] Dynamic Status Mapping (Trusted/Probationary/Insufficient Data)
