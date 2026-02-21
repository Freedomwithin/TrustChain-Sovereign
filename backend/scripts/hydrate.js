require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');

async function hydrate() {
  console.log("🌊 Starting TrustChain High-Inequality Hydration...");

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // 1. Load Notary from .env
  const secretString = process.env.NOTARY_SECRET;
  if (!secretString) {
    throw new Error("NOTARY_SECRET not found. Expected .env at: " + require('path').resolve(__dirname, '../.env'));
  }

  // Regex fix for both comma-separated and bracketed secret strings
  const secretKey = Uint8Array.from(secretString.replace(/[\[\]]/g, '').split(',').map(Number));
  const notary = Keypair.fromSecretKey(secretKey);

  console.log(`Using Identity: ${notary.publicKey.toBase58()}`);

  // 2. Scenario Config: 1 Whale (High Concentration), 2 Dust (Noise)
  const txCount = 3;
  const whaleAmount = 0.3;
  const dustAmount = 0.01;

  for (let i = 0; i < txCount; i++) {
    const isWhale = i === 0;
    const amount = isWhale ? whaleAmount : dustAmount;
    const target = Keypair.generate().publicKey;

    // Get the latest blockhash for the confirmation strategy
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: notary.publicKey,
      recentBlockhash: blockhash
    }).add(
      SystemProgram.transfer({
        fromPubkey: notary.publicKey,
        toPubkey: target,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      })
    );

    try {
      const signature = await connection.sendTransaction(transaction, [notary]);

      // Modern Confirmation Strategy (Safe for 2026 standards)
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      console.log(`[${i + 1}/${txCount}] ✅ ${isWhale ? 'WHALE' : 'dust'} sent: ${amount} SOL to ${target.toBase58().slice(0, 6)}...`);
    } catch (err) {
      console.error(`❌ Failed on tx ${i + 1}:`, err.message);
    }
  }

  console.log("\n✨ Hydration Complete. Gini/HHI inequality scores are now live on-chain.");
}

hydrate().catch(console.error);