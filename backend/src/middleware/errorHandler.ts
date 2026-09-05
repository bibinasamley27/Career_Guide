import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // Express identifies error middleware by having 4 arguments (err, req, res, next)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode =
    'statusCode' in err && typeof err.statusCode === 'number'
      ? err.statusCode
      : 500;

  const message = err.message || 'Internal Server Error';

  // Server-side logging
  if (config.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // Client-safe response: hide stack traces in production
  res.status(statusCode).json({
    success: false,
    error: {
      message:
        statusCode === 500 && config.NODE_ENV === 'production'
          ? 'Internal Server Error'
          : message,
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
