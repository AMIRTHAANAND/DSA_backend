import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('❌ Error:', err);

  // Prisma/MySQL specific errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation (duplicate key)
    if (prismaError.code === 'P2002') {
      const message = 'Duplicate field value entered';
      error = { ...error, message, statusCode: 400 };
    }
    
    // Record not found
    if (prismaError.code === 'P2025') {
      const message = 'Resource not found';
      error = { ...error, message, statusCode: 404 };
    }
    
    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      const message = 'Invalid reference to related resource';
      error = { ...error, message, statusCode: 400 };
    }
  }

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    const message = 'Invalid data provided';
    error = { ...error, message, statusCode: 400 };
  }

  // MySQL connection errors
  if (err.name === 'PrismaClientInitializationError') {
    const message = 'Database connection failed';
    error = { ...error, message, statusCode: 500 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { ...error, message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { ...error, message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

