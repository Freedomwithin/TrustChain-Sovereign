import React, { useContext } from 'react';
import WalletConnectContext from '../context/WalletConnectContext';

function TransactionHistory({ transactions }) {
    const { accounts } = useContext(WalletConnectContext);

    return (
        <div>
            <h3>Transaction History:</h3>
            {transactions.length > 0 ? ( // Conditionally render transactions or a message
                <ul>
                    {transactions.map((transaction, index) => (
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
                <p>No transactions found.</p>
            )}
        </div>
    );
}

export default TransactionHistory;