import React, { useContext } from 'react';
import './App.css';
import WalletConnectContext from './context/WalletConnectContext';
import ReputationScore from './components/ReputationScore';
import TransactionHistory from './components/TransactionHistory';
import GovernanceVoting from './components/GovernanceVoting';
import { useAccount } from 'wagmi';

function App() {
    const { web3modal, wagmiConfig } = useContext(WalletConnectContext);
    const { address, isConnected } = useAccount(wagmiConfig);

    const connectWallet = () => {
        web3modal.openModal();
    };

    return (
        <div className="App">
            <header className="App-header">
                <button onClick={connectWallet}>
                    {isConnected ? 'Connected' : 'Connect Wallet'}
                </button>
                {isConnected && (
                    <div>
                        <h3>Connected Address:</h3>
                        <p>{address}</p>
                        <ReputationScore />
                        <TransactionHistory transactions={[]} /> {/* Replace [] with your actual transactions */}
                        <GovernanceVoting />
                    </div>
                )}
            </header>
        </div>
    );
}

export default App;