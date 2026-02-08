/**
 * Password utility functions for secure password handling
 * 
 * ⚠️ SECURITY WARNING: Client-side password hashing is fundamentally insecure!
 * 
 * This implementation is provided for DEMONSTRATION PURPOSES ONLY.
 * 
 * Problems with client-side password hashing:
 * 1. SHA-256 is too fast (vulnerable to brute-force attacks)
 * 2. No salt is used (vulnerable to rainbow tables)
 * 3. Passwords stored in localStorage are accessible to XSS attacks
 * 4. Client-side hashing should NEVER replace server-side authentication
 * 
 * For production applications:
 * - Use server-side authentication with proper session management
 * - Use slow hashing algorithms like bcrypt, Argon2, or PBKDF2 on the server
 * - Never store passwords in localStorage or client-side storage
 * - Use HTTPS to protect data in transit
 */

/**
 * Hash a password using SHA-256
 * Returns a hex string of the hashed password
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify a password against a stored hash
 * @param {string} password - The plain text password to verify
 * @param {string} storedHash - The stored hash to compare against
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, storedHash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === storedHash;
}

/**
 * Hash a password synchronously (for compatibility)
 * 
 * @deprecated - Use async hashPassword for better security
 * @security - This function is provided for legacy compatibility only
 *             It is not secure for production use
 */
export function hashPasswordSync(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
