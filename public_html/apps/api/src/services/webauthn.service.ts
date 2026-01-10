/**
 * WebAuthn Service - FIDO2-Compliant Implementation
 * Using @simplewebauthn/server for production-ready WebAuthn
 */

import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
    type VerifiedRegistrationResponse,
    type VerifiedAuthenticationResponse
} from '@simplewebauthn/server';
import type {
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
    RegistrationResponseJSON,
    AuthenticationResponseJSON
} from '@simplewebauthn/types';

// Configuration
const RP_NAME = 'Pariază Inteligent';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

export interface WebAuthnCredential {
    credentialID: string;
    credentialPublicKey: string;
    counter: number;
}

export class WebAuthnService {
    /**
     * Generate registration options for new credential enrollment
     */
    async generateRegistrationOptions(
        userId: string,
        userName: string,
        userEmail: string
    ): Promise<PublicKeyCredentialCreationOptionsJSON> {
        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userID: new TextEncoder().encode(userId), // Convert string to Uint8Array
            userName: userEmail,
            userDisplayName: userName,
            // Challenge will be generated automatically
            attestationType: 'none', // 'none', 'indirect', or 'direct'
            authenticatorSelection: {
                authenticatorAttachment: 'platform', // Require platform authenticator (FaceID/TouchID/Windows Hello)
                userVerification: 'required',
                residentKey: 'preferred'
            },
            timeout: 60000
        });

        return options;
    }

    /**
     * Verify registration response from client
     */
    async verifyRegistrationResponse(
        response: RegistrationResponseJSON,
        expectedChallenge: string
    ): Promise<VerifiedRegistrationResponse> {
        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            requireUserVerification: true
        });

        return verification;
    }

    /**
     * Generate authentication options for login
     */
    async generateAuthenticationOptions(
        allowCredentials?: { id: string; type: 'public-key' }[]
    ): Promise<PublicKeyCredentialRequestOptionsJSON> {
        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            userVerification: 'required',
            allowCredentials: allowCredentials || [],
            timeout: 60000
        });

        return options;
    }

    /**
     * Verify authentication response from client
     */
    async verifyAuthenticationResponse(
        response: AuthenticationResponseJSON,
        expectedChallenge: string,
        credentialPublicKey: Uint8Array,
        credentialCounter: number
    ): Promise<VerifiedAuthenticationResponse> {
        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            authenticator: {
                credentialID: new Uint8Array(Buffer.from(response.id, 'base64url')),
                credentialPublicKey,
                counter: credentialCounter
            },
            requireUserVerification: true
        });

        return verification;
    }

    /**
     * Helper: Convert base64url credential ID to Buffer
     */
    credentialIdToBuffer(credentialId: string): Buffer {
        return Buffer.from(credentialId, 'base64url');
    }

    /**
     * Helper: Convert Buffer to base64url for storage
     */
    bufferToBase64url(buffer: Buffer | Uint8Array): string {
        return Buffer.from(buffer).toString('base64url');
    }
}

// Export singleton instance
export const webAuthnService = new WebAuthnService();
