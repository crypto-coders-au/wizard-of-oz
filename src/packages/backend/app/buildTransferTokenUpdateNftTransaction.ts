import { Connection, PublicKey, Signer, Transaction } from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createTransferInstruction
} from "@solana/spl-token";
import { getTokenAccount, loadSystemKeypair } from "../helpers";
import { bundlrStorage, keypairIdentity, Metaplex } from "@metaplex-foundation/js";

const splTokenMint = new PublicKey("2w3wCoxnMn2nbsbRx2uBJ8DWXXfXazE1Twwjc1GNCc4y");

const splTokenAmount = 5;

// Declare the valid collection that can be updated
const VALID_COLLECTION = new PublicKey("HEAKpy99JuLhfinuLgji757JxHvPizBo7WaXvWBYc3kz");

export interface IBuildTransferTokenUpdateNftTransaction {
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
export default async function buildTransferTokenUpdateNftTransaction(options: IBuildTransferTokenUpdateNftTransaction): Promise<Transaction> {
    console.log(`BEGIN: buildTokenSwapTransaction`);
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

    // Find the associated token accounts for token for the user and the system
    const userTokenAddress = await getAssociatedTokenAddress(splTokenMint, user);
    const systemTokenAddress = await getAssociatedTokenAddress(splTokenMint, systemKeypair.publicKey);

    // Check if the system has an associated token account for token
    let systemTokenAccount = await getTokenAccount(connection, systemTokenAddress);
    if (systemTokenAccount == null) {
        // If not, create an associated token account for the system and add it to the transaction
        tx.add(
            createAssociatedTokenAccountInstruction(
                user, // payer
                systemTokenAddress, // address
                systemKeypair.publicKey, // owner
                splTokenMint
            )
        );
    }

    // Create an instruction to transfer token from the user to the system
    const transferInstruction = createTransferInstruction(
        userTokenAddress, // source
        systemTokenAddress, // destination
        user, // owner
        splTokenAmount // amount
    );

    // Add the transfer instruction for token A to the transaction
    tx.add(transferInstruction);

    const metaplex = new Metaplex(connection).use(keypairIdentity(systemKeypair));

    metaplex.use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: 'https://api.devnet.solana.com',
        timeout: 60000,
    }));

    const nft = await metaplex.nfts().findByMint({mintAddress});

    // Check if the NFT collection is verified and valid
    if (!nft.collection?.verified) {
        throw new Error("NFT collection is unverified");
    }
    if (nft.collection?.address.toBase58() !== VALID_COLLECTION.toBase58()) {
        throw new Error("NFT collection is not valid");
    }

    const counterTraitIndex = nft.json.attributes?.findIndex((attr) => attr.trait_type === "Counter");

    if ( counterTraitIndex === -1 ) {
        throw new Error("Counter trait not found");
    }     

    // updating count attribute
    const newCount = parseInt(nft.json.attributes[counterTraitIndex].value) + 1;

    console.log({newCount});

    nft.json.attributes[counterTraitIndex].value = newCount.toString();

    // getting new URI
    const { uri } = await metaplex.nfts().uploadMetadata({
        ...nft.json,
    });

    const newUri = uri;

    console.log({newUri});
    
    // Use Metaplex to create the update transaction builder for the NFT
    const updateTransactionBuilder = await metaplex
    .nfts()
    .builders()
    .update({
        nftOrSft: nft,
        uri: newUri
    });

    // Add the update instructions to the transaction
    const updateIx = updateTransactionBuilder.getInstructions();
    for (const ix of updateIx) {
        tx.add(ix);
    }

    // Partially sign the transaction with the system's keypair
    tx.partialSign(systemKeypair);

    console.log(`END: buildTransferTokenUpdateNftTransaction`);

    return tx;
}
