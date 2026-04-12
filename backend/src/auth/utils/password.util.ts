/**

 * @module password.util

 *

 * **Purpose:** Centralized password hashing and verification using Node `scrypt` for auth flows.

 *

 * **Responsibilities:** Generate per-password salts; constant-time compare digests; reuse same hash format for refresh tokens.

 *

 * **Integration notes:** Parameters (key length, scrypt options) must remain backward compatible with stored hashes.

 */



import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

import { promisify } from "node:util";



// promisify wraps callback-based scrypt for async/await (Node crypto.scrypt is callback-first).

const scryptAsync = promisify(scrypt);



// Derived key length in bytes (64 B = 512 bits).

const KEY_LENGTH = 64;



/**

 * Hash a password with scrypt and a random per-password salt.

 *

 * Steps:

 * 1. Generate a 32-byte random salt so identical passwords yield distinct hashes.

 * 2. Derive a key from password + salt via scrypt.

 * 3. Persist `salt:hash` (both hex) in the database.

 *

 * Storage format: "salt:hash" (hex).

 *

 * @returns "hex_salt:hex_hash"

 */

export async function hashPassword(password: string): Promise<string> {

  const salt = randomBytes(32).toString('hex');

  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  return `${salt}:${derivedKey.toString('hex')}`;

}



/**

 * Verify a plaintext password against a stored "salt:hash" record.

 *

 * Uses timingSafeEqual instead of === to mitigate timing attacks on digest comparison.

 *

 * @returns true when the password matches

 */

export async function verifyPassword(

  password: string,

  storedHash: string,

): Promise<boolean> {

  const [salt, hash] = storedHash.split(':');

  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  const hashBuffer = Buffer.from(hash, 'hex');

  return timingSafeEqual(derivedKey, hashBuffer);

}
