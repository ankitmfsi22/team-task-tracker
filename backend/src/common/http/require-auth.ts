import type { RequestHandler } from 'express';
import type { Env } from '../../config/env.js';
import { createAccessTokenService } from '../../modules/auth/access-token.js';
import { AppError } from '../errors/app-error.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express's documented extension point
  namespace Express {
    interface Request {
      auth?: { userId: string };
    }
  }
}

const BEARER = /^Bearer (\S+)$/;

// Every failure is the same 401, so a client cannot tell a bad signature from an expired token.
export const createRequireAuth = ({
  env,
}: {
  env: Pick<Env, 'JWT_ACCESS_SECRET'>;
}): RequestHandler => {
  const tokens = createAccessTokenService(env);
  return async (req, _res, next) => {
    const token = BEARER.exec(req.headers.authorization ?? '')?.[1];
    if (!token) {
      next(new AppError('UNAUTHORIZED', 'Authentication required'));
      return;
    }
    try {
      req.auth = await tokens.verifyAccessToken(token);
      next();
    } catch {
      next(new AppError('UNAUTHORIZED', 'Authentication required'));
    }
  };
};
