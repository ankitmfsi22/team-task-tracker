import type { ErrorCode } from '@team-task-tracker/shared';

// Binding table: docs/SDS.md section 4. A new code needs an SDS change first.
export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  MALFORMED_JSON: 400,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ROUTE_NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  CONFLICT: 409,
  INVALID_STATUS_TRANSITION: 422,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_ERROR: 500,
};
