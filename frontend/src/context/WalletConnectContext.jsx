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
    // Update this to your 6QsE address
    const demoAddress = import.meta.env.VITE_NOTARY_PUBLIC_KEY || '6QsEMrsHgnBB2dRVeySrGAi5nYy3eq35w4sywdis1xJ5';
    setAccount({
      address: demoAddress,
      chainId: 'solana-devnet'
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
  }, []);

  const value = { account, isReady, connectWallet, disconnectWallet };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
};

export { WalletConnectContext };
export default WalletConnectProvider;