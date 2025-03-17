import React, { useState, useEffect, useContext } from 'react';
import { fetchProposals } from '../utils/ProposalUtils';
import WalletConnectContext from '../context/WalletConnectContext';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';

function GovernanceVoting() {
    const [proposals, setProposals] = useState();
    const [selectedProposal, setSelectedProposal] = useState(null);
    const { web3modal, wagmiConfig } = useContext(WalletConnectContext);
    const { address, isConnected } = useAccount(wagmiConfig);
    const { connect } = useConnect(wagmiConfig);
    const { disconnect } = useDisconnect(wagmiConfig);
    const { signMessageAsync } = useSignMessage(wagmiConfig);

    useEffect(() => {
        const rpcEndpoint = 'https://rpc.osmosis.zone';
        fetchProposals(rpcEndpoint)
            .then(setProposals)
            .catch(console.error);
    },);

    const handleVote = async (proposalId, voteOption) => {
        if (!isConnected) {
            alert('Please connect your wallet to vote.');
            return;
        }

        // Example: Sign a message (replace with actual voting transaction)
        try {
            const message = `Vote ${voteOption} on proposal ${proposalId}`;
            const signature = await signMessageAsync({ message });
            console.log('Vote Signature:', signature);

            // Replace with actual CosmJS transaction signing and broadcasting
            console.log(`Voting on proposal ${proposalId} with option ${voteOption}`);
            // ... your CosmJS code here ...

        } catch (error) {
            console.error('Vote signing failed:', error);
            alert('Vote signing failed.');
        }
    };

    const handleConnect = () => {
        web3modal.openModal();
    };

    const handleDisconnect = () => {
        disconnect();
    };

    return (
        <div>
            <h3>Governance Proposals:</h3>
            {isConnected ? (
                <div>
                    <p>Connected Address: {address}</p>
                    <button onClick={handleDisconnect}>Disconnect</button>
                </div>
            ) : (
                <button onClick={handleConnect}>Connect Wallet</button>
            )}
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