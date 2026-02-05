import React, { useContext, useState, useEffect } from 'react';
import WalletConnectContext from '../context/WalletConnectContext';
import axios from 'axios';
import { useAccount } from 'wagmi';

function ReputationScore() {
    const { wagmiConfig } = useContext(WalletConnectContext);
    const { address, isConnected } = useAccount(wagmiConfig);
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchScore = async () => {
            if (isConnected && address) {
                setLoading(true);
                setError(null);

                try {
                    const response = await axios.get(`https://trust-chain-backend-1nixsz5ct-jonathon-koerners-projects.vercel.app/users/${address}/reputation`);
                    setScore(response.data.score);
                } catch (e) {
                    if (e.response) {
                        setError(`Server Error: ${e.response.status} ${e.response.statusText}`);
                    } else if (e.request) {
                        setError('Network Error: No response received');
                    } else {
                        setError(`Error: ${e.message}`);
                    }
                } finally {
                    setLoading(false);
                }
            } else {
                setScore(null);
            }
        };

        fetchScore();
    }, [isConnected, address]);

    if (loading) {
        return <div>Loading reputation score...</div>;
    }

    if (error) {
        return <div>Error fetching reputation: {error}</div>;
    }

    return (
        <div>
            <h2>Reputation Score: {score !== null ? score : 'N/A'}</h2>
        </div>
    );
}

export default ReputationScore;