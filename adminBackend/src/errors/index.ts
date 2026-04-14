import { ApiError } from "../utils";

export class NotFoundError extends ApiError {
    constructor(message: string = "Resource not found") {
        super(404, message);
        this.name = "NotFoundError";
    }
}

export class BadRequestError extends ApiError {
    constructor(message: string = "Bad request") {
        super(400, message);
        this.name = "BadRequestError";
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string = "Unauthorized") {
        super(401, message);
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends ApiError {
    constructor(message: string = "Forbidden") {
        super(403, message);
        this.name = "ForbiddenError";
    }
}

export class ConflictError extends ApiError {
    constructor(message: string = "Conflict") {
        super(409, message);
        this.name = "ConflictError";
    }
}
