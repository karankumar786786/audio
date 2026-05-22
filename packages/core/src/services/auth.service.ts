import * as crypto from "node:crypto";
import nodemailer from "nodemailer";
import type { UserRepository } from "../repository/user.repository.ts";
import type { JWTService } from "../infra/jwt.ts";
import { BadRequestError, NotFoundError } from "../errors/index.ts";
import { SignJWT, jwtVerify } from "jose";
import Redis from "ioredis";

const redis = new Redis("rediss://default:gQAAAAAAAUeXAAIgcDEzYTkxY2I1YjljMTE0MTExOWZmZGM1NDM0MTQ2ZWNmYw@sunny-wildcat-83863.upstash.io:6379");

export interface OtpSession {
    email: string;
    name?: string;
    otp: string;
    action: "register" | "login";
    role?: "user" | "admin" | "superadmin";
    expiresAt: number;
}

export class OtpCacheService {
    async set(token: string, session: OtpSession): Promise<void> {
        await redis.set(`otp:${token}`, JSON.stringify(session), "EX", 300);
    }

    async get(token: string): Promise<OtpSession | null> {
        const data = await redis.get(`otp:${token}`);
        if (!data) return null;
        try {
            return JSON.parse(data) as OtpSession;
        } catch (_) {
            return null;
        }
    }

    async delete(token: string): Promise<void> {
        await redis.del(`otp:${token}`);
    }
}

export class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private fromEmail: string = "no-reply@onemelody.com";

    constructor() {
        const host = process.env.SMTP_HOST;
        const port = process.env.SMTP_PORT;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const from = process.env.SMTP_FROM;

        if (host && port && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port: parseInt(port, 10),
                secure: port === "465",
                auth: { user, pass }
            });
            if (from) this.fromEmail = from;
        }
    }

    async sendOtp(email: string, otp: string, name?: string): Promise<void> {
        const subject = "Your OneMelody Verification Code";
        const text = `Hello ${name || "User"},\n\nYour 6-digit OTP code is: ${otp}.\nThis code is valid for 5 minutes.`;
        const html = `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #ffffff; color: #18181b;">
                <h2 style="color: #4f46e5; text-align: center; margin-top: 0;">OneMelody Verification</h2>
                <p>Hello ${name || "User"},</p>
                <p>Your one-time authorization code is shown below. This code will expire in <strong>5 minutes</strong>.</p>
                <div style="background-color: #f4f4f5; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 15px; margin: 20px 0; border-radius: 6px; border: 1px dashed #4f46e5; color: #18181b;">
                    ${otp}
                </div>
                <p style="font-size: 12px; color: #71717a; line-height: 1.5;">If you did not request this security code, please ignore this email. Someone may have typed your email address by mistake.</p>
                <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
                <p style="font-size: 11px; color: #a1a1aa; text-align: center; margin: 0;">OneMelody Inc. &copy; 2026</p>
            </div>
        `;

        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: this.fromEmail,
                    to: email,
                    subject,
                    text,
                    html
                });
            } catch (err) {
                console.error("Failed to send SMTP email. Falling back to console output:", err);
                this.logToConsole(email, otp, subject);
            }
        } else {
            this.logToConsole(email, otp, subject);
        }
    }

    private logToConsole(email: string, otp: string, subject: string): void {
        console.log("\n" + "=".repeat(60));
        console.log(`✉️  [MAIL SIMULATOR] Outbox to: ${email}`);
        console.log(`🔑  OTP Code: ${otp}`);
        console.log(`📌  Subject: ${subject}`);
        console.log("=".repeat(60) + "\n");
    }
}

export class AuthService {
    private otpCache = new OtpCacheService();
    private emailService = new EmailService();
    private secret: Uint8Array;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JWTService,
        private readonly signatureSecret: string,
        private readonly jwtSecretKey: string
    ) {
        this.secret = new TextEncoder().encode(jwtSecretKey);
    }

    private generateHmacToken(email: string, action: string, name?: string | null): string {
        const payload = {
            email,
            name: name || undefined,
            action,
            salt: crypto.randomUUID(),
            createdAt: Date.now()
        };
        const payloadStr = JSON.stringify(payload);
        const base64Payload = Buffer.from(payloadStr).toString("base64url");
        const signature = crypto
            .createHmac("sha256", this.signatureSecret)
            .update(base64Payload)
            .digest("base64url");
        return `${base64Payload}.${signature}`;
    }

    private verifyHmacToken(token: string): { email: string; name?: string; action: string } {
        if (!token || typeof token !== "string") {
            throw new BadRequestError("Invalid session token");
        }
        const parts = token.split(".");
        if (parts.length !== 2) {
            throw new BadRequestError("Invalid session token format");
        }
        const base64Payload = parts[0] as string;
        const signature = parts[1] as string;
        const expectedSignature = crypto
            .createHmac("sha256", this.signatureSecret)
            .update(base64Payload)
            .digest("base64url");

        if (signature !== expectedSignature) {
            throw new BadRequestError("Tampered session token signature");
        }

        try {
            const payloadStr = Buffer.from(base64Payload, "base64url").toString("utf8");
            return JSON.parse(payloadStr);
        } catch (_) {
            throw new BadRequestError("Invalid session token payload");
        }
    }

    async register(name: string, email: string): Promise<string> {
        if (!name || !email) {
            throw new BadRequestError("Name and email are required");
        }
        const existing = await this.userRepository.getByEmail(email);
        if (existing) {
            throw new BadRequestError("User already exists with this email");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const token = this.generateHmacToken(email, "register", name);

        await this.otpCache.set(token, {
            email,
            name,
            otp,
            action: "register",
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        await this.emailService.sendOtp(email, otp, name);
        return token;
    }

    async login(email: string): Promise<string> {
        if (!email) {
            throw new BadRequestError("Email is required");
        }
        const user = await this.userRepository.getByEmail(email);
        if (!user) {
            throw new BadRequestError("User not found. Please register first");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const token = this.generateHmacToken(email, "login", user.name);

        await this.otpCache.set(token, {
            email,
            name: user.name || undefined,
            otp,
            action: "login",
            role: user.role,
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        await this.emailService.sendOtp(email, otp, user.name || undefined);
        return token;
    }

    async resendOtp(token: string): Promise<string> {
        this.verifyHmacToken(token);
        const cached = await this.otpCache.get(token);
        if (!cached) {
            throw new BadRequestError("OTP session expired or not found. Please register/login again.");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        cached.otp = otp;
        cached.expiresAt = Date.now() + 5 * 60 * 1000;
        await this.otpCache.set(token, cached);

        await this.emailService.sendOtp(cached.email, otp, cached.name);
        return token;
    }

    async verifyOtp(token: string, otp: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
        this.verifyHmacToken(token);
        const cached = await this.otpCache.get(token);
        if (!cached) {
            throw new BadRequestError("Verification session expired or invalid. Please request a new OTP.");
        }
        if (cached.otp !== otp) {
            throw new BadRequestError("Incorrect OTP. Please try again.");
        }

        let user = await this.userRepository.getByEmail(cached.email);
        if (cached.action === "register" && !user) {
            user = await this.userRepository.create({
                email: cached.email,
                name: cached.name || "",
                role: "user"
            });
        }

        if (!user) {
            throw new NotFoundError("User could not be resolved");
        }

        const avatarUrl = `https://avatar.vercel.sh/${user.email}`;
        const accessClaims = {
            id: user.id,
            userName: user.name || "",
            email: user.email,
            picture: avatarUrl,
            role: user.role
        };

        const accessToken = await this.jwtService.sign(accessClaims);

        const refreshClaims = {
            id: user.id,
            email: user.email,
            type: "refresh"
        };
        const refreshToken = await new SignJWT(refreshClaims)
            .setIssuer("audio-sync-auth")
            .setIssuedAt()
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("30d")
            .sign(this.secret);

        await this.otpCache.delete(token);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name || "",
                email: user.email,
                role: user.role
            }
        };
    }

    async refreshToken(token: string): Promise<string> {
        if (!token) {
            throw new BadRequestError("Refresh token is required");
        }
        try {
            const { payload } = await jwtVerify(token, this.secret, {
                issuer: "audio-sync-auth",
                algorithms: ["HS256"]
            });
            const claims = payload as { id: string; email: string; type: string };
            if (claims.type !== "refresh") {
                throw new BadRequestError("Invalid token type");
            }
            const user = await this.userRepository.getByEmail(claims.email);
            if (!user) {
                throw new NotFoundError("User not found");
            }

            const avatarUrl = `https://avatar.vercel.sh/${user.email}`;
            const accessClaims = {
                id: user.id,
                userName: user.name || "",
                email: user.email,
                picture: avatarUrl,
                role: user.role
            };
            return await this.jwtService.sign(accessClaims);
        } catch (err: any) {
            throw new BadRequestError("Invalid or expired refresh token");
        }
    }
}
