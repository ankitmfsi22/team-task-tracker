import express from 'express';
import { SignJWT } from 'jose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { createErrorHandler } from '../errors/error-middleware.js';
import { createTestEnv } from '../../../tests/support/test-app.js';
import { createRequireAuth } from './require-auth.js';

const USER_ID = '0192f3a0-6f4e-7c1a-8b2d-3e4f5a6b7c8d';

// Mini app: a route behind requireAuth that echoes req.auth. No database involved.
const build = () => {
  const env = createTestEnv();
  let reached = false;
  const app = express();
  app.get('/guarded', createRequireAuth({ env }), (req, res) => {
    reached = true;
    res.json({ userId: req.auth?.userId });
  });
  app.use(createErrorHandler(createLogger(env)));
  return { app, env, wasReached: () => reached };
};

describe('requireAuth', () => {
  it('S-DEV1006-23 requireAuth sets the caller', async () => {
    const { app, env, wasReached } = build();
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(USER_ID)
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(new TextEncoder().encode(env.JWT_ACCESS_SECRET));

    const ok = await request(app).get('/guarded').set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect((ok.body as { userId: string }).userId).toBe(USER_ID);

    const { app: app2, wasReached: reached2 } = build();
    const denied = await request(app2).get('/guarded');
    expect(denied.status).toBe(401);
    expect((denied.body as { error: { code: string } }).error.code).toBe('UNAUTHORIZED');
    expect(reached2()).toBe(false);
    expect(wasReached()).toBe(true);
  });
});
