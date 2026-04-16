import * as crypto from 'crypto';
import type { SignatureService } from './index.types';
import { ApiError } from '../../utils/ApiError';

export class NodeCryptoSignatureService implements SignatureService {
    private static readonly ALGORITHM = 'sha256';
    private readonly SECRET: string;

    constructor(secret: string) {
        if (!secret) {
            throw new Error("Secret is required"); // Internal config error, generic Error is fine or use a custom InternalError
        }
        this.SECRET = secret;
    }

    generateSignedId(): string {
        const uuid = crypto.randomUUID().replace(/-/g, "");
        return this.signId(uuid);
    }

    signId(id: string): string {
        const signature = crypto
            .createHmac(NodeCryptoSignatureService.ALGORITHM, this.SECRET)
            .update(id)
            .digest('hex');

        return `${id}.${signature}`;
    }

    verifyId(signedId: string, ref: string = "id"): void {
        if (!signedId || typeof signedId !== 'string') {
            throw new ApiError(400, `Invalid ${ref} received`);
        }

        const parts = signedId.split('.');
        if (parts.length !== 2) {
            throw new ApiError(400, `Invalid ${ref} received`);
        }

        const [uuid, providedSignature] = parts;

        if (!uuid || !providedSignature) {
            throw new ApiError(400, `Invalid ${ref} received`);
        }

        const expectedSignature = crypto
            .createHmac(NodeCryptoSignatureService.ALGORITHM, this.SECRET)
            .update(uuid)
            .digest('hex');

        try {
            const isValid = crypto.timingSafeEqual(
                Buffer.from(providedSignature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );

            if (!isValid) {
                throw new ApiError(400, `Invalid ${ref} signature`);
            }

        } catch {
            throw new ApiError(400, `Invalid ${ref} received`);
        }
    }
}
