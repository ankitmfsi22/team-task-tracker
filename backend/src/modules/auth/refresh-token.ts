import { createHash, randomBytes } from 'node:crypto';

// 32 random bytes, base64url. Only the SHA-256 hex digest is ever stored.
export const generateRefreshToken = (): string => randomBytes(32).toString('base64url');

export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
