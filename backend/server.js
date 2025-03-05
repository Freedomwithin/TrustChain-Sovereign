const express = require('express');
const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { StargateClient } = require('@cosmjs/stargate');
const app = express();
const rpcEndpoint = 'https://rpc.osmosis.zone';
const port = 3001;

// Function to fetch a proposal by its ID
const getProposal = async (proposalId) => {
    const client = await SigningCosmWasmClient.connect(rpcEndpoint);
    const proposal = await client.gov.proposal(proposalId);
    return proposal;
};

// API endpoint to get a proposal by ID
app.get('/proposals/:id', async (req, res) => {
    try {
        const proposalId = req.params.id;
        const proposal = await getProposal(proposalId);
        res.json(proposal);
    } catch (error) {
        console.error('Error fetching proposal:', error);
        res.status(500).json({ error: 'Failed to fetch proposal' });
    }
});

// Function to fetch transactions for an address
const getTransactions = async (address) => {
    try {
        const client = await StargateClient.connect(rpcEndpoint);
        const transactions = await client.searchTx({ sentFromOrTo: address });

        const transformedTransactions = transactions.map(tx => {
            const message = tx.tx.body.messages[0]; // Assuming a single message per transaction
            return {
                hash: tx.hash,
                type: message.typeUrl,
                timestamp: tx.timestamp,
                amount: message.amount ? message.amount[0].amount : 'N/A', // Extract amount if available
                fee: tx.tx.authInfo.fee.amount[0].amount, // Extract fee
                // ... other relevant data
            };
        });

        return transformedTransactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw new Error('Failed to fetch transactions');
    }
}; 

// API endpoint to get transactions for an address
app.get('/users/:address/transactions', async (req, res) => {
    try {
        const address = req.params.address;
        const transactions = await getTransactions(address);
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// API endpoint to get reputation score for an address (placeholder)
app.get('/users/:address/reputation', async (req, res) => {
    // TODO: Implement actual reputation calculation
    res.json({ score: 100 });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});