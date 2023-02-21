import { Connection, PublicKey, Signer, Transaction } from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createTransferInstruction
} from "@solana/spl-token";
import { getTokenAccount, loadSystemKeypair } from "../helpers";
import { Metaplex } from "@metaplex-foundation/js";

// Declare the reward mint and amount as constants
const SPL_REWARD_MINT = new PublicKey("HkyEe5gciHbioszGtQTRdAK72QYPsNrUYjHJHE2ASGvJ");
const SPL_REWARD_AMOUNT = 10;

// Define the interface for the transaction options
export interface IBuildBurnNftForRewardTransaction {
    connection: Connection;
    user: PublicKey;
    mintAddress: PublicKey;
}

/**
 * Builds a nft burn for token reward transaction between the user and the system
 *
 * @param {IBuildTokenSwapTransaction} options - The options for building the transaction
 * @returns {Transaction} The built nft burn for token reward transaction
 */
export default async function buildBurnNftForRewardTransaction(
    options: IBuildBurnNftForRewardTransaction
): Promise<Transaction> {
    console.log(`BEGIN: buildBurnNftForRewardTransaction`);
    const { connection, user, mintAddress } = options;

    // Load the system keypair once and reuse it
    const systemKeypair = loadSystemKeypair();

    // Create the transaction with the user as the fee payer and the latest blockhash
    const tx = new Transaction({ feePayer: user });
    const latestBlockHash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockHash.blockhash;

    // Use Metaplex to get the NFT for the mint address
    const metaplex = Metaplex.make(connection);
    const nft = await metaplex.nfts().findByMint({ mintAddress });

    // Check if the NFT collection is verified and valid
    if (!nft.collection?.verified) {
        throw new Error("NFT collection is unverified");
    }
    if (nft.collection?.address.toBase58() !== "HEAKpy99JuLhfinuLgji757JxHvPizBo7WaXvWBYc3kz") {
        throw new Error("NFT collection is not valid");
    }

    // Use Metaplex to create the delete transaction builder for the NFT
    const deleteTransactionBuilder = await metaplex
        .nfts()
        .builders()
        .delete({
            mintAddress,
            owner: { publicKey: user } as Signer
        });

    // Add the delete instructions to the transaction
    const burnIxs = deleteTransactionBuilder.getInstructions();
    for (const ix of burnIxs) {
        tx.add(ix);
    }

    // Find the associated token accounts for the reward token for the user and the system
    const userRewardTokenAddress = await getAssociatedTokenAddress(SPL_REWARD_MINT, user);
    const systemRewardTokenAddress = await getAssociatedTokenAddress(SPL_REWARD_MINT, systemKeypair.publicKey);

    // Create or get the associated token account for the user
    let userRewardTokenAccount = await getTokenAccount(connection, userRewardTokenAddress);
    if (userRewardTokenAccount == null) {
        tx.add(
            createAssociatedTokenAccountInstruction(
                user, // payer
                userRewardTokenAddress, // address
                user, // owner
                SPL_REWARD_MINT // mint
            )
        );
    }

    // Create an instruction to transfer the reward token from the system to the user
    const rewardInstruction = createTransferInstruction(
        systemRewardTokenAddress, // source
        userRewardTokenAddress, // destination
        systemKeypair.publicKey, // owner
        SPL_REWARD_AMOUNT // amount
    );

    // Add the transfer instruction for the reward token to the transaction
    tx.add(rewardInstruction);

    // Partially sign the transaction with the system's keypair
    tx.partialSign(systemKeypair);

    console.log(`END: buildBurnNftForRewardTransaction`);

    return tx;
}
