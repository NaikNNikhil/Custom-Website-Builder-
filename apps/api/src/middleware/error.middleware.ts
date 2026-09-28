import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const getStatusCode = (error: unknown): number => {
  if (error instanceof ZodError) {
    return 400;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number" &&
    error.statusCode >= 400 &&
    error.statusCode < 600
  ) {
    return error.statusCode;
  }

  return 500;
};

export const errorMiddleware: ErrorRequestHandler = (
  error,
  request,
  response,
  _next,
) => {
  const statusCode = getStatusCode(error);
  const message =
    error instanceof AppError || (env.nodeEnv !== "production" && error instanceof Error)
      ? error.message
      : "Internal server error";

  if (statusCode >= 500) {
    console.error("API request failed", {
      method: request.method,
      path: request.path,
      statusCode,
    });
  }

  response.status(statusCode).json({
    error: {
      message,
    },
  });
};
