import React, { useContext } from 'react';
import { WalletConnectContext } from './context/WalletConnectContext.jsx';

const ReputationScore = () => {
  const { account, isReady, connectWallet, disconnectWallet } = useContext(WalletConnectContext);

  // Mock reputation data based on wallet address
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
    <div className="reputation-card p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        TrustChain Reputation
      </h2>
      
      {!account ? (
        <button 
          onClick={connectWallet}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          Connect Osmosis Wallet
        </button>
      ) : (
        <div className="connected space-y-4">
          <div className="wallet-info p-4 bg-black/20 rounded-xl">
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
          
          <button 
            onClick={disconnectWallet}
            className="w-full bg-red-500/80 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default ReputationScore;
