import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { createTestEnv } from '../../../tests/support/test-app.js';
import { createAccessTokenService } from './access-token.js';

const USER_ID = '0192f3a0-6f4e-7c1a-8b2d-3e4f5a6b7c8d';

describe('access token service (jose HS256)', () => {
  const env = createTestEnv();
  const tokens = createAccessTokenService(env);

  it('signs a token that verifies back to the user id', async () => {
    const token = await tokens.signAccessToken(USER_ID);
    expect(await tokens.verifyAccessToken(token)).toEqual({ userId: USER_ID });
  });

  it('rejects a token signed with another secret', async () => {
    const forged = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(USER_ID)
      .setExpirationTime('15m')
      .sign(
        new TextEncoder().encode(
          ['not-a-secret', 'wrong-signing-key', 'padded-to-32-bytes!!'].join('-'),
        ),
      );
    await expect(tokens.verifyAccessToken(forged)).rejects.toThrow();
  });

  it('rejects garbage', async () => {
    await expect(tokens.verifyAccessToken('not.a.jwt')).rejects.toThrow();
  });
});
