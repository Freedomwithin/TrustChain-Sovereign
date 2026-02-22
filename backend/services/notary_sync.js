"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var dotenv_1 = __importDefault(require("dotenv"));
var web3_js_1 = require("@solana/web3.js");
var anchor_1 = require("@coral-xyz/anchor");
var module_1 = require("module");
var require = (0, module_1.createRequire)(import.meta.url);
var _a = require('./integrityEngine.js'), calculateGini = _a.calculateGini, calculateHHI = _a.calculateHHI;
var fetchWithRetry = require('../utils/rpc.js').fetchWithRetry;
// 1. Sovereign Environment Resolution
var envPaths = [
    path.resolve(__dirname, "../.env.local"),
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../.env")
];
var envLoaded = false;
for (var _i = 0, envPaths_1 = envPaths; _i < envPaths_1.length; _i++) {
    var envPath = envPaths_1[_i];
    if (fs.existsSync(envPath)) {
        dotenv_1.default.config({ path: envPath });
        console.log("\uD83D\uDCE1 [SENTINEL] Environment Loaded: ".concat(path.basename(envPath)));
        envLoaded = true;
        break;
    }
}
if (!envLoaded) {
    console.error("❌ ERROR: No .env or .env.local found. System ungrounded.");
    process.exit(1);
}
// 2. Resolve Notary Identity
var secretString = process.env.NOTARY_SECRET || "";
var NOTARY_KEYPAIR;
try {
    var cleanString = secretString.replace(/[\[\]"\s]/g, '');
    var secretBytes = Uint8Array.from(cleanString.split(',').map(Number));
    if (secretBytes.length !== 64) {
        throw new Error("Invalid byte length: ".concat(secretBytes.length));
    }
    NOTARY_KEYPAIR = web3_js_1.Keypair.fromSecretKey(secretBytes);
}
catch (e) {
    console.error("❌ ERROR: Could not parse NOTARY_SECRET. Ensure it is a 64-byte array string.");
    process.exit(1);
}
// 3. Constants & Connection
var rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
var connection = new web3_js_1.Connection(rpcUrl, "confirmed");
var TARGET_WALLET = new web3_js_1.PublicKey(process.env.TRUSTCHAIN_PROGRAM_ID || process.env.NEXT_PUBLIC_TRUSTCHAIN_PROGRAM_ID || "FBbjMhKtg1iyy83CeHaieqEFqw586i3WYG4zCcnXr7tc");
var PROGRAM_ID = new web3_js_1.PublicKey(process.env.SOLANA_PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
console.log("\uD83C\uDFDB\uFE0F TrustChain Notary Active: ".concat(NOTARY_KEYPAIR.publicKey.toBase58()));
// IDL Definition
var IDL = {
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
var fetchWalletData = function (address) { return __awaiter(void 0, void 0, void 0, function () {
    var pubKey, signatures, transactions, positions, _loop_1, _i, signatures_1, sigInfo;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pubKey = new web3_js_1.PublicKey(address);
                return [4 /*yield*/, fetchWithRetry(function () { return connection.getSignaturesForAddress(pubKey, { limit: 15 }); })];
            case 1:
                signatures = _a.sent();
                transactions = [];
                positions = [];
                console.log("Fetched ".concat(signatures.length, " signatures."));
                _loop_1 = function (sigInfo) {
                    var tx, accountIndex, amount, err_1;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 3, , 4]);
                                // Small delay to avoid rate limits
                                return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 200); })];
                            case 1:
                                // Small delay to avoid rate limits
                                _b.sent();
                                return [4 /*yield*/, fetchWithRetry(function () { return connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 }); })];
                            case 2:
                                tx = _b.sent();
                                if (!tx || !tx.meta)
                                    return [2 /*return*/, "continue"];
                                accountIndex = tx.transaction.message.accountKeys.findIndex(function (key) { return key.pubkey.toBase58() === address; });
                                if (accountIndex !== -1) {
                                    amount = Math.abs((tx.meta.preBalances[accountIndex] || 0) - (tx.meta.postBalances[accountIndex] || 0));
                                    transactions.push({ amount: amount });
                                    positions.push({ value: amount });
                                }
                                return [3 /*break*/, 4];
                            case 3:
                                err_1 = _b.sent();
                                console.warn("Skipping tx ".concat(sigInfo.signature, ":"), err_1);
                                return [2 /*return*/, "continue"];
                            case 4: return [2 /*return*/];
                        }
                    });
                };
                _i = 0, signatures_1 = signatures;
                _a.label = 2;
            case 2:
                if (!(_i < signatures_1.length)) return [3 /*break*/, 5];
                sigInfo = signatures_1[_i];
                return [5 /*yield**/, _loop_1(sigInfo)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [2 /*return*/, { transactions: transactions, positions: positions }];
        }
    });
}); };
/**
 * Executes the Notarization Sync
 */
function syncNotary() {
    return __awaiter(this, void 0, void 0, function () {
        var balance, rawData, gini, hhi, giniScore, hhiScore, status_1, wallet, provider, program, userIntegrityPda, tx, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    console.log("🔗 Connecting to Devnet...");
                    return [4 /*yield*/, connection.getBalance(NOTARY_KEYPAIR.publicKey)];
                case 1:
                    balance = _a.sent();
                    if (balance < 10000000) { // 0.01 SOL
                        console.warn("⚠️ WARNING: Notary balance low. Transaction may fail.");
                    }
                    console.log("\u2705 Ready to notarize for target: ".concat(TARGET_WALLET.toBase58()));
                    return [4 /*yield*/, fetchWalletData(TARGET_WALLET.toBase58())];
                case 2:
                    rawData = _a.sent();
                    gini = calculateGini(rawData.transactions);
                    hhi = calculateHHI(rawData.positions);
                    console.log("\uD83D\uDCCA Integrity Scores - Gini: ".concat(gini.toFixed(4), ", HHI: ").concat(hhi.toFixed(4)));
                    giniScore = Math.min(Math.floor(gini * 10000), 65535);
                    hhiScore = Math.min(Math.floor(hhi * 10000), 65535);
                    status_1 = gini > 0.9 ? 2 : (gini < 0.3 ? 0 : 1);
                    // Note: Logic reconciliation says > 0.90 is "high inequality" -> SYBIL/PROBATIONARY?
                    // User said: "ensure the 1.0 SOL vs 0.005 SOL delta triggers a high-inequality state (>0.90)."
                    // backend/integrityEngine.js says "gini > 0.7" => SYBIL.
                    // So > 0.90 is definitely SYBIL (2).
                    console.log("\uD83D\uDCDD Notarizing: Gini=".concat(giniScore, ", HHI=").concat(hhiScore, ", Status=").concat(status_1));
                    wallet = new anchor_1.Wallet(NOTARY_KEYPAIR);
                    provider = new anchor_1.AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
                    program = new anchor_1.Program(IDL, PROGRAM_ID, provider);
                    userIntegrityPda = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("config"), TARGET_WALLET.toBuffer()], PROGRAM_ID)[0];
                    console.log("\uD83D\uDD10 PDA: ".concat(userIntegrityPda.toBase58()));
                    return [4 /*yield*/, program.methods
                            .updateIntegrity(giniScore, hhiScore, status_1)
                            .accounts({
                            userIntegrity: userIntegrityPda,
                            user: TARGET_WALLET,
                            notary: NOTARY_KEYPAIR.publicKey,
                            systemProgram: web3_js_1.SystemProgram.programId,
                        })
                            .signers([NOTARY_KEYPAIR])
                            .rpc()];
                case 3:
                    tx = _a.sent();
                    console.log("\u2705 Notarization Complete! Signature: ".concat(tx));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("❌ Sync Failed:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
syncNotary();
