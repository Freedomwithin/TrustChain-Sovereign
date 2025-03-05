import React, { useState, useEffect } from 'react';
import { fetchProposals } from '../utils/ProposalUtils';
import WalletConnectContext from '../context/WalletConnectContext';

function GovernanceVoting() {
    const [proposals, setProposals] = useState(); // Initialize as an empty array
    const [selectedProposal, setSelectedProposal] = useState(null);
    const { accounts } = useContext(WalletConnectContext);
    
    useEffect(() => {
        const rpcEndpoint = 'https://rpc.osmosis.zone'; // Replace with actual endpoint if needed
        fetchProposals(rpcEndpoint)
            .then(setProposals)
            .catch(console.error);
    },); // The empty dependency array ensures this runs only once on mount

    const handleVote = async (proposalId, voteOption) => {
        // Here you would use CosmJS to sign and broadcast a
        // governance vote transaction to the Osmosis blockchain
        console.log(`Voting on proposal ${proposalId} with option ${voteOption}`);
    };

    return (
        <div>
            <h3>Governance Proposals:</h3>
            <ul>
                {proposals.map((proposal) => (
                    <li key={proposal.id}>
                        <h4>{proposal.title}</h4>
                        <p>{proposal.description}</p>
                        <div>
                            <button onClick={() => handleVote(proposal.id, 'yes')}>Yes</button>
                            <button onClick={() => handleVote(proposal.id, 'no')}>No</button>
                            <button onClick={() => handleVote(proposal.id, 'abstain')}>Abstain</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default GovernanceVoting;