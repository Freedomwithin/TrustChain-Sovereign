import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";

// Function to fetch governance proposals from the Osmosis blockchain
export const fetchProposals = async (rpcEndpoint) => {
    const client = await SigningCosmWasmClient.connect(rpcEndpoint);
    const proposals = await client.gov.proposals();
    return proposals;
};