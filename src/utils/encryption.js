const crypto = require('crypto');

// Configuration
// Ideally, fetch these from environment variables
const ALGO = 'aes-256-gcm';
// Ensure MASTER_KEY is 32 bytes (64 hex characters) in .env
// Fallback is for dev ONLY. 
const MASTER_KEY_HEX = process.env.ENCRYPTION_MASTER_KEY || '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'; 
const KEY = Buffer.from(MASTER_KEY_HEX, 'hex');

/**
 * Encrypts cleartext using AES-256-GCM.
 * @param {string} text - The cleartext string to encrypt.
 * @returns {string} - Base64 encoded string containing IV, AuthTag, and Encrypted Data.
 */
exports.encrypt = (text) => {
    if (!text) return null;

    // 1. Generate unique IV (12 bytes for GCM)
    const iv = crypto.randomBytes(12);

    // 2. Create Cipher
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);

    // 3. Encrypt
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);

    // 4. Get Auth Tag (16 bytes) - Critical for integrity
    const tag = cipher.getAuthTag();

    // 5. Combine and return as Base64 (IV + Tag + Encrypted)
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
};

/**
 * Decrypts a Base64 encoded string encrypted with the above encrypt function.
 * @param {string} enc - The Base64 encoded ciphertext.
 * @returns {string} - The original cleartext string.
 */
exports.decrypt = (enc) => {
    if (!enc) return null;

    try {
        // 1. Decode Base64
        const data = Buffer.from(enc, 'base64');

        // 2. Extract Parts
        // IV = First 12 bytes
        const iv = data.subarray(0, 12);
        // Tag = Next 16 bytes
        const tag = data.subarray(12, 28);
        // Text = Rest
        const text = data.subarray(28);

        // 3. Create Decipher
        const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
        decipher.setAuthTag(tag);

        // 4. Decrypt and Return
        return decipher.update(text) + decipher.final('utf8');
    } catch (error) {
        // Return null or handle error if decryption fails (tampering detected)
        console.error('Decryption failed:', error.message);
        return null;
    }
};
