import type { Response } from "express";

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
}
