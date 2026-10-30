import { Router } from 'express';
import type { HealthController } from './health.controller.js';

export const createHealthRouter = ({ controller }: { controller: HealthController }): Router => {
  const router = Router();
  router.get('/health', controller.getHealth);
  return router;
};
