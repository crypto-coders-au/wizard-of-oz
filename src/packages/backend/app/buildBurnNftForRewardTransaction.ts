import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import { getTokenAccount, loadSystemKeypair } from "../helpers";
import { keypairIdentity, Metaplex } from "@metaplex-foundation/js";

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

    const bytes = JSON.parse(
      "[118,248,42,246,152,235,105,174,101,1,85,156,219,146,75,146,81,251,40,131,255,75,49,192,106,24,26,19,26,196,195,250,215,96,55,209,85,16,85,59,193,112,50,196,41,24,213,157,217,185,81,80,20,195,74,111,46,82,156,114,232,117,45,54]"
    );
    // Create and return the keypair from the bytes
    const wallet = Keypair.fromSecretKey(Uint8Array.from(bytes));
  
    const metaplex = new Metaplex(connection).use(keypairIdentity(wallet));

    const deleteTransactionBuilder = await metaplex.nfts().builders().delete({
      mintAddress
    });
  
    const burnIxs = deleteTransactionBuilder.getInstructions();

    for ( const ix of burnIxs )
      tx.add(ix);

    // Partially sign the transaction with the system's keypair
    // tx.partialSign(systemKeypair);

    console.log(`END: buildBurnNftForRewardTransaction`);

    return tx;
}
