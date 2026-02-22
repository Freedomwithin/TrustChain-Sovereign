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

  const connectWallet = useCallback((manualAddress = null) => {
    // Use the passed address, or the Notary, or the Vercel Env
    const demoAddress = manualAddress ||
      import.meta.env.VITE_NOTARY_PUBLIC_KEY ||
      'FBbjMhKtg1iyy83CeHaieqEFqw586i3WYG4zCcnXr7tc';

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