import React, { createContext, useState, useEffect, useCallback } from 'react';

const WalletConnectContext = createContext();

export const WalletConnectProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const connectWallet = useCallback(() => {
    setAccount({ 
      address: 'SVRQGjRmizi3Lvv4vHmtW4x6ap7dKs65QVooUdnbZuJ',
      chainId: 'solana-devnet'
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
  }, []);

  const value = {
    account,
    isReady,
    connectWallet,
    disconnectWallet,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
};

export { WalletConnectContext };
export default WalletConnectProvider;
