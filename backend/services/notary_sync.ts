import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    TransactionInstruction,
} from "@solana/web3.js";

// 1. Sovereign Environment Resolution
// Prioritizes .env.local (Vercel) over standard .env, with a root fallback.
const envPaths = [
    path.resolve(__dirname, "../.env.local"),
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../.env")
];

let envLoaded = false;
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log(`📡 [SENTINEL] Environment Loaded: ${path.basename(envPath)}`);
        envLoaded = true;
        break;
    }
}

if (!envLoaded) {
    console.error("❌ ERROR: No .env or .env.local found. System ungrounded.");
    process.exit(1);
}

// 2. Resolve Notary Identity
const secretString = process.env.NOTARY_SECRET || "";
let NOTARY_KEYPAIR: Keypair;

try {
    // Universal cleaning: removes brackets, quotes, and whitespace
    const cleanString = secretString.replace(/[\[\]"\s]/g, '');
    const secretBytes = Uint8Array.from(cleanString.split(',').map(Number));

    if (secretBytes.length !== 64) {
        throw new Error(`Invalid byte length: ${secretBytes.length}`);
    }

    NOTARY_KEYPAIR = Keypair.fromSecretKey(secretBytes);
} catch (e) {
    console.error("❌ ERROR: Could not parse NOTARY_SECRET. Ensure it is a 64-byte array string.");
    process.exit(1);
}

// 3. Constants & Connection
const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const connection = new Connection(rpcUrl, "confirmed");
const TARGET_WALLET = new PublicKey("6QsEMrsHgnBB2dRVeySrGAi5nYy3eq35w4sywdis1xJ5");
const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

console.log(`🏛️ TrustChain Notary Active: ${NOTARY_KEYPAIR.publicKey.toBase58()}`);

/**
 * Executes the Notarization Sync
 */
async function syncNotary() {
    try {
        console.log("🔗 Connecting to Devnet...");
        const balance = await connection.getBalance(NOTARY_KEYPAIR.publicKey);

        if (balance < 10000000) { // 0.01 SOL
            console.warn("⚠️ WARNING: Notary balance low. Transaction may fail.");
        }

        console.log(`✅ Ready to notarize for target: ${TARGET_WALLET.toBase58()}`);
        // Add your specific instruction logic here if needed for the PDA write

    } catch (error) {
        console.error("❌ Sync Failed:", error);
        process.exit(1);
    }
}

syncNotary();