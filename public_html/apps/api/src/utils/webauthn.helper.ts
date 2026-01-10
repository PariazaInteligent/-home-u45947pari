/**
 * WebAuthn Helper - Server-Side Signature Validation
 * 
 * This module provides utilities for validating WebAuthn assertions
 * on the server-side for production security.
 */

import crypto from 'crypto';

/**
 * Verify WebAuthn assertion signature
 * 
 * @param publicKeyPEM - PEM-encoded public key from enrollment
 * @param signature - Base64-encoded signature from assertion
 * @param authenticatorData - Base64-encoded authenticator data
 * @param clientDataJSON - Base64-encoded client data JSON
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebAuthnAssertion(
    publicKeyPEM: string,
    signature: string,
    authenticatorData: string,
    clientDataJSON: string
): boolean {
    try {
        // Decode base64 inputs
        const signatureBuffer = Buffer.from(signature, 'base64');
        const authenticatorDataBuffer = Buffer.from(authenticatorData, 'base64');
        const clientDataBuffer = Buffer.from(clientDataJSON, 'base64');

        // Create client data hash (SHA-256)
        const hash = crypto.createHash('sha256');
        hash.update(clientDataBuffer);
        const clientDataHash = hash.digest();

        // Concatenate authenticatorData + clientDataHash (this is what was signed)
        const signedData = Buffer.concat([authenticatorDataBuffer, clientDataHash]);

        // Verify signature using public key
        const verify = crypto.createVerify('SHA256');
        verify.update(signedData);
        verify.end();

        const isValid = verify.verify(publicKeyPEM, signatureBuffer);

        return isValid;
    } catch (error) {
        console.error('[WebAuthn] Signature verification error:', error);
        return false;
    }
}

/**
 * Verify challenge in clientDataJSON
 * 
 * @param clientDataJSON - Base64-encoded client data JSON
 * @param expectedChallenge - Expected challenge (base64)
 * @returns true if challenge matches, false otherwise
 */
export function verifyChallengeInClientData(
    clientDataJSON: string,
    expectedChallenge: string
): boolean {
    try {
        const clientDataBuffer = Buffer.from(clientDataJSON, 'base64');
        const clientData = JSON.parse(clientDataBuffer.toString('utf-8'));

        // Compare challenges
        return clientData.challenge === expectedChallenge;
    } catch (error) {
        console.error('[WebAuthn] Challenge verification error:', error);
        return false;
    }
}

/**
 * Generate random challenge for WebAuthn
 * 
 * @returns Base64-encoded challenge
 */
export function generateWebAuthnChallenge(): string {
    const challenge = crypto.randomBytes(32);
    return challenge.toString('base64url'); // base64url for WebAuthn compatibility
}

/**
 * Convert raw public key to PEM format
 * 
 * @param rawPublicKey - Raw public key buffer
 * @returns PEM-encoded public key
 */
export function convertPublicKeyToPEM(rawPublicKey: Buffer): string {
    // For ES256 (ECDSA with P-256), the raw key is 65 bytes:
    // 1 byte: 0x04 (uncompressed point indicator)
    // 32 bytes: X coordinate
    // 32 bytes: Y coordinate

    // Convert to DER format, then to PEM
    // This is simplified - in production, use a library like `node-forge` or `asn1js`

    const x = rawPublicKey.slice(1, 33);
    const y = rawPublicKey.slice(33, 65);

    // ASN.1 DER encoding for ECDSA P-256 public key
    // This is a simplified version - for production, use proper ASN.1 encoding
    const derKey = Buffer.concat([
        Buffer.from([0x30, 0x59]), // SEQUENCE
        Buffer.from([0x30, 0x13]), // SEQUENCE
        Buffer.from([0x06, 0x07]), // OID
        Buffer.from([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01]), // ecPublicKey
        Buffer.from([0x06, 0x08]), // OID
        Buffer.from([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]), // prime256v1
        Buffer.from([0x03, 0x42, 0x00]), // BIT STRING
        Buffer.from([0x04]), // Uncompressed point
        x,
        y
    ]);

    const pem = `-----BEGIN PUBLIC KEY-----\n${derKey.toString('base64')}\n-----END PUBLIC KEY-----`;
    return pem;
}

/**
 * Simplified WebAuthn validation for MVP
 * 
 * For production, consider using a dedicated WebAuthn library like:
 * - @simplewebauthn/server
 * - fido2-lib
 * 
 * This implementation provides basic validation but may need enhancement
 * for full FIDO2 compliance.
 */
export const webauthnHelper = {
    verifyAssertion: verifyWebAuthnAssertion,
    verifyChallenge: verifyChallengeInClientData,
    generateChallenge: generateWebAuthnChallenge,
    convertToPEM: convertPublicKeyToPEM
};
