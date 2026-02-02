import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from '../types/auth.js';
import { verifyAccessToken } from '../modules/token/tokens.service.js';
import { sendError } from '../utils/apiResponse.js';
import { HttpStatus } from '../utils/httpStatus.js';

export const protect: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  let token;

  if (authReq.headers.authorization?.startsWith('Bearer')) {
    token = authReq.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, {
      message: 'Not authorized, no token',
      status: HttpStatus.UNAUTHORIZED,
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    authReq.user = decoded; // safely assign to AuthRequest
    next();
  } catch (error) {
    return sendError(res, {
      message: 'Not authorized, token failed',
      status: HttpStatus.UNAUTHORIZED,
    });
  }
};

export const authorize =
  (...roles: string[]) =>
    (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user || !roles.includes(req.user.role)) {
        sendError(res, { message: 'Forbidden', status: HttpStatus.FORBIDDEN });
        return;
      }
      next();
    };
