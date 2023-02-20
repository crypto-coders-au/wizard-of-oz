import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";

const TOKENS = {
    mintA: new PublicKey("2w3wCoxnMn2nbsbRx2uBJ8DWXXfXazE1Twwjc1GNCc4y"),
    mintB: new PublicKey("HkyEe5gciHbioszGtQTRdAK72QYPsNrUYjHJHE2ASGvJ")
};

const amountA = 5;
const amountB = 1;

(async () => {
    // Establish connection to the network
    const connection = new Connection(clusterApiUrl("devnet"));

    // Load keypair for Alice: FVjkYVDh9WcrTt6mtSWY4dq2fCoWcouRzHZBkxcCYC13
    let bytes = JSON.parse(
        "[118,248,42,246,152,235,105,174,101,1,85,156,219,146,75,146,81,251,40,131,255,75,49,192,106,24,26,19,26,196,195,250,215,96,55,209,85,16,85,59,193,112,50,196,41,24,213,157,217,185,81,80,20,195,74,111,46,82,156,114,232,117,45,54]"
    );
    const alice = Keypair.fromSecretKey(Uint8Array.from(bytes));
    console.log(`Loaded Alice's keypair for wallet: ${alice.publicKey}`)

    // Load keypair for Bob: CqH5NDr2tqe3whx3sgPv2cY5R1FJsKbrVLcXUE2YGoxN
    bytes = JSON.parse(
        "[135,82,152,210,253,188,247,125,161,0,36,108,108,11,59,176,231,114,176,40,203,255,112,143,188,7,24,42,46,171,128,168,175,206,156,132,108,219,21,86,246,255,205,107,213,249,42,173,43,138,190,101,114,120,166,77,105,100,86,92,64,226,16,171]"
    );
    const bob = Keypair.fromSecretKey(Uint8Array.from(bytes));
    console.log(`Loaded Bob's keypair for wallet: ${bob.publicKey}`)

    // Find the token account for the A token for Alice
    const aliceTokenAccountA = await getAssociatedTokenAddress(TOKENS.mintA, alice.publicKey);
    console.log(`aliceTokenAccountA: ${aliceTokenAccountA}`)

    // Find the token account for the A token for Bob
    const bobTokenAccountA = await getAssociatedTokenAddress(TOKENS.mintA, bob.publicKey);
    console.log(`bobTokenAccountA: ${bobTokenAccountA}`)

    // CAVEAT - this assumes that Bob already has a token A account initisalised, we'll look at what todo if that isn't the case later

    // Create an instruction to transfer 5 token A from Alice to Bob
    const transferInstructionA = createTransferInstruction(
        aliceTokenAccountA, // source
        bobTokenAccountA, // destination
        alice.publicKey, // owner
        amountA // amount
    );

    // Find the token accounts for the B token for Alice and Bob
    const aliceTokenAccountB = await getAssociatedTokenAddress(TOKENS.mintB, alice.publicKey);
    const bobTokenAccountB = await getAssociatedTokenAddress(TOKENS.mintB, bob.publicKey);

    // CAVEAT - this assumes that Alice already has a token B account initisalised, we'll look at what todo if that isn't the case later

    // Create an instruction to transfer 1 token B from Bob to Alice
    const transferInstructionB = createTransferInstruction(
        bobTokenAccountB, // source
        aliceTokenAccountB, // destination
        bob.publicKey, // owner
        amountB // amount
    );

    // Create a Transaction
    const tx = new Transaction();

    // Add the transferA instruction to transaction
    tx.add(transferInstructionA);

    // Add the transferB instruction to transaction
    tx.add(transferInstructionB);

    // Sign and send the transaction
    const signature = await sendAndConfirmTransaction(connection, tx, [alice, bob], {
        commitment: "singleGossip"
    });

    console.log("Transaction confirmed:", signature);
})();
