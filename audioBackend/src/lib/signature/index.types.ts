export interface SignatureService {
    generateSignedId(): string;
    signId(id: string): string;
    verifyId(signedId: string, ref?: string): void;
}
