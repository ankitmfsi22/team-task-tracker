import type { PrismaClient } from '../../generated/prisma/client.js';

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  rotatedAt: Date | null;
}

export interface NewRefreshToken {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface AuthRepository {
  findUserByEmail: (email: string) => Promise<UserRecord | null>;
  findUserById: (id: string) => Promise<UserRecord | null>;
  // Returns null when the email is already taken (unique violation).
  createUser: (data: {
    email: string;
    passwordHash: string;
    displayName: string;
  }) => Promise<UserRecord | null>;
  createRefreshToken: (data: NewRefreshToken) => Promise<void>;
  findRefreshTokenByHash: (tokenHash: string) => Promise<RefreshTokenRecord | null>;
  // Marks `current` rotated and inserts `next` atomically. False when `current` was already
  // revoked by a concurrent request, in which case nothing is inserted.
  rotateRefreshToken: (current: string, next: NewRefreshToken, now: Date) => Promise<boolean>;
  revokeRefreshTokenByHash: (tokenHash: string, now: Date) => Promise<void>;
  revokeAllForUser: (userId: string, now: Date) => Promise<void>;
}

const USER_SELECT = { id: true, email: true, displayName: true, passwordHash: true } as const;
const UNIQUE_VIOLATION = 'P2002';

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === UNIQUE_VIOLATION;

export const createAuthRepository = ({ prisma }: { prisma: PrismaClient }): AuthRepository => ({
  findUserByEmail: (email) => prisma.user.findUnique({ where: { email }, select: USER_SELECT }),
  findUserById: (id) => prisma.user.findUnique({ where: { id }, select: USER_SELECT }),

  createUser: async (data) => {
    try {
      return await prisma.user.create({ data, select: USER_SELECT });
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  },

  createRefreshToken: async (data) => {
    await prisma.refreshToken.create({ data });
  },

  findRefreshTokenByHash: (tokenHash) =>
    prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true, rotatedAt: true },
    }),

  rotateRefreshToken: (current, next, now) =>
    prisma.$transaction(async (tx) => {
      const { count } = await tx.refreshToken.updateMany({
        where: { id: current, revokedAt: null },
        data: { revokedAt: now, rotatedAt: now },
      });
      if (count === 0) return false;
      await tx.refreshToken.create({ data: next });
      return true;
    }),

  revokeRefreshTokenByHash: async (tokenHash, now) => {
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: now },
    });
  },

  revokeAllForUser: async (userId, now) => {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
  },
});
