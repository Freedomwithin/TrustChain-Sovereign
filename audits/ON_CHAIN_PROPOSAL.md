# Proposal: Moving TrustChain Integrity Logic On-Chain

## Executive Summary
To satisfy the requirements for Solana and Osmosis grants, TrustChain must transition its integrity and gatekeeper logic from a centralized backend to a verifiable on-chain architecture. This document outlines the proposed technical approach to achieve this using Oracles, Smart Contracts, and verifiable attestations.

## 1. Current Architecture (Off-Chain)
- **Integrity Engine**: Running on Node.js/Express.
- **FairScale Integration**: API calls to external server.
- **Verification**: `checkLpEligibility` executes in the backend.
- **Risk**: Centralized point of failure and opacity.

## 2. Proposed On-Chain Architecture

### A. Oracle Integration for FairScale Scores
Since FairScale reputation tiers are calculated off-chain, we need a secure way to bring them on-chain.

*   **Approach 1: Signed Attestations (Recommended)**
    *   The FairScale API signs a payload: `{ wallet: "0x...", tier: 3, timestamp: 12345, nonce: ... }` using a known private key.
    *   The **Gatekeeper Contract** verifies the signature against the public key stored on-chain.
    *   **Pros**: Gas efficient, no continuous oracle updates needed.
    *   **Cons**: Requires FairScale to implement signing.

*   **Approach 2: Push Oracle (Switchboard/Pyth)**
    *   A decentralized oracle network periodically fetches and pushes scores to an on-chain aggregator.
    *   **Pros**: Fully decentralized.
    *   **Cons**: Higher latency and cost.

### B. On-Chain Gini Calculation
Calculating the Gini coefficient on-chain for a large set of LPs is computationally expensive (requires sorting).

*   **Solution: The "Incremental Inequality Index" (HHI)**
    *   Instead of Gini, use the **Herfindahl-Hirschman Index (HHI)**: $H = \sum s_i^2$ (sum of squared market shares).
    *   **Why?** HHI is highly correlated with Gini but can be updated incrementally without sorting.
    *   **Implementation**:
        *   Contract stores `sum_shares_squared` and `total_liquidity`.
        *   On `deposit(amount)`: Update total, update user's share square.
        *   Gas cost: O(1).

### C. The Gatekeeper Contract
We will deploy a smart contract (CosmWasm for Osmosis, Anchor Program for Solana) that acts as the final decision maker.

**Logic:**
```rust
fn claim_rewards(ctx: Context, attestation: FairScaleAttestation) -> Result<()> {
    // 1. Verify FairScale Tier (Oracle/Signature)
    verify_signature(attestation)?;
    require!(attestation.tier >= 2, "FairScore too low");

    // 2. check Internal Fairness (On-chain Data)
    let inequality_score = self.calculate_hhi(ctx.accounts.pool);
    require!(inequality_score <= MAX_INEQUALITY_THRESHOLD, "Pool distribution too concentrated");

    // 3. Distribute Rewards
    token::transfer(...)
}
```

## 3. Implementation Plan (Grant Milestones)

### Phase 1: Osmosis (CosmWasm)
1.  Deploy `IntegrityContract.wasm` storing HHI metrics for pools.
2.  Implement `FairScaleOracle` contract to store authorized signers.
3.  Modify LP reward distribution to check `IntegrityContract`.

### Phase 2: Solana (Anchor)
1.  Port logic to Rust/Anchor.
2.  Use **Switchboard Functions** to fetch FairScale API data and verify Gini logic in a trusted execution environment (TEE) if on-chain calculation is too heavy.

## 4. Immediate Next Steps
1.  Formalize the "Signed Attestation" format with the FairScale team.
2.  Prototype the HHI calculation in a test CosmWasm contract.
3.  Update the grant application with this decentralization roadmap.
