import React, { createContext, useState, useEffect } from 'react';
import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';

const WalletConnectContext = createContext();

export const WalletConnectProvider = ({ children }) => {
    const [walletKit, setWalletKit] = useState(null);
    const [accounts, setAccounts] = useState();

    useEffect(() => {
        const initializeWalletKit = async () => {
            const core = new Core({
                projectId: 'cae6286b4e1c3e58da733fbb9eb457ce',
            });

            const metadata = {
                name: 'trustchain',
                description: 'Decentralized identity and reputation system for Osmosis',
                url: 'http://localhost:3000',
                icons: [], // Corrected line: now it's an empty array
            };

            try {
                const kit = await WalletKit.init({
                    core,
                    metadata,
                });
                setWalletKit(kit);

                const fetchedAccounts = await kit.getAccounts();
                setAccounts(fetchedAccounts);
            } catch (error) {
                console.error('Error initializing WalletKit:', error);
            }
        };

        initializeWalletKit();
    }, []); // Added empty dependency array

    return (
        <WalletConnectContext.Provider value={{ walletKit, accounts }}>
            {children}
        </WalletConnectContext.Provider>
    );
};

export default WalletConnectContext;
