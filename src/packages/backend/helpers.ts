import { Account, getAccount } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

/**
 * Loads the keypair for the client's Solana wallet
 *
 * @returns {Keypair} The keypair for the client's wallet
 */
export function loadSystemKeypair(): Keypair {
    // Load the keypair's bytes from a JSON string
    const bytes = JSON.parse(
        "[135,82,152,210,253,188,247,125,161,0,36,108,108,11,59,176,231,114,176,40,203,255,112,143,188,7,24,42,46,171,128,168,175,206,156,132,108,219,21,86,246,255,205,107,213,249,42,173,43,138,190,101,114,120,166,77,105,100,86,92,64,226,16,171]"
    );
    // Create and return the keypair from the bytes
    const keypair = Keypair.fromSecretKey(Uint8Array.from(bytes));
    console.log(`Loaded keypair for wallet: ${keypair.publicKey}`);
    return keypair;
}

/**
 * Gets the account information for a token address
 *
 * @param {Connection} connection - The connection to the Solana cluster
 * @param {PublicKey} tokenAddress - The public key of the token account
 * @returns {Promise<Account | null>} The token account or null if it doesn't exist
 */
export async function getTokenAccount(connection: Connection, tokenAddress: PublicKey): Promise<Account | null> {
    try {
        // Try to get the token account
        const tokenAccount = await getAccount(connection, tokenAddress);
        return tokenAccount;
    } catch (error) {
        console.log({ error });
    }
    // If the account doesn't exist, return null
    return null;
}
