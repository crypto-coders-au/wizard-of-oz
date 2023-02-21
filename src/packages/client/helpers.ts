import { Keypair } from "@solana/web3.js";

/**
 * Loads the keypair for the client's Solana wallet
 *
 * @returns {Keypair} The keypair for the client's wallet
 */
export function loadClientKeypair() {
    // Create a Uint8Array from the JSON string representing the keypair's bytes
    const bytes = JSON.parse(
        "[118,248,42,246,152,235,105,174,101,1,85,156,219,146,75,146,81,251,40,131,255,75,49,192,106,24,26,19,26,196,195,250,215,96,55,209,85,16,85,59,193,112,50,196,41,24,213,157,217,185,81,80,20,195,74,111,46,82,156,114,232,117,45,54]"
    );
    // Create a keypair from the bytes
    const keypair = Keypair.fromSecretKey(Uint8Array.from(bytes));
    // Log a message indicating that the keypair was successfully loaded
    console.log(`Loaded client's keypair for wallet: ${keypair.publicKey}`);
    return keypair;
}
