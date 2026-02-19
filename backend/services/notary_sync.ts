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
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { RiskAuditorAgent, TemporalObserver } from "../agents/core/base_agent";

dotenv.config();

// Mock data
const MOCK_WALLET = new PublicKey("11111111111111111111111111111111");

// --- LOGIC: PARALLEL NOTARY RESOLUTION ---
let notarySecret: Uint8Array;

if (process.env.NOTARY_SECRET) {
    // Priority 1: Production/Vercel Environment
    try {
        const parsed = JSON.parse(process.env.NOTARY_SECRET);
        if (Array.isArray(parsed)) {
            notarySecret = new Uint8Array(parsed);
            console.log("✅ SYSTEM: Using Production NOTARY_SECRET (JSON Array).");
        } else {
            throw new Error("NOTARY_SECRET JSON is not an array");
        }
    } catch (e) {
        // Fallback to Hex if JSON parsing fails
        const cleanHex = process.env.NOTARY_SECRET.replace(/^0x/, '');
        if (/^[0-9a-fA-F]+$/.test(cleanHex)) {
            notarySecret = Uint8Array.from(Buffer.from(cleanHex, 'hex'));
            console.log("✅ SYSTEM: Using Production NOTARY_SECRET (Hex String).");
        } else {
            throw new Error("Invalid NOTARY_SECRET format in environment.");
        }
    }
} else {
    // Priority 2: Local Demo Recording (SV-Prefix Fallback)
    try {
        // Pathing: Update this line to match your new SVRQ file
        const demoWalletPath = path.resolve(__dirname, "../scripts/SVRQGjRmizi3Lvv4vHmtW4x6ap7dKs65QVooUdnbZuJ.json");
        const fileContent = fs.readFileSync(demoWalletPath, "utf-8");
        notarySecret = new Uint8Array(JSON.parse(fileContent));
        console.log("💻 DEMO MODE: SV-prefix vanity wallet loaded from scripts/ folder.");
    } catch (err) {
        console.error("❌ ERROR: No NOTARY_SECRET env variable and no demo wallet found at:", path.resolve(__dirname, "../scripts/"));
        process.exit(1);
    }
}

const NOTARY_KEYPAIR = Keypair.fromSecretKey(notarySecret);
// --- END LOGIC ---

// Placeholder Program ID from lib.rs
const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

interface IntegrityScore {
    gini: number;
    hhi: number;
    status: string;
    syncIndex?: number;
}

// Mock function to fetch score from Integrity Engine
async function fetchVerifiedScore(wallet: PublicKey): Promise<IntegrityScore> {
    console.log(`Fetching score for ${wallet.toBase58()}...`);

    // Simulated TemporalObserver data
    const observerData: TemporalObserver = {
        gini: 0.25,
        hhi: 0.15,
        syncIndex: 0.42 // Trigger Probationary Status (> 0.35)
    };

    const agent = new RiskAuditorAgent();
    const decision = agent.evaluate(observerData);

    console.log(`Agent Decision: ${decision.status} (Reason: ${decision.reason || 'None'})`);

    return {
        gini: observerData.gini,
        hhi: observerData.hhi,
        status: decision.status,
        syncIndex: observerData.syncIndex
    };
}

async function updateOnChainPDA(wallet: PublicKey, score: IntegrityScore) {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), wallet.toBuffer()],
        PROGRAM_ID
    );

    console.log(`PDA for wallet ${wallet.toBase58()}: ${pda.toBase58()}`);

    const discriminator = crypto.createHash("sha256").update("global:update_integrity").digest().subarray(0, 8);

    const giniBuffer = Buffer.alloc(2);
    giniBuffer.writeUInt16LE(Math.floor(score.gini * 10000));

    const hhiBuffer = Buffer.alloc(2);
    hhiBuffer.writeUInt16LE(Math.floor(score.hhi * 10000));

    const statusBuffer = Buffer.alloc(1);
    let statusVal = 0;
    if (score.status === 'VERIFIED') statusVal = 1;
    else if (score.status === 'PROBATIONARY') statusVal = 2;

    statusBuffer.writeUInt8(statusVal);

    const data = Buffer.concat([discriminator, giniBuffer, hhiBuffer, statusBuffer]);

    const instruction = new TransactionInstruction({
        keys: [
            { pubkey: pda, isSigner: false, isWritable: true },
            { pubkey: wallet, isSigner: false, isWritable: false },
            { pubkey: NOTARY_KEYPAIR.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: data,
    });

    const transaction = new Transaction().add(instruction);

    try {
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
    } catch (err) {
        console.warn("Using mock blockhash for simulation.");
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
    }

    transaction.feePayer = NOTARY_KEYPAIR.publicKey;
    transaction.sign(NOTARY_KEYPAIR);

    if (!transaction.verifySignatures()) {
        throw new Error("Transaction signature verification failed!");
    }

    const signatureObj = transaction.signatures.find(s => s.publicKey.equals(NOTARY_KEYPAIR.publicKey));

    if (!signatureObj || !signatureObj.signature) {
        throw new Error("Notary signature missing");
    }

    const message = transaction.serializeMessage();
    const isValid = nacl.sign.detached.verify(
        message,
        signatureObj.signature,
        NOTARY_KEYPAIR.publicKey.toBuffer()
    );

    if (isValid) {
        console.log("✅ Ed25519 Signature Verified: Update authorized by TrustChain Notary.");
        console.log("Notary Public Key:", NOTARY_KEYPAIR.publicKey.toBase58());
        console.log("Signature:", Buffer.from(signatureObj.signature).toString('hex'));
    } else {
        console.error("❌ Invalid Signature: Unauthorized update attempt.");
        throw new Error("Security Violation: Invalid Signature");
    }

    console.log("Transaction successfully constructed.");
}

async function main() {
    try {
        const score = await fetchVerifiedScore(MOCK_WALLET);
        await updateOnChainPDA(MOCK_WALLET, score);
    } catch (e) {
        console.error("Error during notary sync:", e);
        process.exit(1);
    }
}

main();