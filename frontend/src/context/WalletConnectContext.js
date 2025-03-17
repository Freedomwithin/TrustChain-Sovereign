import React, { createContext, useState, useEffect } from 'react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/html';
import { configureChains, createConfig, getAccount } from '@wagmi/core';
import { osmosis } from '@chain-registry/osmosis';

const WalletConnectContext = createContext();

export const WalletConnectProvider = ({ children }) => {
    const [wagmiConfig, setWagmiConfig] = useState(null);
    const [web3modal, setWeb3Modal] = useState(null);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        const initializeWalletConnect = async () => {
            const projectId = 'cae6286b4e1c3e58da733fbb9eb457ce';
            const chains = [osmosis];

            const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
            const config = createConfig({
                autoConnect: true,
                connectors: w3mConnectors({ projectId, chains }),
                publicClient,
            });

            const ethereumClient = new EthereumClient(config, chains);
            const modal = new Web3Modal({ projectId }, ethereumClient);

            setWagmiConfig(config);
            setWeb3Modal(modal);

            const currentAccount = getAccount(config);
            setAccount(currentAccount);
        };

        initializeWalletConnect();
    }, []);

    return (
        <WalletConnectContext.Provider value={{ wagmiConfig, web3modal, account }}>
            {children}
        </WalletConnectContext.Provider>
    );
};

export default WalletConnectContext;