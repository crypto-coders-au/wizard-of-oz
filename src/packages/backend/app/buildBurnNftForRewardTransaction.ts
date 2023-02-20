import { Connection, PublicKey, Signer, Transaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import { getTokenAccount, loadSystemKeypair } from "../helpers";
import { Metaplex } from "@metaplex-foundation/js";

const splTokenAMint = new PublicKey("2w3wCoxnMn2nbsbRx2uBJ8DWXXfXazE1Twwjc1GNCc4y");
const splTokenBMint = new PublicKey("HkyEe5gciHbioszGtQTRdAK72QYPsNrUYjHJHE2ASGvJ");

const splTokenAAmount = 5;
const splTokenBAmount = 1;

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
export default async function buildBurnNftForRewardTransaction(options: IBuildBurnNftForRewardTransaction): Promise<Transaction> {
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

    const deleteTransactionBuilder = await metaplex.nfts().builders().delete({
      mintAddress,
      owner: { publicKey: user } as Signer,
    });
  
    const burnIxs = deleteTransactionBuilder.getInstructions();

    for ( const ix of burnIxs )
      tx.add(ix);

    // Partially sign the transaction with the system's keypair
    // tx.partialSign(systemKeypair);

    console.log(`END: buildBurnNftForRewardTransaction`);

    return tx;
}
