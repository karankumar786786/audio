import { NodeCryptoSignatureService } from "./src/lib/signature/node-crypto.ts";
const sig = new NodeCryptoSignatureService("audio-sync-secret-2026-v1");
const id = sig.generateSignedId();
console.log("Generated:", id);
try {
  sig.verifyId(id);
  console.log("Verified successfully!");
} catch (e) {
  console.log("Verification failed:", (e as any).message);
}
