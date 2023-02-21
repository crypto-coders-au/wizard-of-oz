import { Connection, PublicKey, Signer, Transaction } from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createTransferInstruction
} from "@solana/spl-token";
import { getTokenAccount, loadSystemKeypair } from "../helpers";
import { Metaplex } from "@metaplex-foundation/js";

const splRewardMint = new PublicKey("HkyEe5gciHbioszGtQTRdAK72QYPsNrUYjHJHE2ASGvJ");

const splRewardAmount = 10;

export interface IBuildBurnNftForRewardTransaction {
    connection: Connection;
    user: PublicKey;
    mintAddress: PublicKey;
}

/**
 * Builds a token swap transaction between the user and the system
 *
 * @param {IBuildTokenSwapTransaction} options - The options for building the transaction
 * @returns {Transaction} The built token swap transaction
 */
export default async function buildBurnNftForRewardTransaction(
    options: IBuildBurnNftForRewardTransaction
): Promise<Transaction> {
    console.log(`BEGIN: buildBurnNftForRewardTransaction`);
    const { connection, user, mintAddress } = options;

    // Load the keypair for the system involved in the swap
    const systemKeypair = loadSystemKeypair();

    // Create a Transaction
    const tx = new Transaction();

    // Set the user as the fee payer
    tx.feePayer = user;

    // Set the recent blockhash for the transaction
    const latestBlockHash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockHash.blockhash;

    const metaplex = Metaplex.make(connection);

    // get the nft for a mint address
    const nft = await metaplex.nfts().findByMint({ mintAddress });

    if (nft.collection?.verified === false) throw Error("nft collection is unverified");

    if (nft.collection?.address.toBase58() !== "HEAKpy99JuLhfinuLgji757JxHvPizBo7WaXvWBYc3kz")
        throw Error("nft collection is not valid");

    const deleteTransactionBuilder = await metaplex
        .nfts()
        .builders()
        .delete({
            mintAddress,
            owner: { publicKey: user } as Signer
        });

    const burnIxs = deleteTransactionBuilder.getInstructions();

    for (const ix of burnIxs) tx.add(ix);

    // Find the associated token accounts for reward token for the user and the system
    const userRewardTokenAddress = await getAssociatedTokenAddress(splRewardMint, user);
    const systemRewardTokenAddress = await getAssociatedTokenAddress(splRewardMint, systemKeypair.publicKey);

    // Check if the user has an associated token account for reward token
    let userRewardTokenAccount = await getTokenAccount(connection, userRewardTokenAddress);
    if (userRewardTokenAccount == null) {
      // If not, create an associated token account for the user and add it to the transaction
      tx.add(
        createAssociatedTokenAccountInstruction(
          user, // payer 
          userRewardTokenAddress, // address
          user, // owner
          splRewardMint, // mint
        )
      );
    }
    
    // Create an instruction to transfer reward token from the system to the user
    const rewardInstruction = createTransferInstruction(
        systemRewardTokenAddress, // source
        userRewardTokenAddress, // destination
        systemKeypair.publicKey, // owner
        splRewardAmount // amount
    );

    // Add the transfer instruction for token B to the transaction
    tx.add(rewardInstruction);

    // Partially sign the transaction with the system's keypair
    tx.partialSign(systemKeypair);

    console.log(`END: buildBurnNftForRewardTransaction`);

    return tx;
}
