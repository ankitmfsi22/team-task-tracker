import { LoginInputSchema, RegisterInputSchema } from '@team-task-tracker/shared';
import { Router, type RequestHandler } from 'express';
import { validate } from '../../common/http/validate.js';
import type { AuthController } from './auth.controller.js';

export interface AuthRouterDeps {
  controller: AuthController;
  requireAuth: RequestHandler;
  requireOrigin: RequestHandler;
}

export const createAuthRouter = ({
  controller,
  requireAuth,
  requireOrigin,
}: AuthRouterDeps): Router => {
  const router = Router();
  router.post('/register', validate({ body: RegisterInputSchema }), controller.register);
  router.post('/login', validate({ body: LoginInputSchema }), controller.login);
  // Cookie-authenticated, so no body validation: the cookie is the only input.
  router.post('/refresh', requireOrigin, controller.refresh);
  router.post('/logout', requireOrigin, controller.logout);
  router.get('/me', requireAuth, controller.me);
  return router;
};
