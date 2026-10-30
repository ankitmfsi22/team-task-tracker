import { SignJWT, jwtVerify } from 'jose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  COOKIE_NAME,
  EVIL_ORIGIN,
  PASSWORD,
  TEST_APP_ORIGIN,
  createAuthApp,
  login,
  postLogout,
  postRefresh,
  refreshCookieHeader,
  refreshCookieValue,
  register,
  setCookiesOf,
  sha256Hex,
} from '../../support/auth.js';
import { useTestDatabase } from '../../support/db.js';

// Isolation: useTestDatabase() truncates every table before each test, so each test starts empty.
const prisma = useTestDatabase();

const errorOf = (res: request.Response) =>
  (res.body as { error: { code: string; message: string; details?: { field: string }[] } }).error;

describe('POST /api/auth/register', () => {
  it('S-DEV1006-02 register creates the account', async () => {
    const { app } = createAuthApp(prisma);
    const res = await register(app);

    expect(res.status).toBe(201);
    const body = res.body as { user: Record<string, unknown>; accessToken: string };
    expect(body.user).toEqual({
      id: expect.any(String) as string,
      email: 'ann@example.com',
      displayName: 'Ann',
    });
    expect(typeof body.accessToken).toBe('string');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(refreshCookieHeader(res)).toBeDefined();
  });

  it('S-DEV1006-03 password is stored as Argon2id hash', async () => {
    const { app } = createAuthApp(prisma);
    await register(app);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'ann@example.com' } });
    expect(stored.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(stored.passwordHash).not.toContain(PASSWORD);
  });

  it('S-DEV1006-04 register validation failure', async () => {
    const { app } = createAuthApp(prisma);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nope', password: 'short' });

    expect(res.status).toBe(422);
    expect(errorOf(res).code).toBe('VALIDATION_ERROR');
    const fields = (errorOf(res).details ?? []).map((detail) => detail.field);
    expect(fields).toEqual(expect.arrayContaining(['email', 'password', 'displayName']));
    expect(await prisma.user.count()).toBe(0);
  });

  it('S-DEV1006-05 duplicate email conflicts', async () => {
    const { app } = createAuthApp(prisma);
    await register(app);
    const res = await register(app, { email: 'ANN@Example.com' });

    expect(res.status).toBe(409);
    expect(errorOf(res).code).toBe('EMAIL_TAKEN');
    expect(await prisma.user.count()).toBe(1);
  });
});

describe('POST /api/auth/login', () => {
  it('S-DEV1006-06 login succeeds', async () => {
    const { app } = createAuthApp(prisma);
    await register(app);
    await prisma.refreshToken.deleteMany();
    const res = await login(app);

    expect(res.status).toBe(200);
    const body = res.body as { user: { email: string }; accessToken: string };
    expect(body.user.email).toBe('ann@example.com');
    expect(typeof body.accessToken).toBe('string');
    const rows = await prisma.refreshToken.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).toBe(sha256Hex(refreshCookieValue(res)));
    expect(rows[0]?.tokenHash).not.toBe(refreshCookieValue(res));
  });

  it('S-DEV1006-07 wrong password is rejected', async () => {
    const { app } = createAuthApp(prisma);
    await register(app);
    const res = await login(app, { password: 'wrong password!' });

    expect(res.status).toBe(401);
    expect(errorOf(res).code).toBe('INVALID_CREDENTIALS');
    expect(setCookiesOf(res)).toEqual([]);
  });

  it('S-DEV1006-08 unknown email is indistinguishable', async () => {
    const { app } = createAuthApp(prisma);
    await register(app);
    const wrong = await login(app, { password: 'wrong password!' });
    const unknown = await login(app, { email: 'nobody@example.com' });

    expect(unknown.status).toBe(wrong.status);
    expect(errorOf(unknown).code).toBe('INVALID_CREDENTIALS');
    expect(errorOf(unknown).message).toBe(errorOf(wrong).message);
  });

  it('S-DEV1006-09 login validation failure', async () => {
    const { app } = createAuthApp(prisma);
    const noPassword = await request(app).post('/api/auth/login').send({ email: 'a@b.co' });
    const badEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: PASSWORD });

    expect(noPassword.status).toBe(422);
    expect(errorOf(noPassword).code).toBe('VALIDATION_ERROR');
    expect(badEmail.status).toBe(422);
    expect(errorOf(badEmail).code).toBe('VALIDATION_ERROR');
  });
});

describe('tokens and cookie', () => {
  it('S-DEV1006-10 access token claims', async () => {
    const { app, env } = createAuthApp(prisma);
    await register(app);
    const res = await login(app);
    const body = res.body as { user: { id: string }; accessToken: string };

    const { payload, protectedHeader } = await jwtVerify(
      body.accessToken,
      new TextEncoder().encode(env.JWT_ACCESS_SECRET),
      { algorithms: ['HS256'] },
    );
    expect(protectedHeader.alg).toBe('HS256');
    expect(payload.sub).toBe(body.user.id);
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(900);
    expect(refreshCookieValue(res)).not.toBe(body.accessToken);
  });

  it('S-DEV1006-11 cookie attributes', async () => {
    const { app } = createAuthApp(prisma);
    await register(app);
    const header = refreshCookieHeader(await login(app)) ?? '';

    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Strict');
    expect(header).toContain('Path=/api/auth');
    expect(header).toContain('Max-Age=604800');
    expect(header).not.toContain('Secure');

    const secure = createAuthApp(prisma, { COOKIE_SECURE: 'true' });
    const secureHeader = refreshCookieHeader(await login(secure.app)) ?? '';
    expect(secureHeader).toContain('Secure');
  });
});

describe('POST /api/auth/refresh', () => {
  it('S-DEV1006-12 refresh rotates the token', async () => {
    const { app } = createAuthApp(prisma);
    const first = await register(app);
    const oldCookie = refreshCookieValue(first);
    const res = await postRefresh(app, oldCookie, TEST_APP_ORIGIN);

    expect(res.status).toBe(200);
    expect(typeof (res.body as { accessToken: string }).accessToken).toBe('string');
    const newCookie = refreshCookieValue(res);
    expect(newCookie).not.toBe(oldCookie);

    const oldRow = await prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: sha256Hex(oldCookie) },
    });
    expect(oldRow.rotatedAt).not.toBeNull();
    expect(oldRow.revokedAt).not.toBeNull();
    const newRow = await prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: sha256Hex(newCookie) },
    });
    expect(newRow.revokedAt).toBeNull();
    expect(newRow.rotatedAt).toBeNull();
  });

  it('S-DEV1006-13 reuse of a rotated token revokes the family', async () => {
    const { app } = createAuthApp(prisma);
    const oldCookie = refreshCookieValue(await register(app));
    const rotated = await postRefresh(app, oldCookie);
    const newCookie = refreshCookieValue(rotated);

    const reuse = await postRefresh(app, oldCookie);
    expect(reuse.status).toBe(401);
    expect(errorOf(reuse).code).toBe('UNAUTHORIZED');

    const newRow = await prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: sha256Hex(newCookie) },
    });
    expect(newRow.revokedAt).not.toBeNull();
    const next = await postRefresh(app, newCookie);
    expect(next.status).toBe(401);
    expect(errorOf(next).code).toBe('UNAUTHORIZED');
  });

  it('S-DEV1006-14 missing, unknown or expired refresh token', async () => {
    const { app } = createAuthApp(prisma);
    const cookie = refreshCookieValue(await register(app));
    await prisma.refreshToken.updateMany({ data: { expiresAt: new Date('2020-01-01T00:00:00Z') } });

    const responses = [
      await postRefresh(app, undefined),
      await postRefresh(app, 'random-unknown-value'),
      await postRefresh(app, cookie),
    ];
    for (const res of responses) {
      expect(res.status).toBe(401);
      expect(errorOf(res).code).toBe('UNAUTHORIZED');
      const cleared = refreshCookieHeader(res) ?? '';
      expect(cleared).toMatch(/refresh_token=;/);
      expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
    }
  });

  it('S-DEV1006-15 refresh from a foreign origin is forbidden', async () => {
    const { app } = createAuthApp(prisma);
    const cookie = refreshCookieValue(await register(app));
    const res = await postRefresh(app, cookie, EVIL_ORIGIN);

    expect(res.status).toBe(403);
    expect(errorOf(res).code).toBe('FORBIDDEN');
    const row = await prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: sha256Hex(cookie) },
    });
    expect(row.rotatedAt).toBeNull();
    expect(row.revokedAt).toBeNull();
  });

  it('S-DEV1006-16 refresh has no body to validate', async () => {
    const { app } = createAuthApp(prisma);
    const cookie = refreshCookieValue(await register(app));
    const res = await postRefresh(app, cookie, TEST_APP_ORIGIN, { unexpected: ['junk', 1] });

    expect(res.status).toBe(200);
    expect(refreshCookieValue(res)).not.toBe(cookie);
  });
});

describe('POST /api/auth/logout', () => {
  it('S-DEV1006-17 logout revokes and clears', async () => {
    const { app } = createAuthApp(prisma);
    const cookie = refreshCookieValue(await register(app));
    const res = await postLogout(app, cookie);

    expect(res.status).toBe(204);
    const cleared = refreshCookieHeader(res) ?? '';
    expect(cleared).toMatch(/refresh_token=;/);
    const row = await prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: sha256Hex(cookie) },
    });
    expect(row.revokedAt).not.toBeNull();
    const later = await postRefresh(app, cookie);
    expect(later.status).toBe(401);
    expect(errorOf(later).code).toBe('UNAUTHORIZED');
  });

  it('S-DEV1006-18 logout without a cookie is idempotent', async () => {
    const { app } = createAuthApp(prisma);
    const res = await postLogout(app, undefined);
    expect(res.status).toBe(204);
  });

  it('S-DEV1006-19 logout from a foreign origin is forbidden', async () => {
    const { app } = createAuthApp(prisma);
    const cookie = refreshCookieValue(await register(app));
    const res = await postLogout(app, cookie, EVIL_ORIGIN);

    expect(res.status).toBe(403);
    expect(errorOf(res).code).toBe('FORBIDDEN');
    const row = await prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: sha256Hex(cookie) },
    });
    expect(row.revokedAt).toBeNull();
  });
});

describe('GET /api/auth/me', () => {
  const sign = (secret: string, userId: string, opts: { exp?: string | number } = {}) =>
    new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? '15m')
      .sign(new TextEncoder().encode(secret));

  it('S-DEV1006-20 me returns the caller', async () => {
    const { app } = createAuthApp(prisma);
    const { user, accessToken } = (await register(app)).body as {
      user: { id: string };
      accessToken: string;
    };
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: user.id, email: 'ann@example.com', displayName: 'Ann' });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('S-DEV1006-21 me without a token', async () => {
    const { app } = createAuthApp(prisma);
    const { accessToken } = (await register(app)).body as { accessToken: string };

    const none = await request(app).get('/api/auth/me');
    const basic = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Basic ${accessToken}`);
    expect(none.status).toBe(401);
    expect(errorOf(none).code).toBe('UNAUTHORIZED');
    expect(basic.status).toBe(401);
    expect(errorOf(basic).code).toBe('UNAUTHORIZED');
  });

  it('S-DEV1006-22 me with a bad token', async () => {
    const { app, env } = createAuthApp(prisma);
    const { user } = (await register(app)).body as { user: { id: string } };
    const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
      JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 600 }),
    ).toString('base64url')}.`;
    const gone = await sign(env.JWT_ACCESS_SECRET, '0192f3a0-6f4e-7c1a-8b2d-3e4f5a6b7c8d');

    const tokens = [
      await sign(env.JWT_ACCESS_SECRET, user.id, { exp: Math.floor(Date.now() / 1000) - 60 }),
      await sign('another-secret-that-is-at-least-32-bytes!!', user.id),
      unsigned,
      gone,
    ];
    for (const token of tokens) {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
      expect(errorOf(res).code).toBe('UNAUTHORIZED');
    }
    expect(COOKIE_NAME).toBe('refresh_token');
  });
});
