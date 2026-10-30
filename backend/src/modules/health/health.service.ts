import type { HealthResponse } from '@team-task-tracker/shared';

export interface HealthService {
  check(): HealthResponse;
}

// Liveness only: it does not touch the database, so a container health check never fails
// because of a database restart.
export const createHealthService = (): HealthService => ({
  check: () => ({ status: 'ok' }),
});
