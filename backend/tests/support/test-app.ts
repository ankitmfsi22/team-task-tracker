import { Writable } from 'node:stream';
import { createApp, type AppDeps } from '../../src/app.js';
import { createLogger } from '../../src/common/logger.js';
import { loadEnv } from '../../src/config/env.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';

export const TEST_DATABASE_URL =
  process.env['TEST_DATABASE_URL'] ??
  'postgresql://tasktracker:tasktracker_test_only@localhost:5433/tasktracker_test';

export const fixedClock = (iso: string): AppDeps['clock'] => ({ now: () => new Date(iso) });

// A clock the test moves forward by hand, so expiry never needs a sleep.
export const createMutableClock = (iso: string) => {
  let current = new Date(iso);
  return {
    now: (): Date => new Date(current),
    advanceMs: (ms: number): void => {
      current = new Date(current.getTime() + ms);
    },
  };
};

export const createLogCapture = () => {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  return { stream, text: () => lines.join(''), lines: () => lines };
};

// A PrismaClient that fails loudly when used, for tests that must not touch the database.
const unusablePrisma = new Proxy(
  {},
  {
    get() {
      throw new Error('PrismaClient must not be used in this test');
    },
  },
) as PrismaClient;

export const TEST_APP_ORIGIN = 'http://localhost:5173';

// Cheap Argon2 parameters keep the suite fast (SDS section 9).
export const createTestEnv = (overrides: Record<string, string> = {}) =>
  loadEnv({
    NODE_ENV: 'test',
    DATABASE_URL: TEST_DATABASE_URL,
    LOG_LEVEL: 'info',
    JWT_ACCESS_SECRET: 'test-only-jwt-access-secret-at-least-32-bytes',
    APP_ORIGIN: TEST_APP_ORIGIN,
    ARGON2_MEMORY_KIB: '1024',
    ARGON2_TIME_COST: '1',
    ...overrides,
  });

export const createTestApp = (overrides: Partial<AppDeps> = {}) => {
  const logs = createLogCapture();
  const env = overrides.env ?? createTestEnv();
  const app = createApp({
    prisma: unusablePrisma,
    clock: fixedClock('2026-10-30T12:00:00.000Z'),
    logger: createLogger(env, logs.stream),
    ...overrides,
    env,
  });
  return { app, logs, env };
};
