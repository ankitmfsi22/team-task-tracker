import { ACCESS_TOKEN_TTL_SECONDS } from '@team-task-tracker/shared';
import { jwtVerify, SignJWT } from 'jose';
import type { Env } from '../../config/env.js';

export interface AccessTokenService {
  signAccessToken: (userId: string) => Promise<string>;
  // Rejects when the token is malformed, expired, has another algorithm or the wrong signature.
  verifyAccessToken: (token: string) => Promise<{ userId: string }>;
}

export const createAccessTokenService = (
  env: Pick<Env, 'JWT_ACCESS_SECRET'>,
): AccessTokenService => {
  const key = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  return {
    signAccessToken: (userId) =>
      new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(`${String(ACCESS_TOKEN_TTL_SECONDS)}s`)
        .sign(key),
    verifyAccessToken: async (token) => {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
        requiredClaims: ['sub', 'exp'],
      });
      if (typeof payload.sub !== 'string') throw new Error('access token has no subject');
      return { userId: payload.sub };
    },
  };
};
