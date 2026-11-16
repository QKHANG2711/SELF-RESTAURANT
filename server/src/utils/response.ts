import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    data,
    message: message || 'Thành công',
  });
}

export function sendError(
  res: Response,
  errorMessage: string,
  statusCode: number = 400,
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: errorMessage,
    details: details || null,
  });
}
