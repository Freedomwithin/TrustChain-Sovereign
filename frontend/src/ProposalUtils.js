import { SigningCosmWasmClient, GasPrice } from "@cosmjs/cosmwasm-stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { QueryClient, setupGovExtension } from "@cosmjs/stargate";

// Function to fetch governance proposals from the Osmosis blockchain
export const fetchProposals = async (rpcEndpoint) => {
    try {
        const tendermintClient = await Tendermint34Client.connect(rpcEndpoint);
        const queryClient = QueryClient.withExtensions(tendermintClient, setupGovExtension);

        const proposals = await queryClient.gov.proposals({ proposalStatus: 0 }); // 0 for all proposals

        // Extract and format the proposal data
        const formattedProposals = proposals.proposals.map(proposal => ({
            id: proposal.id,
            title: proposal.content.value.title,
            description: proposal.content.value.description,
            // Add other relevant proposal details
        }));

        return formattedProposals;
    } catch (error) {
        console.error("Error fetching proposals:", error);
        return []; // Return an empty array in case of error
    }
};

// Function to vote on a governance proposal
export const voteOnProposal = async (proposalId, voteOption, address, rpcEndpoint, signer) => {
    try {
        const gasPrice = GasPrice.fromString("0.025uosmo"); // Adjust gas price as needed
        const client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer, { gasPrice });

        const vote = {
            option: voteOption, // Assuming voteOption is a number or VoteOption enum value
        };

        const result = await client.gov.vote(address, proposalId, vote);
        console.log("Vote transaction result:", result);
        return result;

    } catch (error) {
        console.error("Error voting on proposal:", error);
        throw error; // Rethrow the error for handling in the component
    }
};