const { Program, AnchorProvider, Wallet, web3 } = require('@coral-xyz/anchor');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
require('dotenv').config();

const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

const IDL = {
  "version": "0.1.0",
  "name": "trustchain_notary",
  "instructions": [
    {
      "name": "updateIntegrity",
      "accounts": [
        { "name": "userIntegrity", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": false, "isSigner": false },
        { "name": "notary", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "gini_score", "type": "u16" },
        { "name": "hhi_score", "type": "u16" },
        { "name": "status", "type": "u8" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "UserIntegrity",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "pub_key", "type": "publicKey" },
          { "name": "gini_score", "type": "u16" },
          { "name": "hhi_score", "type": "u16" },
          { "name": "status", "type": "u8" },
          { "name": "last_updated", "type": "i64" }
        ]
      }
    }
  ]
};

let _connection = null;
let _program = null;
let _wallet = null;

function getNotaryKeypair() {
  if (!process.env.NOTARY_SECRET) {
    throw new Error("NOTARY_SECRET environment variable not set.");
  }

  try {
    const parsed = JSON.parse(process.env.NOTARY_SECRET);
    if (Array.isArray(parsed)) {
      return Keypair.fromSecretKey(new Uint8Array(parsed));
    }
  } catch (e) {
    // Try hex
    const cleanHex = process.env.NOTARY_SECRET.replace(/^0x/, '');
    if (/^[0-9a-fA-F]+$/.test(cleanHex)) {
      return Keypair.fromSecretKey(Uint8Array.from(Buffer.from(cleanHex, 'hex')));
    }
  }
  throw new Error("Invalid NOTARY_SECRET format.");
}

function getProgram() {
  if (_program) return _program;

  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) {
    console.warn("SOLANA_RPC_URL not set.");
    return null;
  }

  if (!_connection) {
    _connection = new Connection(rpcUrl, "confirmed");
  }

  if (!_wallet) {
    _wallet = new Wallet(getNotaryKeypair());
  }

  const provider = new AnchorProvider(_connection, _wallet, { preflightCommitment: "confirmed" });
  _program = new Program(IDL, PROGRAM_ID, provider);
  return _program;
}

async function submitNotarization(address, status, gini, hhi) {
  if (process.env.MOCK_MODE === 'true') {
    console.log(`[MOCK] Notarizing ${address} with status ${status}`);
    return "mock-signature";
  }

  const program = getProgram();
  if (!program) {
    console.warn("Skipping notarization: Program not initialized (check RPC URL).");
    return;
  }

  // Status Mapping
  let statusVal;
  switch (status) {
    case 'VERIFIED':
      statusVal = 1;
      break;
    case 'PROBATIONARY':
      statusVal = 2;
      break;
    case 'SYBIL':
      statusVal = 3;
      break;
    default:
      console.error(`Invalid status '${status}' for notarization. Skipping.`);
      return;
  }

  try {
    const userKey = new PublicKey(address);
    const [userIntegrityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), userKey.toBuffer()],
      PROGRAM_ID
    );

    // Scale scores to u16 (0.0000 to 1.0000 -> 0 to 10000)
    const giniScore = Math.floor(gini * 10000);
    const hhiScore = Math.floor(hhi * 10000);

    console.log(`Notarizing ${address}: Gini=${giniScore}, HHI=${hhiScore}, Status=${statusVal}`);

    // IDL args are snake_case now: gini_score, hhi_score
    const tx = await program.methods
      .updateIntegrity(giniScore, hhiScore, statusVal)
      .accounts({
        userIntegrity: userIntegrityPda,
        user: userKey,
        notary: _wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`Notarization successful. Tx: ${tx}`);
    return tx;
  } catch (error) {
    console.error(`Notarization failed for ${address}:`, error);
    throw error;
  }
}

module.exports = { submitNotarization };
