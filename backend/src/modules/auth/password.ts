import { hash, verify, type Algorithm } from '@node-rs/argon2';
import type { Env } from '../../config/env.js';

export interface PasswordHasher {
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (hash: string, password: string) => Promise<boolean>;
}

// Algorithm is an ambient const enum, unusable under verbatimModuleSyntax; 2 is Argon2id.
const ARGON2ID = 2 as Algorithm;

// Argon2id with the cost from the environment (OWASP minimum enforced by env.ts in production).
export const createPasswordHasher = (
  env: Pick<Env, 'ARGON2_MEMORY_KIB' | 'ARGON2_TIME_COST'>,
): PasswordHasher => {
  const options = {
    algorithm: ARGON2ID,
    memoryCost: env.ARGON2_MEMORY_KIB,
    timeCost: env.ARGON2_TIME_COST,
  };
  return {
    hashPassword: (password) => hash(password, options),
    // A malformed stored hash must read as "no match", never as a 500.
    verifyPassword: async (stored, password) => {
      try {
        return await verify(stored, password);
      } catch {
        return false;
      }
    },
  };
};
