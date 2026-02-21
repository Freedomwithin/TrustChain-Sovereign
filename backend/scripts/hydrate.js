require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

async function hydrate() {
  console.log("🌊 Starting TrustChain High-Inequality Hydration...");

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // 1. Setup Logging Path
  const logDir = "/home/freedomwithin/Documents/Tech/1_GitHub_Reops/TrustChain_documentation/Wallets-Testing";
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFileName = `demo_cluster_${timestamp}.json`;
  const logPath = path.join(logDir, logFileName);

  // Ensure directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 2. Load Notary from .env
  const secretString = process.env.NOTARY_SECRET;
  if (!secretString) {
    throw new Error("NOTARY_SECRET not found. Expected .env at: " + require('path').resolve(__dirname, '../.env'));
  }

  const secretKey = Uint8Array.from(secretString.replace(/[\[\]]/g, '').split(',').map(Number));
  const notary = Keypair.fromSecretKey(secretKey);

  console.log(`Using Identity: ${notary.publicKey.toBase58()}`);

  // 3. Scenario Config
  const txCount = 3;
  const whaleAmount = 0.3;
  const dustAmount = 0.01;
  const clusterLog = [];

  for (let i = 0; i < txCount; i++) {
    const isWhale = i === 0;
    const amount = isWhale ? whaleAmount : dustAmount;

    // Generate burner keypair
    const burnerKeypair = Keypair.generate();
    const target = burnerKeypair.publicKey;

    // Record keys for later recovery/verification
    clusterLog.push({
      role: isWhale ? 'WHALE' : 'dust',
      address: target.toBase58(),
      secretKey: Array.from(burnerKeypair.secretKey)
    });

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

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      console.log(`[${i + 1}/${txCount}] ✅ ${isWhale ? 'WHALE' : 'dust'} sent: ${amount} SOL to ${target.toBase58().slice(0, 6)}...`);

      // 10-second "Human Behavior" sleep to lower SyncIndex
      if (i < txCount - 1) {
        console.log("⏳ Sleeping 10s for temporal entropy...");
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

    } catch (err) {
      console.error(`❌ Failed on tx ${i + 1}:`, err.message);
    }
  }

  // 4. Save Cluster Data
  fs.writeFileSync(logPath, JSON.stringify(clusterLog, null, 2));

  console.log("\n----------------------------------------------------");
  console.log(`📂 CLUSTER DATA SAVED: ${logPath}`);
  console.log("✨ Hydration Complete. Gini/HHI scores live on-chain.");
  console.log("----------------------------------------------------");
}

hydrate().catch(console.error);