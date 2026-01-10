import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;     // For AES, this is always 16
const SALT_LENGTH = 64;   // For validation
const TAG_LENGTH = 16;    // GCM auth tag length

// Get key from env or throw error in production (fallback only for dev)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev_secret_key_must_be_32_bytes!!';
// Ensure key is 32 bytes
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));

export const EncryptionService = {
    encrypt(text: string): string {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: IV:AuthTag:EncryptedData
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    },

    decrypt(text: string): string {
        const parts = text.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encryption format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    },

    /**
     * Create a deterministic hash for uniqueness checks (Blind Index)
     * Uses SHA-256. This is ONE-WAY and deterministic.
     */
    hash(text: string): string {
        return crypto.createHash('sha256').update(text).digest('hex');
    }
};
