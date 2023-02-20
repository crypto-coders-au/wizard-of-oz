import { clusterApiUrl, Connection, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
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
    
    var decodedTx = bs58.decode(encodedTokenSwapTx);
    
    var decodedTxBuffer = Buffer.from(decodedTx);
    const tx =  Transaction.from(decodedTxBuffer);
  
    tx.partialSign(alice);

    // Sign and send the transaction
    const signature = await sendAndConfirmTransaction(connection, tx, [], {
        commitment: "singleGossip"
    });

    console.log("Transaction confirmed:", signature);
})();
