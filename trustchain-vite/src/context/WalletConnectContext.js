import React, { createContext, useState, useEffect, useCallback } from 'react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/html';
import {
  configureChains,
  createConfig,
  getAccount,
  watchAccount,
  reconnect,
  connect as wagmiConnect,
  disconnect as wagmiDisconnect,
} from '@wagmi/core';
import { osmosis } from '@chain-registry/osmosis';

const WalletConnectContext = createContext();

export const WalletConnectProvider = ({ children }) => {
  const [wagmiConfig, setWagmiConfig] = useState(null);
  const [web3modal, setWeb3Modal] = useState(null);
  const [account, setAccount] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize WalletConnect / Web3Modal / wagmi config
  useEffect(() => {
    const initializeWalletConnect = async () => {
      try {
        const projectId = 'cae6286b4e1c3e58da733fbb9eb457ce';

        // Osmosis chain from chain-registry
        const chains = [osmosis]; // can extend later with testnets or other cosmos chains[web:13]

        // 1. Configure wagmi core
        const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
        const config = createConfig({
          autoConnect: true,
          connectors: w3mConnectors({ projectId, chains }),
          publicClient,
        });

        // 2. Create EthereumClient and Web3Modal
        const ethereumClient = new EthereumClient(config, chains);
        const modal = new Web3Modal({ projectId }, ethereumClient);

        setWagmiConfig(config);
        setWeb3Modal(modal);

        // 3. Restore any existing session and set initial account
        await reconnect(config); // restores previous WalletConnect session if any[web:8]

        const currentAccount = getAccount(config);
        setAccount(currentAccount);

        // 4. Watch for account changes (connect, disconnect, switch)[web:8][web:11]
        const unwatch = watchAccount(config, {
          onChange(nextAccount) {
            setAccount(nextAccount);
          },
        });

        setIsReady(true);

        return () => {
          unwatch?.();
        };
      } catch (error) {
        console.error('Failed to initialize WalletConnect:', error);
        setIsReady(true);
      }
    };

    initializeWalletConnect();
  }, []);

  // Helper: open Web3Modal to connect
  const connectWallet = useCallback(async () => {
    if (!web3modal || !wagmiConfig) return;

    try {
      // Open WalletConnect modal; underlying connectors are wired via wagmi config[web:4][web:12]
      await web3modal.openModal();
      // After connection, watchAccount / getAccount will update `account`
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }, [web3modal, wagmiConfig]);

  // Helper: programmatic connect via wagmi (optional, if you later want 1-click without modal)
  const connectWithDefaultConnector = useCallback(async () => {
    if (!wagmiConfig) return;

    try {
      const [defaultConnector] = wagmiConfig.connectors ?? [];
      if (!defaultConnector) return;

      await wagmiConnect(wagmiConfig, { connector: defaultConnector });
    } catch (error) {
      console.error('Error connecting with default connector:', error);
    }
  }, [wagmiConfig]);

  // Helper: disconnect wallet
  const disconnectWallet = useCallback(async () => {
    if (!wagmiConfig) return;

    try {
      await wagmiDisconnect(wagmiConfig);
      setAccount(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, [wagmiConfig]);

  return (
    <WalletConnectContext.Provider
      value={{
        wagmiConfig,
        web3modal,
        account,
        isReady,
        connectWallet,
        connectWithDefaultConnector,
        disconnectWallet,
      }}
    >
      {children}
    </WalletConnectContext.Provider>
  );
};

export default WalletConnectContext;
