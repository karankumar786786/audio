export class CoreError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "CoreError";
  }
}

export class NotFoundError extends CoreError {
  constructor(message: string = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends CoreError {
  constructor(message: string = "Bad request") {
    super(400, message);
    this.name = "BadRequestError";
  }
}
