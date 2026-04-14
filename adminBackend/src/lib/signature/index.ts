import * as crypto from 'crypto';

export class SignatureService {
    private static readonly ALGORITHM = 'sha256';
    private readonly SECRET: string;

    constructor(secret: string) {
        if (!secret) {
            throw new Error("Secret is required");
        }
        this.SECRET = secret;
    }

    generateSignedId(): string {
        const uuid = crypto.randomUUID().replace(/-/g, "");

        const signature = crypto
            .createHmac(SignatureService.ALGORITHM, this.SECRET)
            .update(uuid)
            .digest('hex');

        return `${uuid}.${signature}`;
    }

    verifyId(signedId: string, ref: string = "id"): void {
        if (!signedId || typeof signedId !== 'string') {
            throw new Error(`Invalid ${ref} received`);
        }

        const parts = signedId.split('.');
        if (parts.length !== 2) {
            throw new Error(`Invalid ${ref} received`);
        }

        const [uuid, providedSignature] = parts;

        if (!uuid || !providedSignature) {
            throw new Error(`Invalid ${ref} received`);
        }

        const expectedSignature = crypto
            .createHmac(SignatureService.ALGORITHM, this.SECRET)
            .update(uuid)
            .digest('hex');

        try {
            const isValid = crypto.timingSafeEqual(
                Buffer.from(providedSignature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );

            if (!isValid) {
                throw new Error(`Invalid ${ref} signature`);
            }

        } catch {
            throw new Error(`Invalid ${ref} received`);
        }
    }
}