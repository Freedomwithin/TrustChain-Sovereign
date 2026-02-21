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
const secretString = process.env.NOTARY_SECRET || "";

let NOTARY_KEYPAIR: Keypair;

try {
    // This removes brackets, quotes, and spaces universally
    const cleanString = secretString.replace(/[\[\]"\s]/g, '');
    const secretBytes = Uint8Array.from(cleanString.split(',').map(Number));

    if (secretBytes.length !== 64) {
        throw new Error(`Invalid length: ${secretBytes.length}`);
    }

    NOTARY_KEYPAIR = Keypair.fromSecretKey(secretBytes);
} catch (e) {
    console.error("❌ ERROR: Could not parse NOTARY_SECRET. Ensure it is 64 comma-separated bytes.");
    process.exit(1);
}

const TARGET_WALLET = new PublicKey("6QsEMrsHgnBB2dRVeySrGAi5nYy3eq35w4sywdis1xJ5");
const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

console.log(`🏛️ TrustChain Notary Active: ${NOTARY_KEYPAIR.publicKey.toBase58()}`)