import React, { useState, useContext } from 'react';
import './App.css';
import WalletConnectContext from './context/WalletConnectContext'; // Import the correct context
import ReputationScore from './components/ReputationScore';
import TransactionHistory from './components/TransactionHistory';
import GovernanceVoting from './components/GovernanceVoting';

function App() {
    const { walletKit, accounts } = useContext(WalletConnectContext); // Use the correct context
    const [connectionError, setConnectionError] = useState(null);

    const connectWallet = async () => {
        if (walletKit) {
            try {
                await walletKit.connect();
                // No need to fetch accounts here, they are already in the context
                setConnectionError(null);
                console.log('Connected accounts:', accounts);
            } catch (error) {
                console.error('Wallet connection error:', error);
                setConnectionError(error.message);
            }
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <button onClick={connectWallet}>Connect Wallet</button>
                {connectionError && <p style={{ color: 'red' }}>Connection Error: {connectionError}</p>}
                {accounts && accounts.length > 0 && (
                    <div>
                        <h3>Connected Accounts:</h3>
                        <ul>
                            {accounts.map((account, index) => (
                                <li key={index}>{account}</li>
                            ))}
                        </ul>
                        <ReputationScore />
                        <TransactionHistory />
                        <GovernanceVoting />
                    </div>
                )}
            </header>
        </div>
    );
}

export default App;