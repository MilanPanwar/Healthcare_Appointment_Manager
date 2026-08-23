import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Safe logging without leaking sensitive keys
  console.error('[Error Middleware]:', {
    message: err?.message || 'Unknown server error',
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred. Please try again later.'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
