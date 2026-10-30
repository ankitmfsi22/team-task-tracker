import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ErrorCodeSchema,
  ErrorResponseSchema,
  IdSchema,
  PaginationQuerySchema,
  paginated,
} from './common.js';
import { z } from 'zod';

describe('ErrorCodeSchema', () => {
  it('matches the ErrorCode enum in docs/api/openapi.yaml', () => {
    const yaml = readFileSync(
      new URL('../../../../docs/api/openapi.yaml', import.meta.url),
      'utf8',
    );
    const block = /\n {4}ErrorCode:\n[\s\S]*?\n {6}enum:\n((?: {8}- \w+\n)+)/.exec(yaml);
    expect(block).not.toBeNull();
    const codes = [...(block?.[1] ?? '').matchAll(/- (\w+)/g)].map((match) => match[1]);
    expect(codes).toEqual(ErrorCodeSchema.options);
  });

  it('rejects a code that is not in the table', () => {
    expect(ErrorCodeSchema.safeParse('TEAPOT').success).toBe(false);
  });
});

describe('ErrorResponseSchema', () => {
  const base = { code: 'VALIDATION_ERROR', message: 'Request validation failed', requestId: 'r-1' };

  it('accepts a validation error with details', () => {
    const body = { error: { ...base, details: [{ field: 'email', message: 'Invalid email' }] } };
    expect(ErrorResponseSchema.safeParse(body).success).toBe(true);
  });

  it('accepts an error without details', () => {
    const body = { error: { ...base, code: 'NOT_FOUND', message: 'Task not found' } };
    expect(ErrorResponseSchema.safeParse(body).success).toBe(true);
  });

  it('rejects an unknown code', () => {
    expect(ErrorResponseSchema.safeParse({ error: { ...base, code: 'NOPE' } }).success).toBe(false);
  });

  it('rejects a body without requestId', () => {
    const { requestId: _requestId, ...withoutRequestId } = base;
    expect(ErrorResponseSchema.safeParse({ error: withoutRequestId }).success).toBe(false);
  });
});

describe('IdSchema', () => {
  it('accepts a UUID', () => {
    expect(IdSchema.safeParse('0192f3f0-7b1e-7a3c-9d2e-3c5f1a2b4d6e').success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    expect(IdSchema.safeParse('not-an-id').success).toBe(false);
  });
});

describe('PaginationQuerySchema', () => {
  it('applies defaults and coerces text numbers', () => {
    expect(PaginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(PaginationQuerySchema.parse({ page: '2', pageSize: '50' })).toEqual({
      page: 2,
      pageSize: 50,
    });
  });

  it('rejects a page size above the maximum and a page below 1', () => {
    expect(PaginationQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(PaginationQuerySchema.safeParse({ page: '0' }).success).toBe(false);
  });
});

describe('paginated', () => {
  it('wraps an item schema in the pagination envelope', () => {
    const schema = paginated(z.string());
    const body = { items: ['a'], page: 1, pageSize: 20, total: 1, totalPages: 1 };
    expect(schema.safeParse(body).success).toBe(true);
    expect(schema.safeParse({ ...body, items: [1] }).success).toBe(false);
  });
});
