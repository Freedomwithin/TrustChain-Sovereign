import React, { useContext } from 'react';
import WalletConnectContext from '../context/WalletConnectContext';
import { useAccount } from 'wagmi';

function TransactionHistory({ transactions }) {
    const { wagmiConfig } = useContext(WalletConnectContext);
    const { address, isConnected } = useAccount(wagmiConfig);

    // Filter transactions based on the connected address
    const filteredTransactions = transactions.filter(transaction => {
        return isConnected && (transaction.from === address || transaction.to === address);
    });

    return (
        <div>
            <h3>Transaction History:</h3>
            {isConnected ? (
                filteredTransactions.length > 0 ? (
                    <ul>
                        {filteredTransactions.map((transaction, index) => (
                            <li key={index}>
                                <p>Hash: {transaction.hash}</p>
                                <p>Timestamp: {transaction.timestamp}</p>
                                <p>Type: {transaction.type}</p>
                                <p>Amount: {transaction.amount}</p>
                                <p>Fee: {transaction.fee}</p>
                                {/* ... other details ... */}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No transactions found for this address.</p>
                )
            ) : (
                <p>Connect your wallet to view transaction history.</p>
            )}
        </div>
    );
}

export default TransactionHistory;