import { createHash } from 'node:crypto';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/common/logger.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { createLogCapture, createTestEnv, TEST_APP_ORIGIN } from './test-app.js';

export const PASSWORD = 'correct horse battery';
export const COOKIE_NAME = 'refresh_token';
export const EVIL_ORIGIN = 'https://evil.example';
export { TEST_APP_ORIGIN };

// Real clock: access tokens are verified against wall time, so a fixed clock would drift.
export const createAuthApp = (prisma: PrismaClient, envOverrides: Record<string, string> = {}) => {
  const env = createTestEnv(envOverrides);
  const logs = createLogCapture();
  const app: Express = createApp({
    prisma,
    clock: { now: () => new Date() },
    env,
    logger: createLogger(env, logs.stream),
  });
  return { app, env, logs };
};

export const sha256Hex = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export const setCookiesOf = (res: request.Response): string[] => {
  const header = res.headers['set-cookie'] as unknown;
  return Array.isArray(header) ? (header as string[]) : [];
};

export const refreshCookieHeader = (res: request.Response): string | undefined =>
  setCookiesOf(res).find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

// "refresh_token=abc; Path=..." -> "abc"
export const refreshCookieValue = (res: request.Response): string => {
  const header = refreshCookieHeader(res);
  if (!header) throw new Error('response has no refresh_token cookie');
  return header.slice(COOKIE_NAME.length + 1).split(';')[0] ?? '';
};

export const register = (
  app: Express,
  overrides: Record<string, unknown> = {},
): Promise<request.Response> =>
  request(app)
    .post('/api/auth/register')
    .send({ email: 'ann@example.com', password: PASSWORD, displayName: 'Ann', ...overrides });

export const login = (
  app: Express,
  overrides: Record<string, unknown> = {},
): Promise<request.Response> =>
  request(app)
    .post('/api/auth/login')
    .send({ email: 'ann@example.com', password: PASSWORD, ...overrides });

export const postRefresh = (
  app: Express,
  cookieValue: string | undefined,
  origin: string | undefined = TEST_APP_ORIGIN,
  body?: Record<string, unknown>,
): request.Test => {
  let req = request(app).post('/api/auth/refresh');
  if (origin) req = req.set('Origin', origin);
  if (cookieValue !== undefined) req = req.set('Cookie', `${COOKIE_NAME}=${cookieValue}`);
  return body ? req.send(body) : req;
};

export const postLogout = (
  app: Express,
  cookieValue: string | undefined,
  origin: string | undefined = TEST_APP_ORIGIN,
): request.Test => {
  let req = request(app).post('/api/auth/logout');
  if (origin) req = req.set('Origin', origin);
  if (cookieValue !== undefined) req = req.set('Cookie', `${COOKIE_NAME}=${cookieValue}`);
  return req;
};
