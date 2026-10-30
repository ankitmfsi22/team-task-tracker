import { describe, expect, it } from 'vitest';
import { canTransition, RoleSchema, TaskPrioritySchema, TaskStatusSchema } from './enums.js';

describe('enums', () => {
  it('lists the roles, statuses and priorities of the SDS', () => {
    expect(RoleSchema.options).toEqual(['OWNER', 'MEMBER']);
    expect(TaskStatusSchema.options).toEqual(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
    expect(TaskPrioritySchema.options).toEqual(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
  });

  it('rejects values outside the enums', () => {
    expect(RoleSchema.safeParse('ADMIN').success).toBe(false);
    expect(TaskStatusSchema.safeParse('todo').success).toBe(false);
    expect(TaskPrioritySchema.safeParse('CRITICAL').success).toBe(false);
  });
});

describe('canTransition', () => {
  it('allows one step forward or one step back', () => {
    expect(canTransition('TODO', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_REVIEW', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('DONE', 'IN_REVIEW')).toBe(true);
  });

  it('rejects skipping a step and staying in place', () => {
    expect(canTransition('TODO', 'IN_REVIEW')).toBe(false);
    expect(canTransition('TODO', 'DONE')).toBe(false);
    expect(canTransition('DONE', 'TODO')).toBe(false);
    expect(canTransition('TODO', 'TODO')).toBe(false);
  });
});
