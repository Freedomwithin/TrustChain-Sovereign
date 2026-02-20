// Replace the top of your hydrate.js with this:
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

  // Load Notary from .env
  const secretString = process.env.NOTARY_SECRET;
  if (!secretString) {
    // Precise error message for the user
    throw new Error("NOTARY_SECRET not found. Expected .env at: " + require('path').resolve(__dirname, '../.env'));
  }

  const secretKey = Uint8Array.from(secretString.replace(/[\[\]]/g, '').split(',').map(Number));
  const notary = Keypair.fromSecretKey(secretKey);

  console.log(`Using Identity from .env: ${notary.publicKey.toBase58()}`);

  const txCount = 3;
  const whaleAmount = 0.1;
  const dustAmount = 0.005;

  for (let i = 0; i < txCount; i++) {
    const isWhale = i === 0;
    const amount = isWhale ? whaleAmount : dustAmount;
    const target = Keypair.generate().publicKey;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: notary.publicKey,
        toPubkey: target,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      })
    );

    try {
      const signature = await connection.sendTransaction(transaction, [notary]);
      await connection.confirmTransaction(signature);
      console.log(`[${i + 1}/${txCount}] ✅ ${isWhale ? 'WHALE' : 'dust'} sent: ${amount} SOL to ${target.toBase58().slice(0, 6)}...`);
    } catch (err) {
      console.error(`❌ Failed on tx ${i + 1}:`, err.message);
    }
  }

  console.log("\n✨ Hydration Complete. Gini/HHI inequality scores are now live on-chain.");
}

hydrate().catch(console.error);