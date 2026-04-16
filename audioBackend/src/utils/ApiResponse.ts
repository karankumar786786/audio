import type { Request, Response } from "express";

export class ApiResponse<T = unknown> {
  readonly statusCode: number;
  readonly message: string;
  readonly data: T | null;
  readonly success: boolean;

  constructor(
    statusCode: number = 200,
    message: string = "Success",
    data: T | null = null,
    success: boolean = statusCode < 400
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = success;
  }

  send(res: Response): Response {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }

  sendToken(req: Request, res: Response, token: string): Response {
    const userAgent = req.headers["user-agent"] || "";

    const isBrowser = typeof userAgent === "string" && (
      userAgent.includes("Mozilla") || 
      userAgent.includes("Chrome") || 
      userAgent.includes("Safari") || 
      userAgent.includes("Edge")
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    if (!isBrowser) {
      // 📦 API / mobile / Postman
      return res.status(this.statusCode).json({
        success: this.success,
        message: this.message,
        data: {
          ...this.data,
          token,
        },
      });
    }

    // 🌐 Browser → cookies + token in body (frontend needs it for localStorage)
    res.cookie("token", token, cookieOptions);

    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: {
        ...this.data,
        token,
      },
    });
  }
}
