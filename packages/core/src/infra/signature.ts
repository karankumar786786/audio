import * as crypto from "node:crypto";
import type { SignatureService } from "./signature.types.ts";
import { BadRequestError } from "../errors/index.ts";

export class NodeCryptoSignatureService implements SignatureService {
    private static readonly ALGORITHM = "sha256";
    private readonly SECRET: string;

    constructor(secret: string) {
        if (!secret) {
            throw new Error("Secret is required");
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
            .digest("hex");

        return `${id}.${signature}`;
    }

    verifyId(signedId: string, ref: string = "id"): void {
        if (!signedId || typeof signedId !== "string") {
            throw new BadRequestError(`Invalid ${ref} received`);
        }

        const parts = signedId.split(".");
        if (parts.length !== 2) {
            throw new BadRequestError(`Invalid ${ref} received`);
        }

        const [uuid, providedSignature] = parts;

        if (!uuid || !providedSignature) {
            throw new BadRequestError(`Invalid ${ref} received`);
        }

        const expectedSignature = crypto
            .createHmac(NodeCryptoSignatureService.ALGORITHM, this.SECRET)
            .update(uuid)
            .digest("hex");

        try {
            const buf1 = Buffer.from(providedSignature, "hex");
            const buf2 = Buffer.from(expectedSignature, "hex");

            if (buf1.length !== buf2.length) {
                throw new BadRequestError(`Invalid ${ref} signature`);
            }

            const isValid = crypto.timingSafeEqual(buf1, buf2);

            if (!isValid) {
                throw new BadRequestError(`Invalid ${ref} signature`);
            }

        } catch (err: any) {
            if (err instanceof BadRequestError) throw err;
            throw new BadRequestError(`Invalid ${ref} received`);
        }
    }
}
