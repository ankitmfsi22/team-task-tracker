import { describe, expect, it } from 'vitest';
import { createTestEnv } from '../../../tests/support/test-app.js';
import { createPasswordHasher } from './password.js';

describe('password hasher (Argon2id)', () => {
  const { hashPassword, verifyPassword } = createPasswordHasher(createTestEnv());

  it('hashes to an Argon2id PHC string that verifies only the right password', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain('correct horse battery');
    expect(await verifyPassword(hash, 'correct horse battery')).toBe(true);
    expect(await verifyPassword(hash, 'wrong password')).toBe(false);
  });

  it('salts: the same password hashes differently each time', async () => {
    expect(await hashPassword('same-password-1')).not.toBe(await hashPassword('same-password-1'));
  });
});
