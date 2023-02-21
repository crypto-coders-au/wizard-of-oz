import {
    BlockheightBasedTransactionConfirmationStrategy,
    clusterApiUrl,
    Connection,
    PublicKey,
    Transaction
} from "@solana/web3.js";
import bs58 from "bs58";
import burnNftForRewardMockLambda from "../backend/mockLambdas/burnNftForRewardMockLambda";
import { loadClientKeypair } from "./helpers";

const mintAddress = new PublicKey("7vV6SiWW45zvBVoaKh2HLRLVGX2ujTs2ZLmrT6UyP6qw");

(async () => {
    // Load the keypair for signing the transaction
    const signer = loadClientKeypair();

    // Create a connection to the Solana cluster
    const connection = new Connection(clusterApiUrl("devnet"));

    // Get the encoded transaction from the mock lambda
    const encodedTx = await burnNftForRewardMockLambda({
        user: signer.publicKey,
        mintAddress
    });

    // Log the encoded transaction for debugging purposes
    console.log({
        encodedTx
    });

    // Decode the transaction from base-58 encoding
    const decodedTxBytes = bs58.decode(encodedTx);

    // Create a buffer from the decoded transaction bytes
    const decodedTxBuffer = Buffer.from(decodedTxBytes);

    // Create a transaction object from the decoded buffer
    const tx = Transaction.from(decodedTxBuffer);

    // Partially sign the transaction with the signer's keypair
    tx.partialSign(signer);

    // Serialize the transaction to raw bytes
    const rawTransaction = tx.serialize();

    // Send the raw transaction to the Solana cluster and wait for a signature
    const signature = await connection.sendRawTransaction(rawTransaction, {
        maxRetries: 3,
        preflightCommitment: "finalized",
        skipPreflight: false
    });

    // Get the latest block hash from the Solana cluster
    const latestBlockHash = await connection.getLatestBlockhash();

    // Create a confirmation strategy for the transaction
    const confirmationStrategy: BlockheightBasedTransactionConfirmationStrategy = {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature
    };

    // Log a message indicating that transaction confirmation is starting
    console.log("Starting transaction confirmation...");

    // Confirm the transaction and wait for it to be finalized
    const result = await connection.confirmTransaction(confirmationStrategy, "confirmed");

    // Log a message indicating that the transaction has been confirmed, along with its signature
    console.log("Transaction confirmed:", signature);
})();
