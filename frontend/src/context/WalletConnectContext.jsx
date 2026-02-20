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
    // Use a Vite env variable so users can change it in their own .env
    const demoAddress = import.meta.env.VITE_NOTARY_PUBLIC_KEY || '5xwpcxB8ZEuspaa1NhNTCq2ouPmqV9ZJndT9UnYGRDJq';
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