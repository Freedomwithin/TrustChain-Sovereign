import * as path from "path";
import dotenv from "dotenv";

// 1. Load Environment IMMEDIATELY (Point to backend/.env)
// Since this file is in services/, one level up is backend/
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    TransactionInstruction,
} from "@solana/web3.js";
import * as nacl from "tweetnacl";
import crypto from "crypto";

// 2. Resolve Notary Identity
let notarySecret: Uint8Array;
const secretString = process.env.NOTARY_SECRET;

if (!secretString) {
    console.error("❌ ERROR: NOTARY_SECRET not found in .env at: " + path.resolve(__dirname, "../.env"));
    process.exit(1);
}

try {
    notarySecret = new Uint8Array(secretString.replace(/[\[\]]/g, '').split(',').map(Number));
} catch (e) {
    console.error("❌ ERROR: Could not parse NOTARY_SECRET.");
    process.exit(1);
}

const NOTARY_KEYPAIR = Keypair.fromSecretKey(notarySecret);
const TARGET_WALLET = new PublicKey("6QsEMrsHgnBB2dRVeySrGAi5nYy3eq35w4sywdis1xJ5");
const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

console.log(`🏛️ TrustChain Notary Active: ${NOTARY_KEYPAIR.publicKey.toBase58()}`);

// ... rest of your logic (Interfaces, fetchVerifiedScore, updateOnChainPDA, main) ...