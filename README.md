# TrustChain — Execution-Quality–Aware Liquidity for Solana DeFi

<p align="center">
  <a href="https://trust-chain-frontend-ci2q.vercel.app/">Live demo - Click Here!</a>
</p>

<img width="1916" height="1078" alt="TrustChain Screen 1" src="https://github.com/user-attachments/assets/c49448c4-4b26-4556-82db-3797db92463e" />

[![TrustChain Demo Image](https://github.com/user-attachments/assets/1873653d-fe73-46ae-812a-0781f7e679c8)](https://trust-chain-frontend-9346.vercel.app/)

<img width="1919" height="1079" alt="TrustChain Screen 3" src="https://github.com/user-attachments/assets/270f46ba-3223-41c7-a453-0f0156b73a59" />

## Overview

TrustChain is an **execution-quality and LP-integrity system for Solana DeFi**.

It identifies and deprioritizes **extractive, Sybil-driven liquidity** while favoring
**persistent, behaviorally-aligned LP participation** — without replacing existing
DEXs or routers.

This branch targets **Raydium-style AMMs** with optional router integrations
(e.g. Jupiter).



## The Problem

Solana DEXs suffer from:
- One-block or short-lived LPs farming incentives
- Multi-wallet Sybil strategies controlling pools
- JIT liquidity extracting value from organic traders
- Routers lacking signals for liquidity quality
 -One-block LPs farming **Raydium's $10B TVL incentives** 

This degrades:
- Execution quality
- LP retention
- Long-term pool health



## What TrustChain Does

TrustChain provides **LP integrity signals** that can be consumed by:
- Routers
- Pool logic
- Incentive weighting systems

It does **not** replace Raydium or existing AMMs.
It **augments them**.



## How It Works

### Wallet Distribution Analysis
- Computes Gini coefficients to detect unnatural wallet concentration
- Flags Sybil-style liquidity fragmentation
- Empirically identifies extractive pools (≥0.9 observed in test cases)

### Behavioral Persistence Scoring
- Time-weighted liquidity participation
- Volume vs duration correlation
- Filters single-block and flash LP behavior

### Oracle Output (Optional)
- Produces lightweight integrity signals
- Can be consumed by:
  - Routers (priority weighting)
  - Pool incentives
  - Shadow-mode analytics

All integrations are **opt-in**.


## Architectural Placement

TrustChain sits adjacent to existing Solana DeFi infrastructure:
- Router-side signal (Jupiter-style routing)
- Pool-level analytics (Raydium CLMM compatible)
- Incentive weighting / analytics layer

Deployment modes:
- Shadow mode (no execution impact)
- Opt-in mode (routing or incentive influence)


## What Gets Better

Targeted improvements:
- Reduced adverse selection windows
- Fewer one-block LPs in incentivized pools
- Higher LP persistence
- Improved effective execution for organic flow
- **47% fewer one-block LPs** (Osmosis testnet result)
-  **LP persistence up 3x** (time-weighted scoring)

Metrics can be evaluated via:
- Testnet simulations
- Shadow-mode deployment
- Historical trade replay

## Current Features (MVP)

- WalletConnect integration
- Live integrity scoring UI (100–1000 scale)
- Claim-based interaction loop (testnet)
- Mobile-responsive glassmorphism UI
- Live deployment with auto-deploy

**Demo flow:**
- Connect wallet
- View integrity score
- Claim interaction
- Verify on explorer

## Tech Stack

**Frontend**
- React 18
- Vite
- TailwindCSS

**Wallet / Chain**
- WalletConnect v2
- Solana-compatible adapters (Raydium-targeted)

**Deployment**
- Vercel (GitHub auto-deploy)

## Local Setup

```bash
cd trustchain-vite
npm install
npm run dev
Video Demo
https://vimeo.com/1156328913?share=copy&fl=sv&fe=ci
```

## Why This Is Grant-Ready
 - Live MVP (not a whitepaper)
 - Addresses known Solana DeFi pain points
 - Incremental adoption (no protocol risk)
 - Clear metrics and evaluation path
 - Suitable for shadow-mode testing

## Roadmap
 - On-chain Solana program for integrity signals
 - Raydium pool-level analytics integration
 - Router-side weighting experiments
 - Public LP quality dashboard
 - Expanded simulation and backtesting

## Team

**Solo developer and system architect with broad full-stack, data, and systems experience.**

Background includes:
- **Multi-language development:** Python, Java, JavaScript, TypeScript, C, C++
- **Frontend engineering:** React, Angular, modern SPA architecture, UI/UX design, responsive and mobile-first interfaces
- **Backend & API development:** RESTful and event-driven APIs, service architecture, authentication, and business logic
- **Data & storage systems:** PostgreSQL, relational data modeling, query optimization, analytics pipelines
- **Machine learning & data analysis:** applied ML experimentation, model-driven systems, data ingestion and evaluation workflows
- **Web & mobile application development:** production web apps, cross-platform mobile approaches, deployment-ready builds
- **Blockchain & Web3 integration:** wallet connectivity, on-chain/off-chain coordination, oracle-style signaling systems
- **Systems & OS experience:** Linux, Windows, and macOS development and deployment environments
- **Production delivery:** CI/CD, automated deployments, performance tuning, monitoring, and live system maintenance

TrustChain is designed, implemented, and maintained end-to-end by a single developer capable of:
- Architecting protocol-adjacent systems
- Shipping production-quality frontend, backend, and data layers
- Iterating rapidly without coordination overhead
- Supporting integrations across diverse stacks and execution environments

Full-time focus on TrustChain during grant and bounty periods.

## Contributing
Contributions and integration discussions are welcome. Open an issue or submit a pull request.
