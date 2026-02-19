const {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey
} = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

async function hydrate() {
  console.log("🌊 Starting TrustChain High-Inequality Hydration...");
  
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load Notary
  const secretPath = path.resolve(__dirname, 'SVRQGjRmizi3Lvv4vHmtW4x6ap7dKs65QVooUdnbZuJ.json');
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(secretPath)));
  const notary = Keypair.fromSecretKey(secretKey);

  console.log(`Using Notary: ${notary.publicKey.toBase58()}`);

  // We want high Gini: 1 Whale and 14 tiny "Dust" transactions
  const txCount = 3;
  const whaleAmount = 0.006; // The "Test Whale"
  const dustAmount = 0.001;  // Standard dust// Increased to be above rent-exempt minimum (~0.00089)

  for (let i = 0; i < txCount; i++) {
    const isWhale = i === 0;
    const amount = isWhale ? whaleAmount : dustAmount;
    
    // Generate a perfectly valid random address
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
      console.log(`[${i+1}/${txCount}] ✅ ${isWhale ? 'WHALE' : 'dust'} sent to ${target.toBase58().slice(0,6)}...`);
    } catch (err) {
      console.error(`❌ Failed on tx ${i+1}:`, err.message);
    }
  }

  console.log("\n✨ Hydration Complete. Gini/HHI inequality scores are now live on-chain.");
}

hydrate().catch(console.error);