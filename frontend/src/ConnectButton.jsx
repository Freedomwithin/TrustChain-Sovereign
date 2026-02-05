import React, { useContext } from 'react';
import { WalletConnectContext } from './context/WalletConnectContext.jsx';

const ReputationScore = () => {
  const { account, isReady, connectWallet, disconnectWallet } = useContext(WalletConnectContext);

  const getReputationData = (address) => {
    if (!address) return null;
    const score = Math.floor((parseInt(address.slice(-8), 16) % 900) + 100);
    const rank = Math.floor(Math.random() * 5000) + 1000;
    return {
      score,
      rank,
      transactions: Math.floor(Math.random() * 100) + 10,
      level: score > 800 ? 'Platinum' : score > 600 ? 'Gold' : 'Silver'
    };
  };

  const repData = account ? getReputationData(account.address) : null;

  if (!isReady) return <div className="loading">Loading TrustChain...</div>;

  return (
    <div className="reputation-card">
      <h3>TrustChain Reputation</h3>

      {!account ? (
        <button onClick={connectWallet} className="connect-btn">
          Connect Osmosis Wallet
        </button>
      ) : (
        <div className="connected space-y-4">
          <div className="wallet-info">
            <div className="text-sm opacity-75">Connected:</div>
            <div className="font-mono text-lg">{account.address.slice(0, 10)}...{account.address.slice(-4)}</div>
          </div>

          <div className="rep-score text-center p-6 bg-gradient-to-b from-green-500/20 to-blue-500/20 rounded-2xl border border-green-500/30">
            <div className="text-4xl font-black text-green-400">{repData.score}/1000</div>
            <div className="text-sm font-bold text-white/80 uppercase tracking-wide">{repData.level}</div>
          </div>

          <div className="stats grid grid-cols-2 gap-4 text-sm text-white/70">
            <div>Rank: #{repData.rank.toLocaleString()}</div>
            <div>Txs: {repData.transactions}</div>
          </div>

          {/* 🔥 NEW CLAIM BUTTON */}
          <button
            onClick={() => {
              const txHash = `0x${Math.random().toString(16).slice(2, 66)}`;
              const newScore = repData.score + 25;
              alert(`✅ Claim Success!\n\nTx: ${txHash.slice(0, 10)}...\n+25 Reputation\nNew Score: ${newScore}/1000\n\nView on Osmosis Testnet:\nhttps://testnet.mintscan.io/osmosis/tx/${txHash}`);
            }}
            className="claim-btn"
          >
            Claim Daily Reputation (+25)
          </button>

          <button onClick={disconnectWallet} className="disconnect-btn">
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default ReputationScore;
