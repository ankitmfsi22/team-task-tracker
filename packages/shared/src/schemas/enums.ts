import { z } from 'zod';

export const RoleSchema = z.enum(['OWNER', 'MEMBER']);

export const TaskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);

export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Board order of the statuses. A task moves one step forward or one step back (SDS section 5).
export const TASK_STATUS_ORDER = TaskStatusSchema.options;

export const canTransition = (
  from: z.infer<typeof TaskStatusSchema>,
  to: z.infer<typeof TaskStatusSchema>,
): boolean => Math.abs(TASK_STATUS_ORDER.indexOf(from) - TASK_STATUS_ORDER.indexOf(to)) === 1;
