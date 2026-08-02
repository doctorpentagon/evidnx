import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors.js";

/**
 * Normalizes every error into { code, message, details, retryable } per the
 * frontend's error-contract expectations - never leaks raw stack traces or
 * framework error shapes to the client.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(422).json({
      code: "VALIDATION_ERROR",
      message: "Some fields need attention.",
      details: err.flatten(),
      retryable: false,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
      retryable: err.statusCode >= 500,
    });
    return;
  }

  console.error("Unexpected error:", err);
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Something went wrong on our end. Please try again.",
    retryable: true,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    code: "NOT_FOUND",
    message: `No route matches ${req.method} ${req.path}.`,
    retryable: false,
  });
}
