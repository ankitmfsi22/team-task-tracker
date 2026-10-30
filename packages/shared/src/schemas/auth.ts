import { z } from 'zod';

const EmailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const RegisterInputSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(100),
});

export const LoginInputSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(128),
});

// Strict on purpose: a stray field such as passwordHash must fail, never pass through.
export const AuthUserSchema = z.strictObject({
  id: z.uuid(),
  email: z.string(),
  displayName: z.string(),
});

export const AuthResponseSchema = z.strictObject({
  user: AuthUserSchema,
  accessToken: z.string().min(1),
});
