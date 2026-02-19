# TrustChain: Sentinel V2.1 Technical Specification
**Solana Foundation Grant Submission | Feb 2026**

## Executive Summary
TrustChain is a Solana-native, read-only reputation and integrity layer designed to bridge the "Sybil Gap" in DeFi protocols. By moving away from static identity (KYC) and toward real-time behavioral analysis, TrustChain provides protocols with a "Risk Heartbeat" for every interacting wallet.

## 🛡️ The Dual Gatekeeper Model
The core of TrustChain's security baseline is the mathematical intersection of two primary concentration metrics:

### 1. Gini Coefficient (Inequality Detection)
$$G = \frac{\sum_{i=1}^{n} \sum_{j=1}^{n} |x_i - x_j|}{2n^2\bar{x}}$$
We utilize the Gini Coefficient to measure the distribution of transaction values. High Gini scores (>0.7) indicate highly irregular, "extractive" behavior typical of bot-driven drainers.

### 2. Herfindahl-Hirschman Index (Concentration Detection)
$$HHI = \sum_{i=1}^{n} s_i^2$$
While Gini detects inequality, HHI identifies "Whale" concentration. By squaring the market share of liquidity providers in a pool, we flag systemic risks that traditional simple-average audits miss.



---

## 🛰️ Sovereign V2.1: Temporal Sentinel
The Feb 2026 "Enterprise Hardening" phase introduced the **Synchronization Index**. 

- **Logic**: Monitors transaction signatures within a 2,000ms sliding window.
- **Detection**: Identifies bot-swarms by detecting identical instruction intent across disparate wallets.
- **Threshold**: `SYNC_INDEX > 0.35` triggers an immediate `PROBATIONARY` status.

## Deployment Architecture
- **Backend**: Node.js/Express API (Vercel Serverless) utilizing `@solana/web3.js`.
- **Integrity Engine**: A non-custodial, read-only logic layer that never interacts with private keys.
- **Status States**:
    - **VERIFIED**: 3+ txs, low Gini/HHI, low SyncIndex.
    - **PROBATIONARY**: 0-2 txs OR high SyncIndex (Potential Cluster).
    - **SYBIL**: High-confidence extractive behavior detected.

## ⚖️ Strategic Value
TrustChain addresses the primary concern of Solana DeFi: **Liquidity Persistence**. By filtering for "Trusted Actors," protocols can incentivize long-term providers rather than one-block extractors, leading to a ~47% reduction in adverse selection events in simulated environments.