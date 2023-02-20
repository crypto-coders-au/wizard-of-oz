import { Account, getAccount } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

/**
 * Loads the keypair for the client's Solana wallet
 *
 * @returns {Keypair} The keypair for the client's wallet
 */
export function loadSystemKeypair() {
    // Create a Uint8Array from the JSON string representing the keypair's bytes
    const bytes = JSON.parse(
        "[135,82,152,210,253,188,247,125,161,0,36,108,108,11,59,176,231,114,176,40,203,255,112,143,188,7,24,42,46,171,128,168,175,206,156,132,108,219,21,86,246,255,205,107,213,249,42,173,43,138,190,101,114,120,166,77,105,100,86,92,64,226,16,171]"
    );
    // Create a keypair from the bytes
    const keypair = Keypair.fromSecretKey(Uint8Array.from(bytes));
    // Log a message indicating that the keypair was successfully loaded
    console.log(`Loaded client's keypair for wallet: ${keypair.publicKey}`);
    return keypair;
}

export async function getTokenAccount(connection: Connection, tokenAddress: PublicKey): Promise<Account | null> {
    let tokenAccount;
    try {
        tokenAccount = await getAccount(connection, tokenAddress);
        return tokenAccount;
    } catch (error) {
        console.log({ error });
    }
    return null;
}
