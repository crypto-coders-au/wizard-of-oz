import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { loadBobsKeypair } from "../../helpers";
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";

const spl1Mint = new PublicKey("2w3wCoxnMn2nbsbRx2uBJ8DWXXfXazE1Twwjc1GNCc4y");
const spl2Mint = new PublicKey("2w3wCoxnMn2nbsbRx2uBJ8DWXXfXazE1Twwjc1GNCc4y");

const spl1Amount = 5;
const spl2Amount = 1;

export interface IBuildTokenSwapTransaction {
    connection: Connection;
    user: PublicKey;
}

export default async function buildTokenSwapTransaction(options: IBuildTokenSwapTransaction): Promise<Transaction> {
    console.log(`BEGIN: buildTokenSwapTransaction`);
    const { connection, user } = options;

    const bob = loadBobsKeypair();

    // Find the token accounts for the A token for Alice and Bob
    const aliceTokenAccountA = await getAssociatedTokenAddress(spl1Mint, user);
    const bobTokenAccountA = await getAssociatedTokenAddress(spl1Mint, bob.publicKey);

    // CAVEAT - this assumes that Bob already has a token A account initisalised, we'll look at what todo if that isn't the case later

    // Create an instruction to transfer 5 token A from Alice to Bob
    const transferInstructionA = createTransferInstruction(
        aliceTokenAccountA, // source
        bobTokenAccountA, // destination
        user, // owner
        spl1Amount // amount
    );

    // Find the token accounts for the B token for Alice and Bob
    const aliceTokenAccountB = await getAssociatedTokenAddress(spl2Mint, user);
    const bobTokenAccountB = await getAssociatedTokenAddress(spl2Mint, bob.publicKey);

    // CAVEAT - this assumes that Alice already has a token B account initisalised, we'll look at what todo if that isn't the case later

    // Create an instruction to transfer 1 token B from Bob to Alice
    const transferInstructionB = createTransferInstruction(
        bobTokenAccountB, // source
        aliceTokenAccountB, // destination
        bob.publicKey, // owner
        spl2Amount // amount
    );

    // Create a Transaction
    const tx = new Transaction();

    // Add the fee payer
    tx.feePayer = user;

    const latestBlockHash = await connection.getLatestBlockhash();

    tx.recentBlockhash = latestBlockHash.blockhash;

    // Add the transferA instruction to transaction
    tx.add(transferInstructionA);

    // Add the transferB instruction to transaction
    tx.add(transferInstructionB);

    // Have Bob partially sign the transaction
    tx.partialSign(bob);

    console.log(`END: buildTokenSwapTransaction`);
    
    return tx;
}
