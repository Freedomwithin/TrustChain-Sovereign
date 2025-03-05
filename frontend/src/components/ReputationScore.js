import React, { useContext, useState, useEffect } from 'react';
import WalletConnectContext from '../context/WalletConnectContext';
import axios from 'axios';

function ReputationScore() {
    const { accounts } = useContext(WalletConnectContext);
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchScore = async () => {
            if (accounts && accounts.length > 0) {
                setLoading(true);
                setError(null);

                try {
                    const response = await axios.get(`http://localhost:3001/users/${accounts[0]}/reputation`);
                    setScore(response.data.score);
                } catch (e) {
                    if (e.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        setError(`Server Error: ${e.response.status} ${e.response.statusText}`);
                    } else if (e.request) {
                        // The request was made but no response was received
                        setError('Network Error: No response received');
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        setError(`Error: ${e.message}`);
                    }
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchScore();
    }, [accounts]);

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