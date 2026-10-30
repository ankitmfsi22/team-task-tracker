import { describe, expect, it } from 'vitest';
import {
  AuthResponseSchema,
  AuthUserSchema,
  LoginInputSchema,
  RegisterInputSchema,
} from './auth.js';

const user = { id: '0192f3a0-6f4e-7c1a-8b2d-3e4f5a6b7c8d', email: 'a@b.co', displayName: 'Ann' };

describe('auth schemas', () => {
  it('S-DEV1006-01 shared schemas validate and strip secrets', () => {
    const parsed = RegisterInputSchema.parse({
      email: '  Ann@Example.COM ',
      password: 'longenough',
      displayName: 'Ann',
    });
    expect(parsed.email).toBe('ann@example.com');

    const base = { email: 'ann@example.com', password: 'longenough', displayName: 'Ann' };
    expect(RegisterInputSchema.safeParse({ ...base, password: '1234567' }).success).toBe(false);
    expect(RegisterInputSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false);
    expect(RegisterInputSchema.safeParse({ ...base, displayName: '' }).success).toBe(false);
    expect(RegisterInputSchema.safeParse({ ...base, password: 'x'.repeat(129) }).success).toBe(
      false,
    );
    expect(LoginInputSchema.safeParse({ email: 'A@B.co', password: 'x' }).success).toBe(true);
    expect(LoginInputSchema.safeParse({ email: 'a@b.co' }).success).toBe(false);
    expect(AuthUserSchema.safeParse(user).success).toBe(true);

    expect(AuthResponseSchema.safeParse({ user, accessToken: 'jwt' }).success).toBe(true);
    const withHash = { ...user, passwordHash: '$argon2id$x' };
    expect(AuthResponseSchema.safeParse({ user: withHash, accessToken: 'jwt' }).success).toBe(
      false,
    );
    expect(
      AuthResponseSchema.safeParse({ user, accessToken: 'jwt', passwordHash: 'x' }).success,
    ).toBe(false);
  });
});
