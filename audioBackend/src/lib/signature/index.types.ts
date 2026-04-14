export interface SignatureService {
    generateSignedId(): string;
    verifyId(signedId: string, ref?: string): void;
}
