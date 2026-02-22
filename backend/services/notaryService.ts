import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from '@coral-xyz/anchor';
const { Program, AnchorProvider, Wallet } = anchor;
import { calculateGini, calculateHHI } from './integrityEngine.js';
import { fetchWithRetry } from '../utils/rpc.js';

/**
 * TrustChain Dynamic Notary
 * Takes any wallet address and notarizes behavioral integrity scores.
 */
export const notarizeWallet = async (targetWalletAddress: string) => {
    // 1. Setup Environment from Process
    const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", "confirmed");
    const PROGRAM_ID = new PublicKey(process.env.TRUSTCHAIN_PROGRAM_ID!);

    // 2. Initialize Notary (The Authority)
    const secretBytes = Uint8Array.from(JSON.parse(process.env.NOTARY_SECRET!));
    const NOTARY_KEYPAIR = Keypair.fromSecretKey(secretBytes);

    const TARGET_WALLET = new PublicKey(targetWalletAddress);

    // 3. Data Acquisition
    const fetchWalletData = async (address: string) => {
        const pubKey = new PublicKey(address);
        const signatures = await fetchWithRetry(() => connection.getSignaturesForAddress(pubKey, { limit: 15 }));
        const transactions: any[] = [];
        const positions: any[] = [];

        for (const sigInfo of signatures) {
            try {
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

    // 4. Analysis & Execution
    const rawData = await fetchWalletData(targetWalletAddress);
    const gini = calculateGini(rawData.transactions);
    const hhi = calculateHHI(rawData.positions);

    // Scaling scores for u16 on-chain storage
    const giniScore = Math.min(Math.floor(gini * 10000), 65535);
    const hhiScore = Math.min(Math.floor(hhi * 10000), 65535);
    const status = gini > 0.9 ? 2 : (gini < 0.3 ? 0 : 1);

    // 5. Anchor Instruction
    const wallet = new Wallet(NOTARY_KEYPAIR);
    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
    const IDL: any = (await anchor.Program.fetchIdl(PROGRAM_ID, provider));
    const program = new Program(IDL, PROGRAM_ID, provider);

    const [userIntegrityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("notary"), TARGET_WALLET.toBuffer()],
        PROGRAM_ID
    );

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

    return {
        signature: tx,
        gini: gini.toFixed(4),
        hhi: hhi.toFixed(4),
        pda: userIntegrityPda.toBase58()
    };
};
