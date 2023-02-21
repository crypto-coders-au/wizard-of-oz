import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createTransferInstruction
} from "@solana/spl-token";
import { getTokenAccount, loadSystemKeypair } from "../helpers";

// Declare the token mints and amount as constants
const SPL_TOKEN_MINT_A = new PublicKey("2w3wCoxnMn2nbsbRx2uBJ8DWXXfXazE1Twwjc1GNCc4y");
const SPL_TOKEN_MINT_B = new PublicKey("HkyEe5gciHbioszGtQTRdAK72QYPsNrUYjHJHE2ASGvJ");

const SPL_TOKEN_AMOUNT_A = 5;
const SPL_TOKEN_AMOUNT_B = 1;

export interface IBuildTokenSwapTransaction {
    connection: Connection;
    user: PublicKey;
}

/**
 * Builds a token swap transaction between the user and the system
 *
 * @param {IBuildTokenSwapTransaction} options - The options for building the transaction
 * @returns {Transaction} The built token swap transaction
 */
export default async function buildTokenSwapTransaction(options: IBuildTokenSwapTransaction): Promise<Transaction> {
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

    // Find the associated token accounts for token A for the user and the system
    const userTokenAddressA = await getAssociatedTokenAddress(SPL_TOKEN_MINT_A, user);
    const systemTokenAddressA = await getAssociatedTokenAddress(SPL_TOKEN_MINT_A, systemKeypair.publicKey);

    // Check if the system has an associated token account for token A
    let systemTokenAccountA = await getTokenAccount(connection, systemTokenAddressA);
    if (systemTokenAccountA == null) {
        // If not, create an associated token account for the system and add it to the transaction
        tx.add(
            createAssociatedTokenAccountInstruction(
                user, // payer
                systemTokenAddressA, // address
                systemKeypair.publicKey, // owner
                SPL_TOKEN_MINT_A
            )
        );
    }

    // Create an instruction to transfer token A from the user to the system
    const transferInstructionA = createTransferInstruction(
        userTokenAddressA, // source
        systemTokenAddressA, // destination
        user, // owner
        SPL_TOKEN_AMOUNT_A // amount
    );

    // Add the transfer instruction for token A to the transaction
    tx.add(transferInstructionA);

    // Find the associated token accounts for token B for the user and the system
    const userTokenAddressB = await getAssociatedTokenAddress(SPL_TOKEN_MINT_B, user);
    const systemTokenAddressB = await getAssociatedTokenAddress(SPL_TOKEN_MINT_B, systemKeypair.publicKey);

    // Check if the user has an associated token account for token B
    let userTokenAccountB = await getTokenAccount(connection, userTokenAddressB);
    if (userTokenAccountB == null) {
        // If not, create an associated token account for the user and add it to the transaction
        tx.add(
            createAssociatedTokenAccountInstruction(
                user, // payer
                userTokenAddressB, // address
                user, // owner
                SPL_TOKEN_MINT_B
            )
        );
    }

    // Create an instruction to transfer token B from the system to the user
    const transferInstructionB = createTransferInstruction(
        systemTokenAddressB, // source
        userTokenAddressB, // destination
        systemKeypair.publicKey, // owner
        SPL_TOKEN_AMOUNT_B // amount
    );

    // Add the transfer instruction for token B to the transaction
    tx.add(transferInstructionB);

    // Partially sign the transaction with the system's keypair
    tx.partialSign(systemKeypair);

    console.log(`END: buildTokenSwapTransaction`);

    return tx;
}
