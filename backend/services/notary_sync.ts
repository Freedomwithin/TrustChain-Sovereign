import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";
import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
} from "@solana/web3.js";
import * as anchor from '@coral-xyz/anchor';
const { Program, AnchorProvider, Wallet } = anchor;

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Path & Extension Alignment: Remove '.js' if running with CommonJS compiler options
import { calculateGini, calculateHHI } from './integrityEngine.js';
import { fetchWithRetry } from '../utils/rpc.js';

// 2. Resolve Environment
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
    console.error("❌ ERROR: No .env found. System ungrounded.");
    process.exit(1);
}

// 3. Resolve Notary Identity
const secretString = process.env.NOTARY_SECRET || "";
let NOTARY_KEYPAIR: Keypair;
try {
    const cleanString = secretString.replace(/[\[\]"\s]/g, '');
    const secretBytes = Uint8Array.from(cleanString.split(',').map(Number));
    NOTARY_KEYPAIR = Keypair.fromSecretKey(secretBytes);
} catch (e) {
    console.error("❌ ERROR: Could not parse NOTARY_SECRET.");
    process.exit(1);
}

// 4. Connection & IDs
const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const connection = new Connection(rpcUrl, "confirmed");
// Update this line to match your live Devnet program
const PROGRAM_ID = new PublicKey("5nbMQKE3kpUPpXRw7TdnReJDoeQfKBgLTnrfuENZn3Xe");

// Ensure this is set in your .env.local to avoid analyzing the program itself
const TARGET_WALLET = new PublicKey(process.env.TARGET_WALLET_ADDRESS || "FBbjMhKtg1iyy83CeHaieqEFqw586i3WYG4zCcnXr7tc");

// Aligned IDL
const IDL: any = {
    version: "0.1.0",
    name: "trustchain_notary",
    instructions: [
        {
            name: "updateIntegrity",
            accounts: [
                { name: "notaryAccount", isMut: true, isSigner: false },
                { name: "notary", isMut: true, isSigner: true },
                { name: "targetUser", isMut: false, isSigner: false },
                { name: "systemProgram", isMut: false, isSigner: false }
            ],
            args: [
                { name: "giniScore", type: "u16" },
                { name: "hhiScore", type: "u16" },
                { name: "status", type: "u8" }
            ]
        }
    ]
};

const fetchWalletData = async (address: string) => {
    const pubKey = new PublicKey(address);
    const signatures = await fetchWithRetry(() => connection.getSignaturesForAddress(pubKey, { limit: 15 }));
    const transactions: any[] = [];
    const positions: any[] = [];

    console.log(`Fetched ${signatures.length} signatures.`);

    for (const sigInfo of signatures) {
        try {
            await new Promise(r => setTimeout(r, 200));
            const tx = await fetchWithRetry(() => connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 }));
            if (!tx || !tx.meta) continue;
            const accountIndex = tx.transaction.message.accountKeys.findIndex((key: any) => key.pubkey.toBase58() === address);
            if (accountIndex !== -1) {
                const amount = Math.abs((tx.meta.preBalances[accountIndex] || 0) - (tx.meta.postBalances[accountIndex] || 0));
                transactions.push({ amount });
                positions.push({ value: amount });
            }
        } catch (err) { continue; }
    }
    return { transactions, positions };
};

async function syncNotary() {
    try {
        console.log(`🏛️ Notary Active: ${NOTARY_KEYPAIR.publicKey.toBase58()}`);
        console.log(`🔗 Target: ${TARGET_WALLET.toBase58()}`);

        const rawData = await fetchWalletData(TARGET_WALLET.toBase58());
        const gini = calculateGini(rawData.transactions);
        const hhi = calculateHHI(rawData.positions);

        const giniScore = Math.min(Math.floor(gini * 10000), 65535);
        const hhiScore = Math.min(Math.floor(hhi * 10000), 65535);
        const status = gini > 0.9 ? 2 : (gini < 0.3 ? 0 : 1);

        console.log(`📊 Integrity Scores - Gini: ${gini.toFixed(4)}, HHI: ${hhi.toFixed(4)}`);

        const wallet = new Wallet(NOTARY_KEYPAIR);
        const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
        const program = new Program(IDL, PROGRAM_ID, provider);

        const [userIntegrityPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("notary"), TARGET_WALLET.toBuffer()],
            PROGRAM_ID
        );

        console.log(`🔐 PDA: ${userIntegrityPda.toBase58()}`);

        const tx = await program.methods
            .updateIntegrity(giniScore, hhiScore, status)
            .accounts({
                notaryAccount: userIntegrityPda,
                notary: NOTARY_KEYPAIR.publicKey,
                targetUser: TARGET_WALLET,
                systemProgram: SystemProgram.programId,
            })
            .signers([NOTARY_KEYPAIR])
            .rpc();

        console.log(`✅ Success! Signature: ${tx}`);
    } catch (error) {
        console.error("❌ Sync Failed:", error);
        process.exit(1);
    }
}

syncNotary();