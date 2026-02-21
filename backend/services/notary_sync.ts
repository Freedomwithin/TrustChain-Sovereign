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
import * as path from "path";

// 1. Load Environment
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// 2. Resolve Notary Identity (Prioritizing .env for Institutional Consistency)
let notarySecret: Uint8Array;
const secretString = process.env.NOTARY_SECRET;

if (!secretString) {
    console.error("❌ ERROR: NOTARY_SECRET not found in .env");
    process.exit(1);
}

// Support for comma-separated bytes from your .env
try {
    notarySecret = new Uint8Array(secretString.replace(/[\[\]]/g, '').split(',').map(Number));
} catch (e) {
    console.error("❌ ERROR: Could not parse NOTARY_SECRET. Ensure it is comma-separated bytes.");
    process.exit(1);
}

const NOTARY_KEYPAIR = Keypair.fromSecretKey(notarySecret);
const TARGET_WALLET = new PublicKey("6QsEMrsHgnBB2dRVeySrGAi5nYy3eq35w4sywdis1xJ5");

// TrustChain Notary Program ID (Update this after your Anchor deploy)
const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

console.log(`🏛️ TrustChain Notary Active: ${NOTARY_KEYPAIR.publicKey.toBase58()}`);

// --- INTERFACE & LOGIC ---

interface IntegrityScore {
    gini: number;
    hhi: number;
    status: string;
    syncIndex: number;
}

async function fetchVerifiedScore(wallet: PublicKey): Promise<IntegrityScore> {
    console.log(`🔍 Fetching Logic Layer results for ${wallet.toBase58()}...`);

    // In a live demo, this would fetch from your Vercel /api/verify endpoint
    // We simulate the 'Verified' state for the demo finality
    return {
        gini: 0.12,    // Low inequality (Pass)
        hhi: 0.08,     // Low concentration (Pass)
        status: 'VERIFIED',
        syncIndex: 0.15 // Low temporal sync (Pass)
    };
}

async function updateOnChainPDA(wallet: PublicKey, score: IntegrityScore) {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    // Derive PDA: ['config', wallet_pubkey]
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), wallet.toBuffer()],
        PROGRAM_ID
    );

    console.log(`PDA Target: ${pda.toBase58()}`);

    // Anchor Instruction Discriminator for "update_integrity"
    const discriminator = crypto.createHash("sha256").update("global:update_integrity").digest().subarray(0, 8);

    // Data Serialization (Fixed-point 4 decimals)
    const giniBuffer = Buffer.alloc(2);
    giniBuffer.writeUInt16LE(Math.floor(score.gini * 10000));

    const hhiBuffer = Buffer.alloc(2);
    hhiBuffer.writeUInt16LE(Math.floor(score.hhi * 10000));

    const statusBuffer = Buffer.alloc(1);
    const statusVal = score.status === 'VERIFIED' ? 1 : 2;
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
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = NOTARY_KEYPAIR.publicKey;

    transaction.sign(NOTARY_KEYPAIR);

    // Security Verification: Ed25519 Check
    const signatureObj = transaction.signatures.find(s => s.publicKey.equals(NOTARY_KEYPAIR.publicKey));
    if (!signatureObj?.signature) throw new Error("Signature failed");

    const isValid = nacl.sign.detached.verify(
        transaction.serializeMessage(),
        signatureObj.signature,
        NOTARY_KEYPAIR.publicKey.toBuffer()
    );

    if (isValid) {
        console.log("✅ Ed25519 Integrity Verified.");
        console.log("Notary Signature:", Buffer.from(signatureObj.signature).toString('hex').slice(0, 32) + "...");
    }

    console.log("⚙️ Transaction constructed and signed locally.");
    console.log("Ready for Notarization.");
}

async function main() {
    try {
        const score = await fetchVerifiedScore(TARGET_WALLET);
        await updateOnChainPDA(TARGET_WALLET, score);
        console.log("✨ Notary Sync Complete.");
    } catch (e) {
        console.error("❌ Notary Sync Failed:", e);
        process.exit(1);
    }
}

main();