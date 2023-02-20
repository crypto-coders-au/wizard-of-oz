import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import buildBurnNftForRewardTransaction from "../app/buildBurnNftForRewardTransaction";
import buildTokenSwapTransaction from "../app/buildTokenSwapTransaction";

/**
 * A mock lambda function that builds a token swap transaction for a given user and returns its encoded form
 *
 * @param {object} options - The options for the function
 * @param {PublicKey} options.user - The public key of the user's Solana wallet
 * @returns {string} The base-58 encoded form of the token swap transaction
 */
export default async function burnNftForRewardMockLambda(options: { user: PublicKey, mintAddress: PublicKey }) {
  // Extract the user's public key from the options
  const { user, mintAddress } = options;

  // Create a connection to the Solana cluster
  const connection = new Connection(clusterApiUrl("devnet"));

  // Build a token swap transaction for the user
  const tx: Transaction = await buildBurnNftForRewardTransaction({
    connection,
    user,
    mintAddress
  });

  // Encode the transaction in base-58 format
  const serializedTx = bs58.encode(tx.serialize({ requireAllSignatures: false }));

  // Return the encoded transaction
  return serializedTx;
}
