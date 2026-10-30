import { describe, expect, it, vi } from 'vitest';
import type { AuthRepository } from './auth.repository.js';
import { createAuthService } from './auth.service.js';

const user = {
  id: 'u1',
  email: 'ann@example.com',
  displayName: 'Ann',
  passwordHash: 'stored-hash',
};

const build = (found: typeof user | null) => {
  const hashPassword = vi.fn(() => Promise.resolve('dummy-hash'));
  const verifyPassword = vi.fn(() => Promise.resolve(false));
  const repository = {
    findUserByEmail: vi.fn(() => Promise.resolve(found)),
  } as unknown as AuthRepository;
  const createService = () =>
    createAuthService({
      repository,
      clock: { now: () => new Date('2026-10-30T12:00:00Z') },
      passwords: { hashPassword, verifyPassword },
      tokens: { signAccessToken: vi.fn(), verifyAccessToken: vi.fn() },
    });
  return { createService, hashPassword, verifyPassword };
};

describe('auth service login timing', () => {
  it('S-DEV1006-28 both failure paths verify against a hash, dummy created eagerly', async () => {
    const eager = build(null);
    eager.createService();
    expect(eager.hashPassword).toHaveBeenCalledTimes(1);

    const unknown = build(null);
    await expect(
      unknown.createService().login({ email: user.email, password: 'x'.repeat(8) }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(unknown.verifyPassword).toHaveBeenCalledWith('dummy-hash', 'xxxxxxxx');

    const wrong = build(user);
    await expect(
      wrong.createService().login({ email: user.email, password: 'x'.repeat(8) }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(wrong.verifyPassword).toHaveBeenCalledWith('stored-hash', 'xxxxxxxx');
  });
});
