import type { z } from 'zod';
import type {
  AuthResponseSchema,
  AuthUserSchema,
  LoginInputSchema,
  RegisterInputSchema,
} from './schemas/auth.js';
import type {
  ErrorCodeSchema,
  ErrorDetailSchema,
  ErrorResponseSchema,
  IdSchema,
  PaginationQuerySchema,
} from './schemas/common.js';
import type { RoleSchema, TaskPrioritySchema, TaskStatusSchema } from './schemas/enums.js';
import type { HealthResponseSchema } from './schemas/health.js';

export type Id = z.infer<typeof IdSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type Role = z.infer<typeof RoleSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
