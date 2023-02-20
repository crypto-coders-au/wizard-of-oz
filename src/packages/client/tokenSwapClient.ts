import {
    BlockheightBasedTransactionConfirmationStrategy,
    clusterApiUrl,
    Connection,
    sendAndConfirmTransaction,
    Transaction
} from "@solana/web3.js";
import bs58 from "bs58";
import tokenSwapMockLambda from "../backend/mockLambdas/tokenSwapMockLambda";
import { loadAlicesKeypair } from "../helpers";

(async () => {
    const alice = loadAlicesKeypair();

    const connection = new Connection(clusterApiUrl("devnet"));

    // in a real environment you're usually calling a AWS Lambda function
    const encodedTokenSwapTx = await tokenSwapMockLambda({
        user: alice.publicKey
    });

    console.log({
        encodedTokenSwapTx
    });

    var decodedTx = bs58.decode(encodedTokenSwapTx);

    var decodedTxBuffer = Buffer.from(decodedTx);
    const tx = Transaction.from(decodedTxBuffer);

    tx.partialSign(alice);

    const rawTransaction = tx.serialize();

    const signature = await connection.sendRawTransaction(rawTransaction, {
        maxRetries: 3,
        preflightCommitment: "finalized",
        skipPreflight: false
    });

    const latestBlockHash = await connection.getLatestBlockhash();

    const confirmationStrategy: BlockheightBasedTransactionConfirmationStrategy = {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature
    };

    console.log("time to start confirming transaction, this may hang...");

    const result = await connection.confirmTransaction(confirmationStrategy, "confirmed");

    console.log("Transaction confirmed:", signature);
})();
