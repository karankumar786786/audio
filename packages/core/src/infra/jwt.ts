import { SignJWT, jwtVerify } from "jose";
import type { JWT } from "./jwt.types.ts";
import { type Payload } from "../schema/user.schema.ts";

export class Jose implements JWT<Payload> {
  private secret: Uint8Array;

  constructor(
    private readonly secretKey: string,
    private readonly expiryInHr: string,
    private readonly issuer: string,
  ) {
    this.secret = new TextEncoder().encode(this.secretKey);
  }

  async sign(payload: Payload): Promise<string> {
    return await new SignJWT(payload)
      .setIssuer(this.issuer)
      .setIssuedAt()
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(this.expiryInHr)
      .sign(this.secret);
  }

  async verify(token: string): Promise<Payload> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: this.issuer,
        algorithms: ["HS256"],
      });

      return payload as Payload;

    } catch (err: any) {
      if (err.code === "ERR_JWT_EXPIRED") {
        throw new Error("Token expired");
      }

      if (err.code === "ERR_JWS_INVALID") {
        throw new Error("Invalid signature");
      }

      throw new Error("Invalid token");
    }
  }
}

export type JWTService = InstanceType<typeof Jose>;
