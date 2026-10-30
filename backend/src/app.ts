import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import type { Clock } from './common/clock.js';
import { createErrorHandler, notFoundHandler } from './common/errors/error-middleware.js';
import { createRequestLogger } from './common/http/request-logging.js';
import { createRequireAuth } from './common/http/require-auth.js';
import { createRequireOrigin } from './common/http/require-origin.js';
import type { Env } from './config/env.js';
import type { PrismaClient } from './generated/prisma/client.js';
import { createAccessTokenService } from './modules/auth/access-token.js';
import { createAuthController } from './modules/auth/auth.controller.js';
import { createAuthRepository } from './modules/auth/auth.repository.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createPasswordHasher } from './modules/auth/password.js';
import { createDocsRouter } from './modules/docs/docs.routes.js';
import { loadOpenApiDocument, type OpenApiDocument } from './modules/docs/openapi-document.js';
import { createHealthController } from './modules/health/health.controller.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { createHealthService } from './modules/health/health.service.js';

export interface AppDeps {
  // Feature modules build their repositories from this client. The skeleton has no database route.
  prisma: PrismaClient;
  clock: Clock;
  env: Env;
  logger: Logger;
  // Tests may inject a document; otherwise docs/api/openapi.yaml is read when the docs are on.
  openApiDocument?: OpenApiDocument;
}

export const createApp = (deps: AppDeps): Express => {
  const app = express();
  app.disable('x-powered-by');

  app.use(createRequestLogger(deps.logger));
  // Before the strict helmet below: the docs router brings its own, with the CSP Swagger UI needs.
  if (deps.env.API_DOCS_ENABLED) {
    app.use(
      '/api/docs',
      createDocsRouter({ document: deps.openApiDocument ?? loadOpenApiDocument() }),
    );
  }
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Routes -> controller -> service -> repository. Modules are wired here, one block per module.
  const healthController = createHealthController({ service: createHealthService() });
  app.use('/api', createHealthRouter({ controller: healthController }));

  const authService = createAuthService({
    repository: createAuthRepository({ prisma: deps.prisma }),
    clock: deps.clock,
    passwords: createPasswordHasher(deps.env),
    tokens: createAccessTokenService(deps.env),
  });
  app.use(
    '/api/auth',
    createAuthRouter({
      controller: createAuthController({ service: authService, env: deps.env }),
      requireAuth: createRequireAuth({ env: deps.env }),
      requireOrigin: createRequireOrigin({ env: deps.env }),
    }),
  );

  app.use(notFoundHandler);
  app.use(createErrorHandler(deps.logger));
  return app;
};
