import { HealthResponseSchema } from '@team-task-tracker/shared';
import type { RequestHandler } from 'express';
import type { HealthService } from './health.service.js';

export interface HealthController {
  getHealth: RequestHandler;
}

export const createHealthController = ({
  service,
}: {
  service: HealthService;
}): HealthController => ({
  getHealth: (_req, res) => {
    res.json(HealthResponseSchema.parse(service.check()));
  },
});
