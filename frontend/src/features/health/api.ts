import { HealthResponseSchema } from '@team-task-tracker/shared';
import { apiFetch } from '@/lib/api-client';

export const fetchHealth = () => apiFetch('/health', HealthResponseSchema);
