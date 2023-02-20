import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import buildTokenSwapTransaction from "../app/buildTokenSwapTransaction";

export default async function tokenSwapMockLambda(options: { user: PublicKey }) {
  const { user } = options;

  const connection = new Connection(clusterApiUrl("devnet"));

  const tx: Transaction = await buildTokenSwapTransaction({
    connection,
    user
  });

  const response = {
    tx: bs58.encode(tx.serialize({ requireAllSignatures: false })),
  }
  
  return response;
}
