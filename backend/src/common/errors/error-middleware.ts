import type { ErrorResponse } from '@team-task-tracker/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';
import { AppError } from './app-error.js';
import { ERROR_STATUS } from './error-status.js';

const UNPARSEABLE_BODY_TYPES = new Set([
  'entity.parse.failed',
  'encoding.unsupported',
  'charset.unsupported',
  'request.aborted',
  'request.size.invalid',
]);

// body-parser (inside express.json) reports problems as http-errors with a `type`.
const fromBodyParser = (err: unknown): AppError | undefined => {
  if (typeof err !== 'object' || err === null || !('type' in err)) return undefined;
  if (err.type === 'entity.too.large') {
    return new AppError('PAYLOAD_TOO_LARGE', 'Request body is too large');
  }
  if (typeof err.type === 'string' && UNPARSEABLE_BODY_TYPES.has(err.type)) {
    return new AppError('MALFORMED_JSON', 'Request body could not be parsed');
  }
  return undefined;
};

// Prisma errors carry `meta` that can hold passwordHash or tokenHash: never log the raw error.
const describeError = (err: unknown) => {
  if (!(err instanceof Error)) return { message: String(err) };
  const code = 'code' in err ? err.code : undefined;
  return {
    name: err.name,
    ...(typeof code === 'string' || typeof code === 'number' ? { code } : {}),
    message: err.message,
    stack: err.stack,
  };
};

export const notFoundHandler: RequestHandler = () => {
  throw new AppError('ROUTE_NOT_FOUND', 'Route not found');
};

export const createErrorHandler =
  (logger: Logger): ErrorRequestHandler =>
  (err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    const requestId = typeof req.id === 'string' ? req.id : 'unknown';
    const known = err instanceof AppError ? err : fromBodyParser(err);
    const appError = known ?? new AppError('INTERNAL_ERROR', 'Internal server error');
    const status = ERROR_STATUS[appError.code];
    if (!known || status >= 500) {
      logger.error({ error: describeError(err), requestId }, 'unhandled error');
    }
    const body: ErrorResponse = {
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details ? { details: appError.details } : {}),
        requestId,
      },
    };
    res.status(status).json(body);
  };
