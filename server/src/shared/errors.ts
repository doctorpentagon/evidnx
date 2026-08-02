export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static notFound(resource: string, id?: string | number) {
    return new AppError(404, "NOT_FOUND", `${resource}${id !== undefined ? ` "${id}"` : ""} was not found.`);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, "BAD_REQUEST", message, details);
  }

  static validation(message: string, details?: unknown) {
    return new AppError(422, "VALIDATION_ERROR", message, details);
  }

  static conflict(message: string) {
    return new AppError(409, "CONFLICT", message);
  }
}
