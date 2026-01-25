/* eslint-disable no-unused-vars */
import React, { createContext, useState, useEffect, useCallback } from 'react';
// import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
// import { Web3Modal } from '@web3modal/html';
// import {
//   createConfig,
//   getAccount,
//   watchAccount,
//   reconnect,
//   disconnect,
// } from '@wagmi/core';
// import { osmosis } from '@chain-registry/osmosis';

const WalletConnectContext = createContext();

export const WalletConnectProvider = ({ children }) => {
  const [wagmiConfig, setWagmiConfig] = useState(null);
  const [web3modal, setWeb3Modal] = useState(null);
  const [account, setAccount] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeWalletConnect = async () => {
      try {
        const projectId = 'cae6286b4e1c3e58da733fbb9eb457ce';
        // const chains = [osmosis];

        // const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
        // const config = createConfig({
        //   autoConnect: true,
        //   connectors: w3mConnectors({ projectId, chains }),
        //   publicClient,
        // });

        // const ethereumClient = new EthereumClient(config, chains);
        // const modal = new Web3Modal({ projectId }, ethereumClient);

        // setWagmiConfig(config);
        // setWeb3Modal(modal);

        // await reconnect(config);
        // const currentAccount = getAccount(config);
        // setAccount(currentAccount);

        // const unwatch = watchAccount(config, {
        //   onChange(nextAccount) {
        //     setAccount(nextAccount);
        //   },
        // });

        // TEMP DISABLED - Focus on Integrity Badge Demo
        setIsReady(true);
        return () => {};
      } catch (error) {
        console.error('WalletConnect init failed:', error);
        setIsReady(true);
      }
    };

    initializeWalletConnect();
  }, []);

  // EMPTY FUNCTIONS - Wallet disabled for badge demo
  const connectWallet = useCallback(() => {
    console.log('Wallet disabled - demo mode');
  }, []);

  const disconnectWallet = useCallback(() => {
    console.log('Wallet disabled - demo mode');
  }, []);

  const value = {
    wagmiConfig,
    web3modal,
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

export default WalletConnectContext;
