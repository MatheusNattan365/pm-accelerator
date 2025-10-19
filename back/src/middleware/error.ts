import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class LocationNotFoundError extends CustomError {
  constructor(location: string) {
    super(`Location not found: ${location}`, 404, true);
    this.name = 'LocationNotFoundError';
  }
}

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  }
  // Handle custom application errors
  else if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle MongoDB duplicate key errors
  else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry. This record already exists.';
  }
  // Handle MongoDB validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = Object.values((error as any).errors).map((err: any) => ({
      field: err.path,
      message: err.message
    }));
  }
  // Handle MongoDB cast errors (invalid ObjectId, etc.)
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  // Handle Axios errors
  else if (error.message.includes('Weather service error') || 
           error.message.includes('Geocoding service error') ||
           error.message.includes('Historical weather service error')) {
    statusCode = 502;
    message = error.message;
  }
  // Handle location not found errors
  else if (error.message.includes('Location not found')) {
    statusCode = 400;
    message = error.message;
  }
  // Handle generic errors with message
  else if (error.message) {
    message = error.message;
  }

  // Log error for debugging (in production, use proper logging)
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      message,
      statusCode,
      ...(details && { details })
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Create custom error instances
 */
export const createError = {
  badRequest: (message: string = 'Bad Request') => new CustomError(message, 400),
  unauthorized: (message: string = 'Unauthorized') => new CustomError(message, 401),
  forbidden: (message: string = 'Forbidden') => new CustomError(message, 403),
  notFound: (message: string = 'Not Found') => new CustomError(message, 404),
  conflict: (message: string = 'Conflict') => new CustomError(message, 409),
  unprocessableEntity: (message: string = 'Unprocessable Entity') => new CustomError(message, 422),
  tooManyRequests: (message: string = 'Too Many Requests') => new CustomError(message, 429),
  internalServerError: (message: string = 'Internal Server Error') => new CustomError(message, 500),
  badGateway: (message: string = 'Bad Gateway') => new CustomError(message, 502),
  serviceUnavailable: (message: string = 'Service Unavailable') => new CustomError(message, 503)
};
