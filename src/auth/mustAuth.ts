import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from '../common/status-codes';

// eslint-disable-next-line consistent-return
export function mustAuthenticated(req: Request,
  res: Response,
  next: NextFunction):void | Response<any, Record<string, any>> {
  if (!req.isAuthenticated()) {
    return res.status(StatusCodes.Unauthorized).send({});
  }
  next();
}
