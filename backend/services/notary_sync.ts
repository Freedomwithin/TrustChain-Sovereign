import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, Idl, BN } from "@coral-xyz/anchor";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { calculateGini, calculateHHI } = require('./integrityEngine.js');
const { fetchWithRetry } = require('../utils/rpc.js');

// 1. Sovereign Environment Resolution
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
const PROGRAM_ID = new PublicKey(process.env.SOLANA_PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

console.log(`🏛️ TrustChain Notary Active: ${NOTARY_KEYPAIR.publicKey.toBase58()}`);

// IDL Definition
const IDL: Idl = {
  version: "0.1.0",
  name: "trustchain_notary",
  instructions: [
    {
      name: "updateIntegrity",
      accounts: [
        { name: "userIntegrity", isMut: true, isSigner: false },
        { name: "user", isMut: false, isSigner: false },
        { name: "notary", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "gini_score", type: "u16" },
        { name: "hhi_score", type: "u16" },
        { name: "status", type: "u8" }
      ]
    }
  ]
};

// Fetch Wallet Data Logic
const fetchWalletData = async (address: string) => {
  const pubKey = new PublicKey(address);
  const signatures = await fetchWithRetry(() => connection.getSignaturesForAddress(pubKey, { limit: 15 }));
  const transactions: any[] = [];
  const positions: any[] = [];

  console.log(`Fetched ${signatures.length} signatures.`);

  for (const sigInfo of signatures) {
    try {
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
      const tx = await fetchWithRetry(() => connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 }));
      if (!tx || !tx.meta) continue;

      const accountIndex = tx.transaction.message.accountKeys.findIndex((key: any) => key.pubkey.toBase58() === address);
      if (accountIndex !== -1) {
        const amount = Math.abs((tx.meta.preBalances[accountIndex] || 0) - (tx.meta.postBalances[accountIndex] || 0));
        transactions.push({ amount });
        positions.push({ value: amount });
      }
    } catch (err) {
        console.warn(`Skipping tx ${sigInfo.signature}:`, err);
        continue;
    }
  }
  return { transactions, positions };
};

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

        // 1. Calculate Scores
        const rawData = await fetchWalletData(TARGET_WALLET.toBase58());
        const gini = calculateGini(rawData.transactions);
        const hhi = calculateHHI(rawData.positions);

        console.log(`📊 Integrity Scores - Gini: ${gini.toFixed(4)}, HHI: ${hhi.toFixed(4)}`);

        // Convert to u16 (scaled by 10000)
        const giniScore = Math.min(Math.floor(gini * 10000), 65535);
        const hhiScore = Math.min(Math.floor(hhi * 10000), 65535);
        // Status: 0=VERIFIED, 1=PROBATIONARY, 2=SYBIL
        const status = gini > 0.9 ? 2 : (gini < 0.3 ? 0 : 1);
        // Note: Logic reconciliation says > 0.90 is "high inequality" -> SYBIL/PROBATIONARY?
        // User said: "ensure the 1.0 SOL vs 0.005 SOL delta triggers a high-inequality state (>0.90)."
        // backend/integrityEngine.js says "gini > 0.7" => SYBIL.
        // So > 0.90 is definitely SYBIL (2).

        console.log(`📝 Notarizing: Gini=${giniScore}, HHI=${hhiScore}, Status=${status}`);

        // 2. Setup Anchor Provider
        const wallet = new Wallet(NOTARY_KEYPAIR);
        const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
        const program = new Program(IDL, PROGRAM_ID, provider);

        // 3. Derive PDA
        const [userIntegrityPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("config"), TARGET_WALLET.toBuffer()],
            PROGRAM_ID
        );

        console.log(`🔐 PDA: ${userIntegrityPda.toBase58()}`);

        // 4. Send Transaction
        const tx = await program.methods
            .updateIntegrity(giniScore, hhiScore, status)
            .accounts({
                userIntegrity: userIntegrityPda,
                user: TARGET_WALLET,
                notary: NOTARY_KEYPAIR.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([NOTARY_KEYPAIR])
            .rpc();

        console.log(`✅ Notarization Complete! Signature: ${tx}`);

    } catch (error) {
        console.error("❌ Sync Failed:", error);
        process.exit(1);
    }
}

syncNotary();
