import type { RequestHandler } from 'express';
import type { Env } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';

// CSRF defence for cookie-authenticated POSTs (SDS section 7): the Origin header must be APP_ORIGIN.
export const createRequireOrigin = ({ env }: { env: Pick<Env, 'APP_ORIGIN'> }): RequestHandler => {
  const allowed = new URL(env.APP_ORIGIN).origin;
  return (req, _res, next) => {
    if (req.headers.origin !== allowed) {
      next(new AppError('FORBIDDEN', 'Origin not allowed'));
      return;
    }
    next();
  };
};
