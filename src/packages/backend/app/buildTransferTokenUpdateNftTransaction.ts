import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createTransferInstruction
} from "@solana/spl-token";
import { getTokenAccount, loadSystemKeypair } from "../helpers";

const splTokenMint = new PublicKey("2w3wCoxnMn2nbsbRx2uBJ8DWXXfXazE1Twwjc1GNCc4y");

const splTokenAmount = 5;

export interface IBuildTransferTokenUpdateNftTransaction {
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
export default async function buildTransferTokenUpdateNftTransaction(options: IBuildTransferTokenUpdateNftTransaction): Promise<Transaction> {
    console.log(`BEGIN: buildTokenSwapTransaction`);
    const { connection, user } = options;

    // Load the keypair for the system involved in the swap
    const systemKeypair = loadSystemKeypair();

    // Create a Transaction
    const tx = new Transaction();

    // Set the user as the fee payer
    tx.feePayer = user;

    // Set the recent blockhash for the transaction
    const latestBlockHash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockHash.blockhash;

    // Find the associated token accounts for token for the user and the system
    const userTokenAddress = await getAssociatedTokenAddress(splTokenMint, user);
    const systemTokenAddress = await getAssociatedTokenAddress(splTokenMint, systemKeypair.publicKey);

    // Check if the system has an associated token account for token
    let systemTokenAccount = await getTokenAccount(connection, systemTokenAddress);
    if (systemTokenAccount == null) {
        // If not, create an associated token account for the system and add it to the transaction
        tx.add(
            createAssociatedTokenAccountInstruction(
                user, // payer
                systemTokenAddress, // address
                systemKeypair.publicKey, // owner
                splTokenMint
            )
        );
    }

    // Create an instruction to transfer token from the user to the system
    const transferInstruction = createTransferInstruction(
        userTokenAddress, // source
        systemTokenAddress, // destination
        user, // owner
        splTokenAmount // amount
    );

    // Add the transfer instruction for token A to the transaction
    tx.add(transferInstruction);

    // Partially sign the transaction with the system's keypair
    // tx.partialSign(systemKeypair);

    console.log(`END: buildTransferTokenUpdateNftTransaction`);

    return tx;
}
