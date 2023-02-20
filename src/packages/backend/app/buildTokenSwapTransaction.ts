import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import { loadSystemKeypair } from "../helpers";

const splTokenAMint = new PublicKey("2w3wCoxnMn2nbsbRx2uBJ8DWXXfXazE1Twwjc1GNCc4y");
const splTokenBMint = new PublicKey("HkyEe5gciHbioszGtQTRdAK72QYPsNrUYjHJHE2ASGvJ");

const splTokenAAmount = 5;
const splTokenBAmount = 1;

export interface IBuildTokenSwapTransaction {
    connection: Connection;
    user: PublicKey;
}

/**
 * Builds a token swap transaction between the user and another party
 *
 * @param {IBuildTokenSwapTransaction} options - The options for building the transaction
 * @returns {Transaction} The built token swap transaction
 */
export default async function buildTokenSwapTransaction(options: IBuildTokenSwapTransaction): Promise<Transaction> {
    console.log(`BEGIN: buildTokenSwapTransaction`);
    const { connection, user } = options;

    // Load the keypair for the other party involved in the swap
    const systemKeypair = loadSystemKeypair();

    // Find the associated token accounts for token A for the user and the other party
    const userTokenAccountA = await getAssociatedTokenAddress(splTokenAMint, user);
    const otherPartyTokenAccountA = await getAssociatedTokenAddress(splTokenAMint, systemKeypair.publicKey);

    // Create an instruction to transfer token A from the user to the other party
    const transferInstructionA = createTransferInstruction(
        userTokenAccountA, // source
        otherPartyTokenAccountA, // destination
        user, // owner
        splTokenAAmount // amount
    );

    // Find the associated token accounts for token B for the user and the other party
    const userTokenAccountB = await getAssociatedTokenAddress(splTokenBMint, user);
    const otherPartyTokenAccountB = await getAssociatedTokenAddress(splTokenBMint, systemKeypair.publicKey);

    // Create an instruction to transfer token B from the other party to the user
    const transferInstructionB = createTransferInstruction(
        otherPartyTokenAccountB, // source
        userTokenAccountB, // destination
        systemKeypair.publicKey, // owner
        splTokenBAmount // amount
    );

    // Create a Transaction
    const tx = new Transaction();

    // Set the user as the fee payer
    tx.feePayer = user;

    // Set the recent blockhash for the transaction
    const latestBlockHash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockHash.blockhash;

    // Add the transfer instruction for token A to the transaction
    tx.add(transferInstructionA);

    // Add the transfer instruction for token B to the transaction
    tx.add(transferInstructionB);

    // Partially sign the transaction with the other party's keypair
    tx.partialSign(systemKeypair);

    console.log(`END: buildTokenSwapTransaction`);

    return tx;
}
