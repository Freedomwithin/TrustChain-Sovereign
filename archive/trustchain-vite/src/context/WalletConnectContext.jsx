import React, { createContext, useState, useEffect, useCallback } from 'react';

const WalletConnectContext = createContext();

export const WalletConnectProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      console.log('✅ WalletConnectContext ready');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const connectWallet = useCallback(() => {
    console.log('🚀 Connect Wallet clicked - Osmosis');
    setAccount({ 
      address: 'osmo1x5lmkv2f5a9m2pkksvx7ddxd6xyu3p7x5elq9n',
      chainId: 'osmosis-1'
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    console.log('🔌 Wallet disconnected');
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
