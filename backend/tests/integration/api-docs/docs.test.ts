import { ErrorResponseSchema } from '@team-task-tracker/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { loadOpenApiDocument } from '../../../src/modules/docs/openapi-document.js';
import { createTestApp, createTestEnv } from '../../support/test-app.js';

describe('Swagger UI at /api/docs', () => {
  it('serves the UI and the JSON spec without a token', async () => {
    const { app } = createTestApp();

    const ui = await request(app).get('/api/docs/').expect(200);
    expect(ui.headers['content-type']).toMatch(/text\/html/);
    expect(ui.text).toContain('swagger-ui');
    await request(app).get('/api/docs/swagger-ui-init.js').expect(200);

    const spec = await request(app).get('/api/docs/openapi.json').expect(200);
    expect(spec.headers['content-type']).toMatch(/application\/json/);
    expect(spec.body).toEqual(JSON.parse(JSON.stringify(loadOpenApiDocument())));
  });

  it('is not mounted when API_DOCS_ENABLED is false', async () => {
    const { app } = createTestApp({ env: createTestEnv({ API_DOCS_ENABLED: 'false' }) });

    for (const path of ['/api/docs/', '/api/docs/openapi.json']) {
      const response = await request(app).get(path).expect(404);
      expect(ErrorResponseSchema.parse(response.body).error.code).toBe('ROUTE_NOT_FOUND');
    }
  });

  it('the API still answers in the error envelope', async () => {
    const { app } = createTestApp();

    const unknown = await request(app).get('/api/nope').expect(404);
    expect(ErrorResponseSchema.parse(unknown.body).error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('relaxes the CSP for the docs only', async () => {
    const { app } = createTestApp();

    const docs = await request(app).get('/api/docs/');
    const health = await request(app).get('/api/health');

    const docsPolicy = String(docs.headers['content-security-policy']);
    const apiPolicy = String(health.headers['content-security-policy']);
    expect(docsPolicy).not.toContain('upgrade-insecure-requests');
    expect(docsPolicy).toContain("script-src 'self'");
    expect(apiPolicy).toContain('upgrade-insecure-requests');
    expect(apiPolicy).toContain("script-src 'self'");
  });
});
