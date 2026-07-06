import { hashPassword } from 'better-auth/crypto';

const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

// Hashes a plaintext password for storage in the credential account table.
export async function hashUserPassword(password: string): Promise<string> {
  return hashPassword(password);
}

// Generates a random temporary password for admin-provisioned accounts.
export function generateTemporaryPassword(length = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(bytes, (byte) => TEMP_PASSWORD_CHARS[byte % TEMP_PASSWORD_CHARS.length]).join('');
}
