import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async controllers to handle errors and keep TypeScript happy.
 * @example
 * router.get('/me', asyncHandler<AuthRequest>(getMe));
 */
export const asyncHandler = <Req extends Request = Request, Res extends Response = Response>(
  fn: (req: Req, res: Res, next: NextFunction) => Promise<any>,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
  };
};
