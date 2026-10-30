import {
  REFRESH_TOKEN_TTL_DAYS,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from '@team-task-tracker/shared';
import type { Clock } from '../../common/clock.js';
import { AppError } from '../../common/errors/app-error.js';
import type { AccessTokenService } from './access-token.js';
import type { AuthRepository, UserRecord } from './auth.repository.js';
import type { PasswordHasher } from './password.js';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.js';

export interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface AuthService {
  register: (input: RegisterInput) => Promise<Session>;
  login: (input: LoginInput) => Promise<Session>;
  refresh: (refreshToken: string | undefined) => Promise<Session>;
  logout: (refreshToken: string | undefined) => Promise<void>;
  me: (userId: string) => Promise<AuthUser>;
}

export interface AuthServiceDeps {
  repository: AuthRepository;
  clock: Clock;
  passwords: PasswordHasher;
  tokens: AccessTokenService;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const toAuthUser = (user: UserRecord): AuthUser => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
});

const unauthorized = () => new AppError('UNAUTHORIZED', 'Authentication required');

export const createAuthService = ({
  repository,
  clock,
  passwords,
  tokens,
}: AuthServiceDeps): AuthService => {
  // Verified against when the email is unknown, so both login failures cost one Argon2 run.
  let dummyHash: Promise<string> | undefined;
  const getDummyHash = () => (dummyHash ??= passwords.hashPassword('dummy-password-for-timing'));

  const refreshExpiry = () => new Date(clock.now().getTime() + REFRESH_TOKEN_TTL_DAYS * DAY_MS);

  const startSession = async (user: UserRecord): Promise<Session> => {
    const refreshToken = generateRefreshToken();
    await repository.createRefreshToken({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiry(),
    });
    return {
      user: toAuthUser(user),
      accessToken: await tokens.signAccessToken(user.id),
      refreshToken,
    };
  };

  const emailTaken = () => new AppError('EMAIL_TAKEN', 'Email is already registered');

  return {
    register: async (input) => {
      if (await repository.findUserByEmail(input.email)) throw emailTaken();
      const user = await repository.createUser({
        email: input.email,
        passwordHash: await passwords.hashPassword(input.password),
        displayName: input.displayName,
      });
      if (!user) throw emailTaken();
      return startSession(user);
    },

    login: async (input) => {
      const user = await repository.findUserByEmail(input.email);
      const hash = user?.passwordHash ?? (await getDummyHash());
      const matches = await passwords.verifyPassword(hash, input.password);
      if (!user || !matches) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password');
      }
      return startSession(user);
    },

    refresh: async (presented) => {
      if (!presented) throw unauthorized();
      const now = clock.now();
      const stored = await repository.findRefreshTokenByHash(hashRefreshToken(presented));
      if (!stored) throw unauthorized();
      if (stored.rotatedAt) {
        // A rotated token came back: assume theft and end every session of the user.
        await repository.revokeAllForUser(stored.userId, now);
        throw unauthorized();
      }
      if (stored.revokedAt || stored.expiresAt <= now) throw unauthorized();

      const user = await repository.findUserById(stored.userId);
      if (!user) throw unauthorized();
      const next = generateRefreshToken();
      const rotated = await repository.rotateRefreshToken(
        stored.id,
        { userId: user.id, tokenHash: hashRefreshToken(next), expiresAt: refreshExpiry() },
        now,
      );
      if (!rotated) {
        await repository.revokeAllForUser(stored.userId, now);
        throw unauthorized();
      }
      return {
        user: toAuthUser(user),
        accessToken: await tokens.signAccessToken(user.id),
        refreshToken: next,
      };
    },

    logout: async (presented) => {
      if (!presented) return;
      await repository.revokeRefreshTokenByHash(hashRefreshToken(presented), clock.now());
    },

    me: async (userId) => {
      const user = await repository.findUserById(userId);
      if (!user) throw unauthorized();
      return toAuthUser(user);
    },
  };
};
