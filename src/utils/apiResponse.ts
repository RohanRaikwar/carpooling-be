import { Response } from 'express';
import { HttpStatus } from './httpStatus';
import { statusMap } from './statusMap';

interface SuccessPayload {
  status?: HttpStatus;
  message?: string;
  data?: any;
}

interface ErrorPayload {
  status?: HttpStatus;
  message?: string;
  error?: any;
}

export const sendSuccess = (
  res: Response,
  { status = HttpStatus.OK, message = 'Success', data = null }: SuccessPayload,
) => {
  return res.status(statusMap[status]).json({
    success: true,
    status,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  {
    status = HttpStatus.INTERNAL_ERROR,
    message = 'Something went wrong',
    error = undefined,
  }: ErrorPayload,
) => {
  return res.status(statusMap[status]).json({
    success: false,
    status,
    message,
    error,
  });
};
