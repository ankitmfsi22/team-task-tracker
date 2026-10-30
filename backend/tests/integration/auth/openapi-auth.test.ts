import { describe, expect, it } from 'vitest';
import { loadOpenApiDocument } from '../../../src/modules/docs/openapi-document.js';

type Operation = { responses?: Record<string, unknown> };

describe('docs/api/openapi.yaml auth paths', () => {
  it('S-DEV1006-24 openapi lists every auth route', () => {
    const document = loadOpenApiDocument();
    const paths = document['paths'] as Record<string, Record<string, Operation>>;
    const expected: [string, string, string[]][] = [
      ['/auth/register', 'post', ['201', '409', '422']],
      ['/auth/login', 'post', ['200', '401', '422']],
      ['/auth/refresh', 'post', ['200', '401', '403']],
      ['/auth/logout', 'post', ['204', '403']],
      ['/auth/me', 'get', ['200', '401']],
    ];
    for (const [path, method, statuses] of expected) {
      const operation = paths[path]?.[method];
      expect(operation, `${method} ${path} documented`).toBeDefined();
      for (const status of statuses) {
        expect(operation?.responses, `${method} ${path} ${status}`).toHaveProperty(status);
      }
    }
    const schemas = (document['components'] as { schemas: Record<string, unknown> }).schemas;
    expect(schemas).toHaveProperty('AuthResponse');
    expect(schemas).toHaveProperty('AuthUser');
  });
});
