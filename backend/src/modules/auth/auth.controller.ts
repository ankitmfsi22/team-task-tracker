import {
  AuthResponseSchema,
  AuthUserSchema,
  REFRESH_TOKEN_TTL_DAYS,
  type LoginInput,
  type RegisterInput,
} from '@team-task-tracker/shared';
import type { CookieOptions, RequestHandler, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { validBody } from '../../common/http/validate.js';
import type { Env } from '../../config/env.js';
import type { AuthService, Session } from './auth.service.js';

export const REFRESH_COOKIE = 'refresh_token';

export interface AuthController {
  register: RequestHandler;
  login: RequestHandler;
  refresh: RequestHandler;
  logout: RequestHandler;
  me: RequestHandler;
}

export const createAuthController = ({
  service,
  env,
}: {
  service: AuthService;
  env: Pick<Env, 'COOKIE_SECURE'>;
}): AuthController => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.COOKIE_SECURE,
    path: '/api/auth',
  };
  const maxAge = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

  const sendSession = (res: Response, status: number, session: Session): void => {
    res.cookie(REFRESH_COOKIE, session.refreshToken, { ...cookieOptions, maxAge });
    res
      .status(status)
      .json(AuthResponseSchema.parse({ user: session.user, accessToken: session.accessToken }));
  };

  const presentedToken = (cookies: unknown): string | undefined => {
    const value = (cookies as Record<string, unknown> | undefined)?.[REFRESH_COOKIE];
    return typeof value === 'string' && value !== '' ? value : undefined;
  };

  return {
    register: async (_req, res) => {
      sendSession(res, 201, await service.register(validBody<RegisterInput>(res)));
    },

    login: async (_req, res) => {
      sendSession(res, 200, await service.login(validBody<LoginInput>(res)));
    },

    refresh: async (req, res) => {
      try {
        sendSession(res, 200, await service.refresh(presentedToken(req.cookies)));
      } catch (error) {
        if (error instanceof AppError && error.code === 'UNAUTHORIZED') {
          res.clearCookie(REFRESH_COOKIE, cookieOptions);
        }
        throw error;
      }
    },

    logout: async (req, res) => {
      await service.logout(presentedToken(req.cookies));
      res.clearCookie(REFRESH_COOKIE, cookieOptions);
      res.status(204).end();
    },

    me: async (req, res) => {
      const userId = req.auth?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required');
      res.json(AuthUserSchema.parse(await service.me(userId)));
    },
  };
};
